import { Buffer } from 'buffer';
import { decode } from '@stablelib/cbor';
//@ts-ignore
import * as asn1 from "asn1.js";
import { aws_root_cert_pem } from "./aws_root_pem";
import { X509Certificate } from "@peculiar/x509";
import { AsnParser } from '@peculiar/asn1-schema';
import { ec as EC } from 'elliptic';

//@ts-ignore
import FastCrypto from 'react-native-fast-crypto';
import * as asn1js from 'asn1js';
import { Certificate } from 'pkijs';
import { getParamsECDSA } from '../../../../common/src/utils/certificate_parsing/parseCertificateSimple';
import { parseCertificateSimple } from '../../../../common/src/utils/certificate_parsing/parseCertificateSimple';
import { initElliptic } from '../../../../common/src/utils/certificate_parsing/elliptic';
import { getCurveForElliptic } from '../../../../common/src/utils/certificate_parsing/curves';
import { PublicKeyDetailsECDSA } from '../../../../common/src/utils/certificate_parsing/dataStructure';
import cose from './cose';

// The required fields for a valid attestation
export const requiredFields = [
    "module_id",
    "digest",
    "timestamp",
    "pcrs",
    "certificate",
    "cabundle",
];

// Define an interface for the ASN.1 context used with asn1.js
interface ASN1Context {
    seq(): ASN1Context;
    obj(...args: any[]): ASN1Context;
    key(name: string): ASN1Context;
    objid(): ASN1Context;
    bitstr(): ASN1Context;
}

// Update the ASN.1 definition with proper typing for ECPublicKey
export const ECPublicKeyASN = asn1.define("ECPublicKey", function (this: ASN1Context) {
    this.seq().obj(
        this.key("algo")
            .seq()
            .obj(
                this.key("id").objid(),
                this.key("curve").objid()
            ),
        this.key("pubKey").bitstr()
    );
});

// Utility function to check if a number is within (start, end] range
export const numberInRange = (start: number, end: number, value: number): boolean => {
    return value > start && value <= end;
};

export const verifyCertChain = (rootPem: string, certChainStr: string[]): boolean => {
    try {
        // Parse all certificates
        const rootCert = new X509Certificate(rootPem);
        const certChain = certChainStr.map(cert => new X509Certificate(cert));

        // Verify the chain from leaf to root
        for (let i = 0; i < certChain.length; i++) {
            const currentCert = certChain[i];
            const issuerCert = i === certChain.length - 1 ? rootCert : certChain[i + 1];

            // Verify certificate validity period
            const now = new Date();
            if (now < currentCert.notBefore || now > currentCert.notAfter) {
                console.error('Certificate is not within its validity period');
                return false;
            }

            // Verify signature
            try {
                const isValid = currentCert.verify(issuerCert);
                if (!isValid) {
                    console.error(`Certificate at index ${i} has invalid signature`);
                    return false;
                }
            } catch (e) {
                console.error(`Error verifying signature at index ${i}:`, e);
                return false;
            }
        }
        console.log('Certificate chain verified');
        return true;
    } catch (error) {
        console.error('Certificate chain verification error:', error);
        return false;
    }
};

function rmPadding(buf: Array<number>): Array<number> {
    var i = 0;
    var len = buf.length - 1;
    while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
        i++;
    }
    if (i === 0) {
        return buf;
    }
    return buf.slice(i);
}

function constructLength(arr: Array<number>, len: number) {
    if (len < 0x80) {
        arr.push(len);
        return;
    }
    var octets = 1 + ((Math.log(len) / Math.LN2) >>> 3);
    arr.push(octets | 0x80);
    while (--octets) {
        arr.push((len >>> (octets << 3)) & 0xff);
    }
    arr.push(len);
}

const toDER = function toDER(rBuf: Buffer, sBuf: Buffer): Buffer {
    var r = Array.from(rBuf);
    var s = Array.from(sBuf);

    // Pad values
    if (r[0] & 0x80) r = [0].concat(r);
    // Pad values
    if (s[0] & 0x80) s = [0].concat(s);

    r = rmPadding(r);
    s = rmPadding(s);

    while (!s[0] && !(s[1] & 0x80)) {
        s = s.slice(1);
    }
    var arr = [0x02];
    constructLength(arr, r.length);
    arr = arr.concat(r);
    arr.push(0x02);
    constructLength(arr, s.length);
    var backHalf = arr.concat(s);
    var res = [0x30];
    constructLength(res, backHalf.length);
    res = res.concat(backHalf);

    return Buffer.from(res);
};

