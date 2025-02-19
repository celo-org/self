pragma circom 2.1.9;

/***

ID to Signature Algorithm
  1: rsa_sha256_65537_2048
  3: rsa_sha1_65537_2048
  4: rsapss_sha256_65537_2048
  7: ecdsa_sha1_secp256r1_256
  8: ecdsa_sha256_secp256r1_256
  9: ecdsa_sha384_secp384r1_384
 10: rsa_sha256_65537_4096
 11: rsa_sha1_65537_4096
 12: rsapss_sha256_65537_4096
 13: rsa_sha256_3_2048
 14: rsa_sha256_65537_3072
 15: rsa_sha512_65537_4096
 16: rsapss_sha256_3_3072
 17: rsapss_sha256_3_4096
 18: rsapss_sha384_65537_3072
 19: rsapss_sha256_65537_3072
 21: ecdsa_sha256_brainpoolP256r1_256
 22: ecdsa_sha384_brainpoolP384r1_384
 23: ecdsa_sha256_secp384r1_384
 24: ecdsa_sha384_brainpoolP256r1_256
 25: ecdsa_sha512_brainpoolP256r1_256
 26: ecdsa_sha512_brainpoolP384r1_384
 27: ecdsa_sha1_brainpoolP224r1_224
 28: ecdsa_sha256_brainpoolP224r1_224
 29: ecdsa_sha512_brainpoolP512r1_512
 30: ecdsa_sha224_brainpoolP224r1_224
 31: rsa_sha512_65537_2048
 32: rsa_sha256_3_4096
 33: rsa_sha1_3_4096
 34: rsa_sha384_65537_4096
 35: rsapss_sha384_65537_4096
 36: ecdsa_sha1_brainpoolP256r1_256
 37: ecdsa_sha256_brainpoolP384r1_384
 38: ecdsa_sha384_brainpoolP512r1_512
 39: rsapss_sha512_65537_4096
 40: ecdsa_sha256_secp521r1_256
 41: ecdsa_sha512_secp521r1_521
 42: rsapss_sha512_65537_2048
 43: rsapss_sha256_3_2048
 44: ecdsa_sha224_secp224r1_224
*/


/// @title GetHashLength
/// @notice Returns the length of the hash in bits for a given signature algorithm
/// @param signatureAlgorithm ID of the signature algorithm
/// @output hashLength Length of the hash in bits
function getHashLength(signatureAlgorithm) {
    if (signatureAlgorithm == 1 ) {
        return 256;
    } else if (signatureAlgorithm == 3) {
        return 160;
    } else if (signatureAlgorithm == 4) {
        return 256;
    } else if (signatureAlgorithm == 7) {
        return 160;
    } else if (signatureAlgorithm == 8) {
        return 256;
    } else if (signatureAlgorithm == 9) {
        return 384;
    } else if (signatureAlgorithm == 10) {
        return 256;
    } else if (signatureAlgorithm == 11) {
        return 160;
    } else if (signatureAlgorithm == 12) {
        return 256;
    } else if (signatureAlgorithm == 13) {
        return 256;
    } else if (signatureAlgorithm == 14) {
        return 256;
    } else if (signatureAlgorithm == 15) {
        return 512;
    } else if (signatureAlgorithm == 16) {
        return 256;
    } else if (signatureAlgorithm == 17) {
        return 256;
    } else if (signatureAlgorithm == 18) {
        return 384;
    } else if (signatureAlgorithm == 19) {
        return 256;
    } else if (signatureAlgorithm == 21) { 
        return 256;
    } else if (signatureAlgorithm == 22) {
        return 384;
    } else if (signatureAlgorithm == 23) { 
        return 256;
    } else if (signatureAlgorithm == 24) {
        return 384;
    } else if (signatureAlgorithm == 25) {
        return 512; 
    } else if (signatureAlgorithm == 26) { 
        return 512;
    } else if (signatureAlgorithm == 27) { 
        return 160;
    } else if (signatureAlgorithm == 28) { 
        return 256;
    } else if (signatureAlgorithm == 29) { 
        return 512;
    } else if (signatureAlgorithm == 30) { 
        return 224;
    } else if (signatureAlgorithm == 31) {
        return 512;
    } else if (signatureAlgorithm == 32) {
        return 256;
    } else if (signatureAlgorithm == 33) {
        return 160;
    } else if (signatureAlgorithm == 34) {
        return 384;
    } else if (signatureAlgorithm == 35) {
        return 384;
    } else if (signatureAlgorithm == 36) {
        return 160;
    } else if (signatureAlgorithm == 37) {
        return 256;
    } else if (signatureAlgorithm == 38) {
        return 384;
    } else if (signatureAlgorithm == 39) {
        return 512;
    } else if (signatureAlgorithm == 40) {
        return 256;
    } else if (signatureAlgorithm == 41) {
        return 512;
    } else if (signatureAlgorithm == 42) {
        return 512;
    } else if (signatureAlgorithm == 43) {
        return 256;
    } else if (signatureAlgorithm == 44) {
        return 224;
    } else {
        assert(1==0);
        return 0;
    }
}

