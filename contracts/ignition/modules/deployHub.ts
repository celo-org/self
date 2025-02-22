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

    const deployedAddressesPath = path.join(__dirname, `../deployments/chain-${networkName}/deployed_addresses.json`);
    const deployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

    const registryAddress = deployedAddresses["DeployRegistryModule#IdentityRegistry"];
    const vcAndDiscloseVerifierAddress = deployedAddresses["DeployVerifiers#Verifier_vc_and_disclose"];
    const registerVerifierAddress = deployedAddresses["DeployVerifiers#Verifier_register_sha1_sha256_sha256_rsa_65537_4096"];
    const registerVerifierAddress2 = deployedAddresses["DeployVerifiers#Verifier_register_sha256_sha256_sha256_ecdsa_brainpoolP256r1"];
    const registerVerifierAddress3 = deployedAddresses["DeployVerifiers#Verifier_register_sha256_sha256_sha256_rsa_65537_4096"];
    const dscVerifierAddress = deployedAddresses["DeployVerifiers#Verifier_dsc_sha256_rsa_65537_4096"];

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