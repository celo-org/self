// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IIdentityVerificationHubV1} from "../interfaces/IIdentityVerificationHubV1.sol";
import {IIdentityRegistryV1} from "../interfaces/IIdentityRegistryV1.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CircuitConstants} from "../constants/CircuitConstants.sol";

contract VerifyAll is Ownable {

    IIdentityVerificationHubV1 _hub;
    IIdentityRegistryV1 _registry;

    constructor(
        address hub,
        address registry
    ) Ownable(msg.sender) {
        _hub = IIdentityVerificationHubV1(hub);
        _registry = IIdentityRegistryV1(registry);
    }

    function verifyAll (
        uint256 scope,
        uint256 attestationId,
        uint256 targetRootTimestamp,
        IIdentityVerificationHubV1.VcAndDiscloseHubProof memory proof,
        IIdentityVerificationHubV1.RevealedDataType[] memory types,
        IIdentityVerificationHubV1.ReadableRevealedData memory expectedData
    )
        external
        view
        returns (bool)
    {
        if (scope != proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_SCOPE_INDEX]) {
            return false;
        }

        if (attestationId != proof.vcAndDiscloseProof.pubSignals[CircuitConstants.VC_AND_DISCLOSE_ATTESTATION_ID_INDEX]) {
            return false;
        }

        IIdentityVerificationHubV1.VcAndDiscloseVerificationResult memory result;
        try _hub.verifyVcAndDisclose(proof) returns (IIdentityVerificationHubV1.VcAndDiscloseVerificationResult memory _result) {
            result = _result;
        } catch {
            return false;
        }

        if (targetRootTimestamp != 0) {
            if (_registry.rootTimestamps(result.identityCommitmentRoot) != targetRootTimestamp) {
                return false;
            }
        }

        uint256[3] memory revealedDataPacked = result.revealedDataPacked;
        IIdentityVerificationHubV1.ReadableRevealedData memory readableData = _hub.getReadableRevealedData(revealedDataPacked, types);

        for (uint256 i = 0; i < types.length; i++) {
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.ISSUING_STATE) {
                if (keccak256(bytes(readableData.issuingState)) != keccak256(bytes(expectedData.issuingState))) {
                    return false;
                }
            }
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.NAME) {
                if (keccak256(bytes(readableData.name[i])) != keccak256(bytes(expectedData.name[i]))) {
                    return false;
                }
            }
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.PASSPORT_NUMBER) {
                if (keccak256(bytes(readableData.passportNumber)) != keccak256(bytes(expectedData.passportNumber))) {
                    return false;
                }
            }
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.NATIONALITY) {
                if (keccak256(bytes(readableData.nationality)) != keccak256(bytes(expectedData.nationality))) {
                    return false;
                }
            }
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.DATE_OF_BIRTH) {
                if (keccak256(bytes(readableData.dateOfBirth)) != keccak256(bytes(expectedData.dateOfBirth))) {
                    return false;
                }
            }
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.GENDER) {
                if (keccak256(bytes(readableData.gender)) != keccak256(bytes(expectedData.gender))) {
                    return false;
                }
            }
            if (types[i] == IIdentityVerificationHubV1.RevealedDataType.EXPIRY_DATE) {
                if (keccak256(bytes(readableData.expiryDate)) != keccak256(bytes(expectedData.expiryDate))) {
                    return false;
                }
            }
        }
        return true;
    }

    function setHub(address hub) external onlyOwner {
        _hub = IIdentityVerificationHubV1(hub);
    }

}