/// @title GetMinKeyLength
/// @notice Returns the minimum length of the key in bits for a given signature algorithm
/// @param signatureAlgorithm ID of the signature algorithm
/// @output keyLength Minimum length of the key in bits
/// @dev for RSAPSS and ECDSA, it's always the same as in the circuit name
/// @dev for RSA, it can be lower, because we use the same circuit for multiple key lengths
function getMinKeyLength(signatureAlgorithm) {
    if (signatureAlgorithm == 1) {
        return 2048;
    } else if (signatureAlgorithm == 3) {
        return 2048;
    } else if (signatureAlgorithm == 4) {
        return 2048;
    } else if (signatureAlgorithm == 7) {
        return 256;
    } else if (signatureAlgorithm == 8) {
        return 256;
    } else if (signatureAlgorithm == 9) {
        return 384;
    } else if (signatureAlgorithm == 10) {
        return 2048; // down to 2048 for 4096
    } else if (signatureAlgorithm == 11) {
        return 2048; // down to 2048 for 4096
    } else if (signatureAlgorithm == 12) {
        return 4096;
    } else if (signatureAlgorithm == 13) {
        return 2048;
    } else if (signatureAlgorithm == 14) {
        return 2048; // down to 2048 for 3072 (not used now)
    } else if (signatureAlgorithm == 15) {
        return 2048; // down to 2048 for 4096
    } else if (signatureAlgorithm == 16) {
        return 3072;
    } else if (signatureAlgorithm == 17) {
        return 4096;
    } else if (signatureAlgorithm == 18) {
        return 3072;
    } else if (signatureAlgorithm == 19) {
        return 3072;
    } else if (signatureAlgorithm == 21) {
        return 256;
    } else if (signatureAlgorithm == 22) {
        return 384;
    } else if (signatureAlgorithm == 23) {
        return 384;
    } else if (signatureAlgorithm == 24) {
        return 256;
    } else if (signatureAlgorithm == 25) {
        return 256;
    } else if (signatureAlgorithm == 26) {
        return 384;
    } else if (signatureAlgorithm == 27) {
        return 224;
    } else if (signatureAlgorithm == 28) {
        return 224;
    } else if (signatureAlgorithm == 29) {
        return 512;
    } else if (signatureAlgorithm == 30) {
        return 224;
    } else if (signatureAlgorithm == 31) {
        return 2048;
    } else if (signatureAlgorithm == 32) {
        return 2048; // down to 2048 for 4096
    } else if (signatureAlgorithm == 33) {
        return 2048; // down to 2048 for 4096
    } else if (signatureAlgorithm == 34) {
        return 2048; // down to 2048 for 4096
    } else if (signatureAlgorithm == 35) {
        return 4096;
    } else if (signatureAlgorithm == 36) {
        return 256;
    } else if (signatureAlgorithm == 37) {
        return 384;
    } else if (signatureAlgorithm == 38) {
        return 512;
    } else if (signatureAlgorithm == 39) {
        return 4096;
    } else if (signatureAlgorithm == 40) {
        return 521;
    } else if (signatureAlgorithm == 41) {
        return 521;
    } else if (signatureAlgorithm == 42) {
        return 2048;
    } else if (signatureAlgorithm == 43) {
        return 2048;
    } else if (signatureAlgorithm == 44) {
        return 224;
    } else {
        assert(1==0);
        return 0;
    }
}

