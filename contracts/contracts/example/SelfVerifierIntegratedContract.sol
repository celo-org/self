// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ISelfVerifierIntegration} from "../interfaces/ISelfVerifierIntegration.sol";
import {IIdentityVerificationHubV1} from "../interfaces/IIdentityVerificationHubV1.sol";
import {IIdentityRegistryV1} from "../interfaces/IIdentityRegistryV1.sol";
import {IVcAndDiscloseCircuitVerifier} from "../interfaces/IVcAndDiscloseCircuitVerifier.sol";

contract SelfVerifierIntegratedContract is ISelfVerifierIntegration {

    uint256 public scope;
    uint256 public attestationId;
    IIdentityVerificationHubV1 public selfIdentityVerificationHub;

    ISelfVerifierIntegration.VerificationConfig public verificationConfig;

    constructor(
        IIdentityVerificationHubV1 _selfIdentityVerificationHub,
        uint256 _scope,
        uint256 _attestationId,
        bool _olderThanEnabled,
        uint256 _olderThan,
        bool _forbiddenCountriesEnabled,
        uint256[4] memory _forbiddenCountriesListPacked,
        bool[3] memory _ofacEnabled
    ) {
        selfIdentityVerificationHub = _selfIdentityVerificationHub;
        scope = _scope;
        attestationId = _attestationId;
        verificationConfig.olderThanEnabled = _olderThanEnabled;
        verificationConfig.olderThan = _olderThan;
        verificationConfig.forbiddenCountriesEnabled = _forbiddenCountriesEnabled;
        verificationConfig.forbiddenCountriesListPacked = _forbiddenCountriesListPacked;
        verificationConfig.ofacEnabled = _ofacEnabled;
    }

    function verifySelfProof(
        IVcAndDiscloseCircuitVerifier.VcAndDiscloseProof memory proof
    )
        external
        returns (bool)
    {
        IIdentityVerificationHubV1.VcAndDiscloseHubProof memory hubProof = IIdentityVerificationHubV1.VcAndDiscloseHubProof({
            olderThanEnabled: verificationConfig.olderThanEnabled,
            olderThan: verificationConfig.olderThan,
            forbiddenCountriesEnabled: verificationConfig.forbiddenCountriesEnabled,
            forbiddenCountriesListPacked: verificationConfig.forbiddenCountriesListPacked,
            ofacEnabled: verificationConfig.ofacEnabled,
            vcAndDiscloseProof: proof
        });
        try selfIdentityVerificationHub.verifyVcAndDisclose(hubProof) {
            return true;
        } catch {
            return false;
        }
    }

}