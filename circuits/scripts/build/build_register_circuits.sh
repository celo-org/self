#!/bin/bash

source "scripts/build/common.sh"

# Circuit-specific configurations
CIRCUIT_TYPE="register"
OUTPUT_DIR="build/${CIRCUIT_TYPE}"

# Define circuits and their configurations
# format: name:poweroftau:build_flag
CIRCUITS=(
    "register_sha1_sha1_sha1_rsa_65537_4096:21:true"
    "register_sha1_sha256_sha256_rsa_65537_4096:20:true"
    "register_sha224_sha224_sha224_ecdsa_brainpoolP224r1:21:true"
    "register_sha256_sha224_sha224_ecdsa_secp224r1:21:true"
    "register_sha256_sha256_sha256_ecdsa_brainpoolP256r1:21:true"
    "register_sha256_sha256_sha256_ecdsa_brainpoolP384r1:22:true"
    "register_sha256_sha256_sha256_ecdsa_secp256r1:21:true"
    "register_sha256_sha256_sha256_ecdsa_secp384r1:22:true"
    "register_sha256_sha256_sha256_rsa_3_4096:21:true"
    "register_sha256_sha256_sha256_rsa_65537_4096:21:true"
    "register_sha256_sha256_sha256_rsapss_3_32_2048:21:true"
    "register_sha256_sha256_sha256_rsapss_65537_32_2048:21:true"
    "register_sha256_sha256_sha256_rsapss_65537_32_3072:21:true"
    "register_sha384_sha384_sha384_ecdsa_brainpoolP384r1:22:true"
    "register_sha384_sha384_sha384_ecdsa_brainpoolP512r1:22:true"
    "register_sha384_sha384_sha384_ecdsa_secp384r1:22:true"
    "register_sha512_sha512_sha512_ecdsa_brainpoolP512r1:23:true"
    "register_sha512_sha512_sha512_rsa_65537_4096:21:true"
    "register_sha512_sha512_sha512_rsapss_65537_64_2048:21:true"
)

build_circuits "$CIRCUIT_TYPE" "$OUTPUT_DIR" "${CIRCUITS[@]}" 