/// @title GetKLengthFactor
/// @notice Returns the length factor for the key in bits for a given signature algorithm — 1 for rsa, 2 for ecdsa
/// @param signatureAlgorithm ID of the signature algorithm
/// @output kLengthFactor Length factor for the key in bits
/// @dev needed as ecdsa keys are composed of x and y coordinates, rsa keys are just the modulus (exponent is defined below)
function getKLengthFactor(signatureAlgorithm) {
    if (signatureAlgorithm == 1) {
        return 1;
    } else if (signatureAlgorithm == 3) {
        return 1;
    } else if (signatureAlgorithm == 4) {
        return 1;
    } else if (signatureAlgorithm == 7) {
        return 2;
    } else if (signatureAlgorithm == 8) {
        return 2;
    } else if (signatureAlgorithm == 9) {
        return 2;
    } else if (signatureAlgorithm == 10) {
        return 1;
    } else if (signatureAlgorithm == 11) {
        return 1;
    } else if (signatureAlgorithm == 12) {
        return 1;
    } else if (signatureAlgorithm == 13) {
        return 1;
    } else if (signatureAlgorithm == 14) {
        return 1;
    } else if (signatureAlgorithm == 15) {
        return 1;
    } else if (signatureAlgorithm == 16) {
        return 1;
    } else if (signatureAlgorithm == 17) {
        return 1;
    } else if (signatureAlgorithm == 18) {
        return 1;
    } else if (signatureAlgorithm == 19) {
        return 1;
    } else if (signatureAlgorithm == 21) {
        return 2;
    } else if (signatureAlgorithm == 22) {
        return 2;
    } else if (signatureAlgorithm == 23) {
        return 2;
    } else if (signatureAlgorithm == 24) {
        return 2;
    } else if (signatureAlgorithm == 25) {
        return 2;
    } else if (signatureAlgorithm == 26) {
        return 2;
    } else if (signatureAlgorithm == 27) {
        return 2;
    } else if (signatureAlgorithm == 28) {
        return 2;
    } else if (signatureAlgorithm == 29) {
        return 2;
    } else if (signatureAlgorithm == 30) {
        return 2;
    } else if (signatureAlgorithm == 31) {
        return 1;
    } else if (signatureAlgorithm == 32) {
        return 1;
    } else if (signatureAlgorithm == 33) {
        return 1;
    } else if (signatureAlgorithm == 34) {
        return 1;
    } else if (signatureAlgorithm == 35) {
        return 1;
    } else if (signatureAlgorithm == 36) {
        return 2;
    } else if (signatureAlgorithm == 37) {
        return 2;
    } else if (signatureAlgorithm == 38) {
        return 2;
    } else if (signatureAlgorithm == 39) {
        return 1;
    } else if (signatureAlgorithm == 40) {
        return 2;
    } else if (signatureAlgorithm == 41) {
        return 2;
    } else if (signatureAlgorithm == 42) {
        return 1;
    } else if (signatureAlgorithm == 43) {
        return 1;
    } else if (signatureAlgorithm == 44) {
        return 2;
    } else {
        assert(1==0);
        return 0;
    }
}

/// @title GetExponentBits
/// @notice Returns the amounts of bits of the exponent of type 2^n +1
/// @param signatureAlgorithm ID of the signature algorithm
/// @output exponentBits Amount of bits of the exponent
function getExponentBits(signatureAlgorithm) {
    if (signatureAlgorithm == 1) {
        return 17; // 65537
    } else if (signatureAlgorithm == 3) {
        return 17;
    } else if (signatureAlgorithm == 4) {
        return 17;
    } else if (signatureAlgorithm == 10) {
        return 17;
    } else if (signatureAlgorithm == 11) {
        return 17;
    } else if (signatureAlgorithm == 12) {
        return 17;
    } else if (signatureAlgorithm == 13) {
        return 2; // 3
    } else if (signatureAlgorithm == 14) {
        return 17;
    } else if (signatureAlgorithm == 15) {
        return 17;
    } else if (signatureAlgorithm == 16) {
        return 2;
    } else if (signatureAlgorithm == 17) {
        return 2;
    } else if (signatureAlgorithm == 18) {
        return 17;
    } else if (signatureAlgorithm == 19) {
        return 17;
    } else if (signatureAlgorithm == 31) {
        return 17;
    } else if (signatureAlgorithm == 32) {
        return 2;
    } else if (signatureAlgorithm == 33) {
        return 2;
    } else if (signatureAlgorithm == 34) {
        return 17;
    } else if (signatureAlgorithm == 35) {
        return 17;
    } else if (signatureAlgorithm == 39) {
        return 17;
    } else if (signatureAlgorithm == 42) {
        return 17;
    } else if (signatureAlgorithm == 43) {
        return 2;
    } else {
        assert(1==0);
        return 0;
    }
}

// suffix is 5 bits for 65537, 3 bits for 3
function getSuffixLength(signatureAlgorithm) {
    var exponentBits = getExponentBits(signatureAlgorithm);
    if (exponentBits == 17) {
        return 5;
    } else if (exponentBits == 2) {
        return 3;
    } else {
        assert(1==0);
        return 0;
    }
}

function getSuffix(signatureAlgorithm) {
    var exponentBits = getExponentBits(signatureAlgorithm);
    if (exponentBits == 17) {
        return [0x02, 0x03, 0x01, 0x00, 0x01]; // 3 bytes, 01, 00, 01 means 65537
    } else if (exponentBits == 2) {
        return [0x02, 0x01, 0x03]; // 1 byte, 03 means 3
    } else {
        assert(1==0);
        return [0x00, 0x00, 0x00];
    }
}



