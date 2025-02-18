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
  const uniqueCertsDir = path.join(csca_path, 'pem_masterlist');

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

  for (let i = 0; i < certArray.length; i++) {
    const pemContent = certArray[i];
    const parsed = parseCertificateSimple(pemContent);
    if (parsed.signatureAlgorithm === 'ecdsa') {
      continue;
    }
    
    // if (i === 247) {
    //   console.log("pemContent", pemContent);
    // }

    let matchCount = 0;
    
    const tbsBytesArray = Array.from(parsed.tbsBytes);
    if (parsed.signatureAlgorithm === 'rsa' || parsed.signatureAlgorithm === 'rsapss') {
      const sequences = [
        [2, 130, 1, 1, 0], // 2048 bits, 8 matches
        [2, 130, 2, 1, 0], // 4096 bits, 509 matches
        [2, 130, 1, 129, 0], // 3072 bits, 81 matches
        // [2, 130, 3, 1, 0], // 6144 bits, 10 matches. Moldova. Not supported.
      ];
      
      sequences.forEach((sequence, index) => {
        const {count: currentMatchCount, indexes} = findSequenceMatches(tbsBytesArray, sequence);
        
        if (currentMatchCount > 0) {
          matchCount += currentMatchCount;
          overallSequenceMatchCounts[index] += currentMatchCount;
          if (currentMatchCount > 1) {
            multipleMatches.push(i, currentMatchCount, sequence.join(','));
          }
        }
      });

      if (matchCount > 1) {
        console.log(`Certificate ${i} with ${parsed.signatureAlgorithm} has sequences matched ${matchCount} times.`);
        console.log('tbsBytesArray:', JSON.parse(JSON.stringify(tbsBytesArray)));
      }

      if (matchCount === 0) {
        console.log(`Certificate ${i} with ${parsed.signatureAlgorithm} missing expected byte sequence`);
      }
    }

    if (i > 0 && i % 100 === 0) {
      console.log(`Processed ${i} certificates...`);
    }
  }

  // Log the number of matches for each sequence
  console.log(`Sequence match counts:`);
  console.log(`[2, 130, 1, 1, 0]: ${overallSequenceMatchCounts[0]}`);
  console.log(`[2, 130, 2, 1, 0]: ${overallSequenceMatchCounts[1]}`);
  console.log(`[2, 130, 1, 129, 0]: ${overallSequenceMatchCounts[2]}`);

  console.log(`Certificate with multiple sequence matches: ${multipleMatches}`);
}

extractMasterlistCsca();