import * as fs from 'fs';
import * as path from 'path';
import { parseCertificateSimple } from '../../../common/src/utils/certificate_parsing/parseCertificateSimple';

// Function to convert DER to PEM
function derToPem(derBuffer: Buffer): string {
  const base64 = derBuffer.toString('base64');
  const pem = `-----BEGIN CERTIFICATE-----\n${base64.match(/.{1,64}/g)!.join('\n')}\n-----END CERTIFICATE-----\n`;
  return pem;
}

export const findSequenceMatches = (haystack: number[], needle: number[]): {count: number, indexes: number[]} => {
  const matches: number[] = [];
  for (let i = 0; i < haystack.length - needle.length + 1; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      matches.push(i);
    }
  }
  return {
    count: matches.length,
    indexes: matches
  };
};


export async function extractMasterlistCsca() {
  const csca_path = path.join(__dirname, '..', '..', 'outputs', 'csca');
  const uniqueCertsDir = path.join(csca_path, 'mock_pem_masterlist');

  if (!fs.existsSync(uniqueCertsDir)) {
    console.error(`Directory ${uniqueCertsDir} does not exist.`);
    return;
  }

  const certificateFiles = fs.readdirSync(uniqueCertsDir).filter(file => file.endsWith('.pem'));
  const certArray: string[] = certificateFiles.map(file => {
    const filePath = path.join(uniqueCertsDir, file);
    return fs.readFileSync(filePath, 'utf-8');
  });

  console.log(`Read ${certArray.length} certificates.`);
  const overallSequenceMatchCounts = [0, 0, 0]; // Initialize counters for each sequence
  const multipleMatches = [];
  const bytesBeforeSequenceMap = new Map<string, {count: number, bitSize: number}>();
  const bytesBeforeSequenceTbsMap = new Map<string, number[]>();

  for (let i = 0; i < certArray.length; i++) {
    const pemContent = certArray[i];
    const parsed = parseCertificateSimple(pemContent);
    if (parsed.signatureAlgorithm === 'rsa' || parsed.signatureAlgorithm === 'rsapss') {
      continue;
    }
    let matchCount = 0;
    
    const tbsBytesArray = Array.from(parsed.tbsBytes);

    const sequences = [
      // [2, 130, 1, 1, 0], // 2048 bits, 8 matches
      // [2, 130, 2, 1, 0], // 4096 bits, 509 matches
      // [2, 130, 1, 129, 0], // 3072 bits, 81 matches
      // [2, 130, 3, 1, 0], // 6144 bits, 10 matches. Moldova. Not supported.


      // ECDSA
      [48, 60, 4, 28], // 224 bits
      [48, 68, 4, 32], // 256 bits,
      [48, 100, 4, 48], // 384 bits,
      [48, 129, 132, 4], // 512 bits,
      [48, 129, 135, 4], // 521 bits,
      [48, 91, 4, 32], // 256 bits, 3 fields (Russia)
      [48, 125, 4, 49], // 384 bits, 3 fields (Moldova)
      [48, 123, 4, 48], // 384 bits, 3 fields (GB)
      [48, 129, 136, 4], // 521 bits, 3 fields (Iceland)
      [35, 3, 129, 134], // 576, 625 Turkey is doing something weird
      [0, 34, 3, 98], // 633, 676, 678 Algeria and Israel


      // TEST
      [1, 5, 3, 58], // brainpool 224
      [0, 33, 3, 58], // secp 224
      [1, 7, 3, 66], // brainpool 256
      [1, 11, 3, 98], // brainpool 384
      [1, 13, 3, 129] // brainpool 521
    ];

    // const bitSizes = [2048, 4096, 3072];
    const bitSizes = [224, 256, 384, 512, 521, 256, 384, 384, 521, 521, 384, 224, 256, 224, 384, 521];

    sequences.forEach((sequence, index) => {
      const {count: currentMatchCount, indexes} = findSequenceMatches(tbsBytesArray, sequence);
      
      if (currentMatchCount > 0) {
        matchCount += currentMatchCount;
        overallSequenceMatchCounts[index] += currentMatchCount;
        if (currentMatchCount > 1) {
          multipleMatches.push(i, currentMatchCount, sequence.join(','));
        }

        if (indexes.length > 0) {
          const sequencePos = indexes[0];
          const bytesBeforeSequence = tbsBytesArray.slice(Math.max(0, sequencePos - 28), sequencePos + 4);
          const bytesKey = bytesBeforeSequence.join(',');
          bytesBeforeSequenceMap.set(bytesKey, {
            count: (bytesBeforeSequenceMap.get(bytesKey)?.count || 0) + 1,
            bitSize: bitSizes[index]
          });
          if (!bytesBeforeSequenceTbsMap.has(bytesKey)) {
            bytesBeforeSequenceTbsMap.set(bytesKey, tbsBytesArray);
          }
        }
      }
    });

    if (matchCount > 1) {
      console.log(`Certificate ${i} with ${parsed.signatureAlgorithm} has sequences matched ${matchCount} times.`);
      console.log('tbsBytesArray:', JSON.parse(JSON.stringify(tbsBytesArray)));
    }

    if (matchCount === 0) {
      console.log(`Certificate ${i} with ${parsed.signatureAlgorithm} missing expected byte sequence`);
      console.log(derToPem(Buffer.from(tbsBytesArray)));
      return
    }

    if (i > 0 && i % 100 === 0) {
      console.log(`Processed ${i} certificates...`);
    }
  }

  console.log('\nDifferent byte sequences found before key sequences, sorted by bit size:');
  // Sort entries by bit size
  const sortedEntries = Array.from(bytesBeforeSequenceMap.entries()).sort((a, b) => a[1].bitSize - b[1].bitSize);
  
  sortedEntries.forEach(([bytes, {count, bitSize}]) => {
    console.log(`${bitSize}-bit key - Sequence [${bytes}] appears ${count} times`);
    const tbsBytes = bytesBeforeSequenceTbsMap.get(bytes);
    if (tbsBytes) {
      // console.log('Example TBS certificate PEM:');
      // console.log(derToPem(Buffer.from(tbsBytes)));
    }
  });
  console.log(`Total unique sequences: ${bytesBeforeSequenceMap.size}`);

  // Log the number of matches for each sequence
  console.log(`Sequence match counts:`);
  console.log(`[2, 130, 1, 1, 0]: ${overallSequenceMatchCounts[0]}`);
  console.log(`[2, 130, 2, 1, 0]: ${overallSequenceMatchCounts[1]}`);
  console.log(`[2, 130, 1, 129, 0]: ${overallSequenceMatchCounts[2]}`);

  console.log(`Certificate with multiple sequence matches length: ${multipleMatches.length}`);
  console.log(`Certificate with multiple sequence matches: ${multipleMatches}`);
}

