import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("core", (m) => {
    // Deploy verifiers
    const Verifier_vc_and_disclose = m.contract("Verifier_vc_and_disclose");
    const Verifier_register = m.contract("Verifier_register");
    const Verifier_dsc = m.contract("Verifier_dsc");

    // Deploy vcAndDiscloseVerifier

    // Deploy registerVerifier

    // Deploy dscVerifier

    // Deploy PoseidonT3

    // Deploy IdentityRegistryImplV1

    // Deploy IdentityVerificationHubImplV1

    // Deploy registry with temporary hub address

    // Deploy hub with deployed registry and verifiers

    // Update hub address in registry

    // Initialize roots

    // Return deployed contracts
});