export const verifyAttestion = async (attestation: Array<number>) => {
    // const jsonRpcBody = {
    //   jsonrpc: "2.0",
    //   method: "openpassport_attestation",
    //   id: 1,
    //   params: {},
    // };

    // const res = await axios.post(
    //   "http://ad3c378249c1242619c12616bbbc4036-28818039163c2199.elb.eu-west-1.amazonaws.com:8888/",
    //   jsonRpcBody
    // );

    const coseSign1 = await decode(Buffer.from(attestation));

    if (!Array.isArray(coseSign1) || coseSign1.length !== 4) {
        throw new Error("Invalid COSE_Sign1 format");
    }

    const [protectedHeader, unprotectedHeader, payload, signature] = coseSign1;

    const attestationDoc = (await decode(payload)) as AttestationDoc;

    for (const field of requiredFields) {
        //@ts-ignore
        if (!attestationDoc[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    if (!(attestationDoc.module_id.length > 0)) {
        throw new Error("Invalid module_id");
    }
    if (!(attestationDoc.digest === "SHA384")) {
        throw new Error("Invalid digest");
    }

    if (!(attestationDoc.timestamp > 0)) {
        throw new Error("Invalid timestamp");
    }

    //for each key, value in pcts
    for (const [key, value] of Object.entries(attestationDoc.pcrs)) {
        if (parseInt(key) < 0 || parseInt(key) >= 32) {
            throw new Error("Invalid pcr index");
        }

        if (![32, 48, 64].includes(value.length)) {
            throw new Error("Invalid pcr value length at: " + key);
        }
    }

    if (!(attestationDoc.cabundle.length > 0)) {
        throw new Error("Invalid cabundle");
    }

    for (let i = 0; i < attestationDoc.cabundle.length; i++) {
        if (!numberInRange(0, 1024, attestationDoc.cabundle[i].length)) {
            throw new Error("Invalid cabundle");
        }
    }

    if (attestationDoc.public_key) {
        if (!numberInRange(0, 1024, attestationDoc.public_key.length)) {
            throw new Error("Invalid public_key");
        }
    }

    if (attestationDoc.user_data) {
        if (!numberInRange(-1, 512, attestationDoc.user_data.length)) {
            throw new Error("Invalid user_data");
        }
    }

    if (attestationDoc.nonce) {
        if (!numberInRange(-1, 512, attestationDoc.nonce.length)) {
            throw new Error("Invalid nonce");
        }
    }

    const certChain = attestationDoc.cabundle.map((cert: Buffer) =>
        derToPem(cert)
    );

    const cert = derToPem(attestationDoc.certificate);

    if (!verifyCertChain(aws_root_cert_pem, [...certChain, cert])) {
        throw new Error("Invalid certificate chain");
    }

    const parsed = parseCertificateSimple(cert);
    const publicKeyDetails = parsed.publicKeyDetails as PublicKeyDetailsECDSA;

    const curveForElliptic = getCurveForElliptic(publicKeyDetails.curve);
    console.log('Curve for elliptic:', curveForElliptic);
    const ec = new EC(curveForElliptic);

    const x = publicKeyDetails.x;
    const y = publicKeyDetails.y;

    const verifier = {
        key: {
            x,
            y,
        },
    };

    console.log('Verifying signature');
    await cose.sign.verify(Buffer.from(attestation), verifier, {
        defaultType: 18,
    });
    console.log('Signature verified');

    return {
        userData: attestationDoc.user_data,
        pubkey: attestationDoc.public_key,
    };
};

export function getPublicKey(attestation: Array<number>) {
    const coseSign1 = decode(Buffer.from(attestation));
    const [protectedHeader, unprotectedHeader, payload, signature] = coseSign1;
    const attestationDoc = decode(payload) as AttestationDoc;
    return attestationDoc.public_key;
}

// Update the type definition to match the actual data structure
type AttestationDoc = {
    module_id: string;
    digest: string;
    timestamp: number;
    pcrs: { [key: number]: Buffer }; // Changed from Map to object
    certificate: Buffer;
    cabundle: Array<Buffer>;
    public_key: string | null;
    user_data: string | null;
    nonce: string | null;
};

export function derToPem(der: Buffer): string {
    try {
        const base64 = Buffer.from(der).toString('base64');
        return '-----BEGIN CERTIFICATE-----\n' +
            base64.match(/.{1,64}/g)!.join('\n') +
            '\n-----END CERTIFICATE-----';
    } catch (error) {
        console.error('DER to PEM conversion error:', error);
        throw error;
    }
}

function getCertificateFromPem(pemContent: string): Certificate {
    try {
        console.log('Starting certificate parsing');

        // Remove PEM headers and newlines
        const base64 = pemContent.replace(/(-----(BEGIN|END) CERTIFICATE-----|\n|\r)/g, '');

        // Convert base64 to binary
        const binary = Buffer.from(base64, 'base64');
        console.log('Binary buffer length:', binary.length);
        console.log('First 20 bytes:', Array.from(binary.slice(0, 20)));

        // Create ArrayBuffer from binary
        const arrayBuffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binary.length; i++) {
            view[i] = binary[i];
        }

        // Parse ASN.1
        const asn1 = asn1js.fromBER(arrayBuffer);
        if (asn1.offset === -1) {
            throw new Error(`ASN.1 parsing error: ${asn1.result.error}`);
        }

        return new Certificate({ schema: asn1.result });
    } catch (error) {
        console.error('Certificate parsing error:', error);
        throw error;
    }
}