extractMasterlistCsca();


// ----------------- RSA -----------------

// 2048 bits
// Sequence [48,130,1,34,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,1,15,0,48,130,1,10,2,130,1,1,0] appears 8 times, supported

// Sequence [48,130,1,34, Sequence of 290 bytes
// 48,13, // sequence of 13 bytes
// 6,9, // object identifier
// 42,134,72,134,247,13,1,1,1, // OID of 9 bytes
// 5,0, // 2 NULL bytes
// 3,130,1,15,0, // Bitstring of 271 bytes
// 48,130,1,10, // Sequence of 266 bytes
// 2,130,1,1,0 // prefix (integer of 257 bytes)
// .... key of 256 bytes
// 2,3 // integer of 3 bytes
// 1,0,1 // exponent of 3 bytes
// ]

// 3072 bits
// Sequence [48,130,1,162,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,1,143,0,48,130,1,138] appears 73 times // e=65537, supported
// Sequence [48,130,1,160,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,1,141,0,48,130,1,136] appears 8 times // e=3, supported

// 4096 bits
// Sequence [48,130,2,34,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,2,15,0,48,130,2,10] appears 494 times => e=65537, supported
// Sequence [48,130,2,32,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,2,13,0,48,130,2,8] appears 12 times => e=3, chinese
// Sequence [105,97,48,130,2,32,48,11,6,9,42,134,72,134,247,13,1,1,1,3,130,2,15,0,48,130,2,10] appears 3 times => e=65537, estonia, openSSL formatting



// Mock

// 2048-bit key - Sequence [67,65,48,130,1,32,48,11,6,9,42,134,72,134,247,13,1,1,10,3,130,1,15,0,48,130,1,10] appears 1 times rsaPss OID, e=65537

// Sequence [48,130,1,32,
// 48,11,
// 6,9,
// 42,134,72,134,247,13,1,1,10,
// MISSING 2 NULL bytes
// 3,130,1,15,0,
// 48,130,1,10] appears 1 times rsaPss OID, e=65537