function getValidRSAPrefixes() {
    var prefixes[13][31];

    // Prefixes include the whole sequence, including the OID and the der encoding before the key
    // We remove their first two bytes so they have fixed length of 31,
    // because Estonia (and newer OpenSSL versions) lack two null bytes

    // ---- CORRECT FORMATTING ----

    // 2048 bits, e=65537
    prefixes[0] = [0x01, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0f, 0x00, 0x30, 0x82, 0x01, 0x0a, 0x02, 0x82, 0x01, 0x01, 0x00];
    // 2048 bits, e=3
    prefixes[1] = [0x01, 0x20, 0x30, 0x0D, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0d, 0x00, 0x30, 0x82, 0x01, 0x08, 0x02, 0x82, 0x01, 0x01, 0x00];
    // 3072 bits, e=65537
    prefixes[2] = [0x01, 0xa2, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x8f, 0x00, 0x30, 0x82, 0x01, 0x8a, 0x02, 0x82, 0x01, 0x81, 0x00];
    // 3072 bits, e=3
    prefixes[3] = [0x01, 0xa0, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x8d, 0x00, 0x30, 0x82, 0x01, 0x88, 0x02, 0x82, 0x01, 0x81, 0x00];
    // 4096 bits, e=65537
    prefixes[4] = [0x02, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x02, 0x0f, 0x00, 0x30, 0x82, 0x02, 0x0a, 0x02, 0x82, 0x02, 0x01, 0x00];
    // 4096 bits, e=3
    prefixes[5] = [0x02, 0x20, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x02, 0x0d, 0x00, 0x30, 0x82, 0x02, 0x08, 0x02, 0x82, 0x02, 0x01, 0x00];

    // ---- New OpenSSL formatting (missing two null bytes, using rsaPss OID) ----

    // 2048 bits, e=65537
    prefixes[6] = [0x30, 0x82, 0x01, 0x20, 0x30, 0x0b, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0a, 0x03, 0x82, 0x01, 0x0f, 0x00, 0x30, 0x82, 0x01, 0x0a, 0x02, 0x82, 0x01, 0x01, 0x00];
    // 2048 bits, e=3
    prefixes[7] = [0x30, 0x82, 0x01, 0x1e, 0x30, 0x0b, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0a, 0x03, 0x82, 0x01, 0x0d, 0x00, 0x30, 0x82, 0x01, 0x08, 0x02, 0x82, 0x01, 0x01, 0x00];
    // 3072 bits, e=65537
    prefixes[8] = [0x30, 0x82, 0x01, 0xa0, 0x30, 0x0b, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0a, 0x03, 0x82, 0x01, 0x8f, 0x00, 0x30, 0x82, 0x01, 0x8a, 0x02, 0x82, 0x01, 0x81, 0x00];
    // 3072 bits, e=3
    prefixes[9] = [0x30, 0x82, 0x01, 0x9e, 0x30, 0x0b, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0a, 0x03, 0x82, 0x01, 0x8d, 0x00, 0x30, 0x82, 0x01, 0x88, 0x02, 0x82, 0x01, 0x81, 0x00];
    // 4096 bits, e=65537
    prefixes[10] = [0x30, 0x82, 0x02, 0x20, 0x30, 0x0B, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x0A, 0x03, 0x82, 0x02, 0x0F, 0x00, 0x30, 0x82, 0x02, 0x0A, 0x02, 0x82, 0x02, 0x01, 0x00];
    // 4096 bits, e=3
    prefixes[11] = [0x30, 0x82, 0x02, 0x1E, 0x30, 0x0B, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x0A, 0x03, 0x82, 0x02, 0x0D, 0x00, 0x30, 0x82, 0x02, 0x08, 0x02, 0x82, 0x02, 0x01, 0x00];

    // ---- Estonia, missing two null bytes, but not using rsaPSS OID ----

    // 4096 bits, e=65537
    prefixes[12] = [0x30, 0x82, 0x02, 0x20, 0x30, 0x0B, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, 0x03, 0x82, 0x02, 0x0F, 0x00, 0x30, 0x82, 0x02, 0x0A, 0x02, 0x82, 0x02, 0x01, 0x00];

    return prefixes;
}

function prefixIndexToRSAKeyLength() {
    var keyLengths[13] = [2048, 2048, 3072, 3072, 4096, 4096, 2048, 2048, 3072, 3072, 4096, 4096, 4096];
    return keyLengths;
}