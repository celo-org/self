import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { artifacts, ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { RegisterVerifierId, DscVerifierId } from "../../../common/src/constants/constants";

function getHubInitializeData() {
    const hubArtifact = artifacts.readArtifactSync("IdentityVerificationHubImplV1");
    return new ethers.Interface(hubArtifact.abi);
}

export default buildModule("DeployHub", (m) => {
    const networkName = hre.network.config.chainId;

    // const deployedAddressesPath = path.join(__dirname, `../deployments/chain-${networkName}/deployed_addresses.json`);
    // const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

    // const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];
    // const vcAndDiscloseVerifierAddress = deployedAddresses["DeployVerifiers#Verifier_vc_and_disclose"];
    // const registerVerifierAddress = deployedAddresses["DeployVerifiers#Verifier_register_sha1_sha256_sha256_rsa_65537_4096"];
    // const registerVerifierAddress2 = deployedAddresses["DeployVerifiers#Verifier_register_sha256_sha256_sha256_ecdsa_brainpoolP256r1"];
    // const registerVerifierAddress3 = deployedAddresses["DeployVerifiers#Verifier_register_sha256_sha256_sha256_rsa_65537_4096"];
    // const dscVerifierAddress = deployedAddresses["DeployVerifiers#Verifier_dsc_sha256_rsa_65537_4096"];

    const registryAddress = "0x2E94B3c441C9Ede8c4b7690517C1df66c7cC1A67";
    const vcAndDiscloseVerifierAddress = "0x64c778bc51828dF567Ac059B5367d50db40763D3";
    const registerVerifierAddress = "0xb634bac92742DCb264a1E5CBE55C8d4A1A01c278";
    const registerVerifierAddress2 = "0xE9BCF83686c185e7A489143B989cFc40ADCb0903";
    const registerVerifierAddress3 = "0x0F042386B406448FA71D5B2C33cdA876055F764a";
    const dscVerifierAddress = "0xd0596f8ed2Ae2f317daE68A54BC489f2171f0262";

    const identityVerificationHubImpl = m.contract("IdentityVerificationHubImplV1");

    const hubInterface = getHubInitializeData();
    const initializeData = hubInterface.encodeFunctionData("initialize", [
        registryAddress,
        vcAndDiscloseVerifierAddress,
        [
            RegisterVerifierId.register_sha1_sha256_sha256_rsa_65537_4096, 
            RegisterVerifierId.register_sha256_sha256_sha256_ecdsa_brainpoolP256r1, 
            RegisterVerifierId.register_sha256_sha256_sha256_rsa_65537_4096
        ],
        [registerVerifierAddress, registerVerifierAddress2, registerVerifierAddress3],
        [
            DscVerifierId.dsc_sha256_rsa_65537_4096
        ],
        [dscVerifierAddress]
    ]);

    const hub = m.contract("IdentityVerificationHub", [
        identityVerificationHubImpl,
        initializeData
    ]);

    return {
        hub,
        identityVerificationHubImpl,
    };
});