// 3072-bit key - Sequence [67,65,48,130,1,158,48,11,6,9,42,134,72,134,247,13,1,1,10,3,130,1,141,0,48,130,1,136] appears 1 times rsaPss OID, e=3
// 3072-bit key - Sequence [67,65,48,130,1,160,48,11,6,9,42,134,72,134,247,13,1,1,10,3,130,1,143,0,48,130,1,138] appears 2 times rsaPss OID, e=65537

// 4096-bit key - Sequence       [48,130,2,32,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,2,13,0,48,130,2,8] appears 2 times ----
// 4096-bit key - Sequence       [48,130,2,34,48,13,6,9,42,134,72,134,247,13,1,1,1,5,0,3,130,2,15,0,48,130,2,10] appears 4 times ----
// 4096-bit key - Sequence [67,65,48,130,2,30,48,11,6,9,42,134,72,134,247,13,1,1,10,||,3,130,2,13,0,48,130,2,8] appears 1 times rsaPss OID, e=3
// 4096-bit key - Sequence [67,65,48,130,2,32,48,11,6,9,42,134,72,134,247,13,1,1,10,||,3,130,2,15,0,48,130,2,10] appears 3 times rsaPss OID, e=65537


// pass the index of the first byte of the top level sequence.
// - Circuit fetches the whitelisted sequences and their sizes
// - Check the whole sequence up to its size <== this could be missing the two null bytes
// - If circuit supports multiple bit sizes, check which bitsize is associated with this prefix
// - extract pubkey
// - check suffix is the modulus of the circuit





// ----------------- ECDSA -----------------

// 224-bit key - Sequence [215,193,52,170,38,67,102,134,42,24,48,37,117,209,215,135,176,159,7,87,151,218,137,245,126,200,192,255,48,60,4,28,104] appears 74 times
// 256-bit key - Sequence [161,238,169,188,62,102,10,144,157,131,141,114,110,59,246,35,213,38,32,40,32,19,72,29,31,110,83,119,48,68,4,32,125] appears 51 times
// 256-bit key - Sequence [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,48,68,4,32,255] appears 7 times
// 256-bit key - Sequence [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,48,91,4,32,255] appears 12 times
// 384-bit key - Sequence [237,84,86,180,18,177,218,25,127,183,17,35,172,211,167,41,144,29,26,113,135,71,0,19,49,7,236,83,48,100,4,48,123] appears 54 times
// 384-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,48,100,4,48,255] appears 22 times
// 384-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,48,125,4,49,0] appears 1 times
// 384-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,48,123,4,48,255] appears 7 times
// 384-bit key - Sequence [67,65,45,65,76,71,69,82,73,65,48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 3 times
// 384-bit key - Sequence [3,85,4,11,12,4,80,73,66,65,48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 1 times
// 512-bit key - Sequence [155,198,104,66,174,205,161,42,230,163,128,230,40,129,255,47,45,130,198,133,40,170,96,86,88,58,72,243,48,129,132,4,64] appears 12 times
// 521-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,48,129,135,4,66] appears 11 times
// 521-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,48,129,136,4,66] appears 5 times
// 521-bit key - Sequence [65,32,84,117,114,107,101,121,48,129,155,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,35,3,129,134,0] appears 2 times


// TEST certs:
// For them, the common denominator is the first 23 bytes, because before you don't have the full parameter, so you end up directly with a name (MockDSC/MockCSCA)

// CSCA
// 224-bit key - Sequence [99,107,67,83,67,65,48,82,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,5,3,58,0] appears 3 times
// 224-bit key - Sequence [12,8,77,111,99,107,67,83,67,65,48,78,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,33,3,58,0] appears 1 times
// 256-bit key - Sequence [99,107,67,83,67,65,48,90,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,7,3,66,0] appears 4 times
// 256-bit key - Sequence [111,99,107,67,83,67,65,48,89,48,19,6,7,42,134,72,206,61,2,1,6,8,42,134,72,206,61,3,1,7,3,66,0] appears 2 times
// 384-bit key - Sequence [99,107,67,83,67,65,48,122,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,11,3,98,0] appears 3 times
// 384-bit key - Sequence [12,8,77,111,99,107,67,83,67,65,48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 2 times
// 521-bit key - Sequence [77,111,99,107,67,83,67,65,48,129,155,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,35,3,129,134,0] appears 2 times
// 521-bit key - Sequence [107,67,83,67,65,48,129,155,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,13,3,129,130] appears 2 times

