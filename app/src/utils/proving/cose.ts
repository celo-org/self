import { decode, encode } from '@stablelib/cbor';
import { ec as EC } from 'elliptic';
//@ts-ignore
import { Buffer } from 'buffer';
import { sha384 } from 'js-sha512';
export const cose = {
    sign: {
        verify: async (
            data: Buffer,
            verifier: { key: { x: string; y: string } },
            options: { defaultType: number }
        ) => {
            // Decode the COSE_Sign1 message using the decode function.
            const decoded = decode(new Uint8Array(data));
            if (!Array.isArray(decoded) || decoded.length !== 4) {
                throw new Error('Invalid COSE_Sign1 format');
            }
            const [protectedHeaderBytes, _unprotectedHeader, payload, signature] = decoded;

            // Build the Sig_structure per RFC 8152:
            //   Sig_structure = [ "Signature1", protected header (raw), external_aad, payload ]
            const externalAAD = new Uint8Array(0); // external_aad is empty here
            const sigStructure = ['Signature1', protectedHeaderBytes, externalAAD, payload];
            const sigStructureEncoded = encode(sigStructure);

            // Hash the encoded Sig_structure using SHA-384 (per your attestation requirements)
            const hash = sha384(sigStructureEncoded);

            // Assume the signature is in raw concatenated format (r || s).
            const sigBuffer = Buffer.from(signature);
            if (sigBuffer.length % 2 !== 0) {
                throw new Error('Invalid signature length');
            }
            const halfLen = sigBuffer.length / 2;
            const r = sigBuffer.slice(0, halfLen);
            const s = sigBuffer.slice(halfLen);

            const rHex = r.toString('hex');
            const sHex = s.toString('hex');

            let curveName = 'p256';
            if (verifier.key?.x) {
                if (verifier.key.x.length === 64) {
                    curveName = 'p256';
                } else if (verifier.key.x.length === 96) {
                    curveName = 'p384';
                } else if (verifier.key.x.length === 132) {
                    curveName = 'p521';
                }
            }
            console.log('Curve name:', curveName);
            const ecInstance = new EC(curveName);
            console.log('EC instance:', ecInstance);
            const key = ecInstance.keyFromPublic({ x: verifier.key.x, y: verifier.key.y }, 'hex');
            console.log('Key:', key);

            // Verify the signature (the elliptic library expects the hash and an object with r and s)
            console.log('Hash:', hash);
            console.log('R:', rHex);
            console.log('S:', sHex);
            const valid = key.verify(hash, { r: rHex, s: sHex });
            console.log('Valid:', valid);
            if (!valid) {
                throw new Error('COSE signature verification failed');
            }
        }
    }
};

export default cose;
