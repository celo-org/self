// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IVcAndDiscloseCircuitVerifier} from "../interfaces/IVcAndDiscloseCircuitVerifier.sol";
import {IIdentityVerificationHubV1} from "../interfaces/IIdentityVerificationHubV1.sol";
import {ISelfVerificationRoot} from "../interfaces/ISelfVerificationRoot.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";

abstract contract SelfVerificationRoot is ISelfVerificationRoot {

    uint256 internal _scope;
    uint256 internal _attestationId;

    ISelfVerificationRoot.VerificationConfig internal _verificationConfig;

    IIdentityVerificationHubV1 internal immutable _identityVerificationHub;

    error InvalidScope();
    error InvalidAttestationId();

    constructor(
        address identityVerificationHub,
        uint256 scope,
        uint256 attestationId,
        bool olderThanEnabled,
        uint256 olderThan,
        bool forbiddenCountriesEnabled,
        uint256[4] memory forbiddenCountriesListPacked,
        bool[3] memory ofacEnabled
    ) {
        _identityVerificationHub = IIdentityVerificationHubV1(identityVerificationHub);
        _scope = scope;
        _attestationId = attestationId;
        _verificationConfig.olderThanEnabled = olderThanEnabled;
        _verificationConfig.olderThan = olderThan;
        _verificationConfig.forbiddenCountriesEnabled = forbiddenCountriesEnabled;
        _verificationConfig.forbiddenCountriesListPacked = forbiddenCountriesListPacked;
        _verificationConfig.ofacEnabled = ofacEnabled;
    }

    function verifySelfProof(
        IVcAndDiscloseCircuitVerifier.VcAndDiscloseProof memory proof
    ) 
        public
        virtual
    {
        if (_scope != proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_SCOPE_INDEX]) {
            revert InvalidScope();
        }

        if (_attestationId != proof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_ATTESTATION_ID_INDEX]) {
            revert InvalidAttestationId();
        }

        _identityVerificationHub.verifyVcAndDisclose(
            IIdentityVerificationHubV1.VcAndDiscloseHubProof({
                olderThanEnabled: _verificationConfig.olderThanEnabled,
                olderThan: _verificationConfig.olderThan,
                forbiddenCountriesEnabled: _verificationConfig.forbiddenCountriesEnabled,
                forbiddenCountriesListPacked: _verificationConfig.forbiddenCountriesListPacked,
                ofacEnabled: _verificationConfig.ofacEnabled,
                vcAndDiscloseProof: proof
            })
        );
        
    }

}