// DSC
// 224-bit key - Sequence [111,99,107,68,83,67,48,82,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,5,3,58,0] appears 3 times
// 224-bit key - Sequence [3,12,7,77,111,99,107,68,83,67,48,78,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,33,3,58,0] appears 1 times
// 256-bit key - Sequence [111,99,107,68,83,67,48,90,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,7,3,66,0] appears 4 times
// 256-bit key - Sequence [77,111,99,107,68,83,67,48,89,48,19,6,7,42,134,72,206,61,2,1,6,8,42,134,72,206,61,3,1,7,3,66,0] appears 2 times
// 384-bit key - Sequence [111,99,107,68,83,67,48,122,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,11,3,98,0] appears 3 times
// 384-bit key - Sequence [3,12,7,77,111,99,107,68,83,67,48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 2 times
// 521-bit key - Sequence [7,77,111,99,107,68,83,67,48,129,155,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,35,3,129,134,0] appears 2 times
// 521-bit key - Sequence [99,107,68,83,67,48,129,155,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,13,3,129,130] appears 2 times


// CROPPED to what is in common between CSCA and DSC:

// 224-bit key - Sequence [48,82,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,5,3,58,0] appears 3 times // 27 bytes
// 224-bit key - Sequence [48,78,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,33,3,58,0] appears 1 times // 23 bytes
// 256-bit key - Sequence [48,90,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,7,3,66,0] appears 4 times
// 256-bit key - Sequence [48,89,48,19,6,7,42,134,72,206,61,2,1,6,8,42,134,72,206,61,3,1,7,3,66,0] appears 2 times
// 384-bit key - Sequence [48,122,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,11,3,98,0] appears 3 times
// 384-bit key - Sequence [48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 2 times
// 521-bit key - Sequence [48,129,155,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,35,3,129,134,0] appears 2 times
// 521-bit key - Sequence [48,129,155,48,20,6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,13,3,129,130] appears 2 times

// CROPPED to 23 bytes:

// 224-bit key - Sequence [48,37,117,209,215,135,176,159,7,87,151,218,137,245,126,200,192,255,48,60,4,28,104] appears 74 times
// 256-bit key - Sequence [141,114,110,59,246,35,213,38,32,40,32,19,72,29,31,110,83,119,48,68,4,32,125] appears 51 times
// 256-bit key - Sequence [0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,48,68,4,32,255] appears 7 times
// 256-bit key - Sequence [0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,48,91,4,32,255] appears 12 times
// 384-bit key - Sequence [17,35,172,211,167,41,144,29,26,113,135,71,0,19,49,7,236,83,48,100,4,48,123] appears 54 times
// 384-bit key - Sequence [255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,48,100,4,48,255] appears 22 times
// 384-bit key - Sequence [255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,48,125,4,49,0] appears 1 times
// 384-bit key - Sequence [255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,48,123,4,48,255] appears 7 times
// 384-bit key - Sequence [48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 3 times
// 384-bit key - Sequence [48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 1 times
// 512-bit key - Sequence [128,230,40,129,255,47,45,130,198,133,40,170,96,86,88,58,72,243,48,129,132,4,64] appears 12 times
// 521-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,48,129,135,4,66] appears 11 times
// 521-bit key - Sequence [255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,48,129,136,4,66] appears 5 times
// 521-bit key - Sequence [155,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,35,3,129,134,0] appears 2 times

// TEST certs:
// 224-bit key - Sequence [6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,5,3,58,0] appears 3 times
// 224-bit key - Sequence [48,78,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,33,3,58,0] appears 1 times
// 256-bit key - Sequence [6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,7,3,66,0] appears 4 times
// 256-bit key - Sequence [19,6,7,42,134,72,206,61,2,1,6,8,42,134,72,206,61,3,1,7,3,66,0] appears 2 times
// 384-bit key - Sequence [6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,11,3,98,0] appears 3 times
// 384-bit key - Sequence [48,118,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,34,3,98,0] appears 2 times
// 521-bit key - Sequence [155,48,16,6,7,42,134,72,206,61,2,1,6,5,43,129,4,0,35,3,129,134,0] appears 2 times
// 521-bit key - Sequence [6,7,42,134,72,206,61,2,1,6,9,43,36,3,3,2,8,1,1,13,3,129,130] appears 2 times

