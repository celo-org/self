// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IIdentityRegistryV1
 * @notice Interface for the Identity Registry v1.
 * @dev This interface exposes only the external functions accessible by regular callers,
 *      i.e. functions that are not owner-restricted.
 */
interface IIdentityRegistryV1 {
    /**
     * @notice Retrieves the address of the registered identity verification hub.
     * @return The address of the hub.
     */
    function hub() external view returns (address);

    /**
     * @notice Checks if a specific nullifier is already registered for the given attestation.
     * @param attestationId The attestation identifier.
     * @param nullifier The nullifier to check.
     * @return True if the nullifier is registered; otherwise, false.
     */
    function nullifiers(
        bytes32 attestationId,
        uint256 nullifier
    ) external view returns (bool);

    /**
     * @notice Checks whether a DSC key commitment is registered.
     * @param commitment The DSC key commitment to check.
     * @return True if the commitment is registered, false otherwise.
     */
    function isRegisteredDscKeyCommitment(
        uint256 commitment
    ) external view returns (bool);

    /**
     * @notice Retrieves the timestamp at which a given Merkle tree root was created.
     * @param root The Merkle tree root.
     * @return The creation timestamp for the provided root.
     */
    function rootTimestamps(uint256 root) external view returns (uint256);

    /**
     * @notice Checks if the identity commitment Merkle tree contains the specified root.
     * @param root The Merkle tree root to check.
     * @return True if the root exists in the tree, false otherwise.
     */
    function checkIdentityCommitmentRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the total number of identity commitments in the Merkle tree.
     * @return The size (i.e., count) of the identity commitment Merkle tree.
     */
    function getIdentityCommitmentMerkleTreeSize() external view returns (uint256);

    /**
     * @notice Retrieves the current Merkle root of the identity commitments.
     * @return The current identity commitment Merkle root.
     */
    function getIdentityCommitmentMerkleRoot() external view returns (uint256);

    /**
     * @notice Retrieves the index of a specific identity commitment in the Merkle tree.
     * @param commitment The identity commitment to locate.
     * @return The index position of the provided commitment.
     */
    function getIdentityCommitmentIndex(
        uint256 commitment
    ) external view returns (uint256);

    /**
     * @notice Checks if the provided CSCA root matches the stored CSCA root.
     * @param root The CSCA root to verify.
     * @return True if the given root equals the stored CSCA root, otherwise false.
     */
    function checkCscaRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the current OFAC passport number root.
     * @return The current OFAC passport number root value.
     */
    function getOfacPassportNoRoot() external view returns (uint256);

    /**
     * @notice Checks if the provided OFAC passport number root matches the stored value.
     * @param root The OFAC passport number root to verify.
     * @return True if the given root equals the stored OFAC passport number root, otherwise false.
     */
    function checkOfacPassportNoRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the current OFAC name and date of birth root.
     * @return The current OFAC name and date of birth root value.
     */
    function getOfacNameDobRoot() external view returns (uint256);

    /**
     * @notice Checks if the provided OFAC name and date of birth root matches the stored value.
     * @param root The OFAC name and date of birth root to verify.
     * @return True if the given root equals the stored OFAC name and date of birth root, otherwise false.
     */
    function checkOfacNameDobRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the current OFAC name and year of birth root.
     * @return The current OFAC name and year of birth root value.
     */
    function getOfacNameYobRoot() external view returns (uint256);

    /**
     * @notice Checks if the provided OFAC name and year of birth root matches the stored value.
     * @param root The OFAC name and year of birth root to verify.
     * @return True if the given root equals the stored OFAC name and year of birth root, otherwise false.
     */
    function checkOfacNameYobRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Checks if all three OFAC SMT roots match the provided roots.
     * @param passportNoRoot The OFAC passport number root to check.
     * @param nameDobRoot The OFAC name and date of birth root to check.
     * @param nameYobRoot The OFAC name and year of birth root to check.
     * @return True if all roots match, false otherwise.
     */
    function checkOfacRoots(
        uint256 passportNoRoot,
        uint256 nameDobRoot,
        uint256 nameYobRoot
    ) external view returns (bool);

    /**
     * @notice Retrieves the current Merkle root of the DSC key commitments.
     * @return The current DSC key commitment Merkle root.
     */
    function getDscKeyCommitmentMerkleRoot() external view returns (uint256);

    /**
     * @notice Checks if the provided root matches the DSC key commitment Merkle root.
     * @param root The root to check.
     * @return True if it matches the current root, false otherwise.
     */
    function checkDscKeyCommitmentMerkleRoot(
        uint256 root
    ) external view returns (bool);

    /**
     * @notice Retrieves the total number of DSC key commitments in the Merkle tree.
     * @return The DSC key commitment Merkle tree size.
     */
    function getDscKeyCommitmentTreeSize() external view returns (uint256);

    /**
     * @notice Retrieves the index of a specific DSC key commitment in the Merkle tree.
     * @param commitment The DSC key commitment to locate.
     * @return The index of the provided commitment.
     */
    function getDscKeyCommitmentIndex(
        uint256 commitment
    ) external view returns (uint256);

    /**
     * @notice Registers a new identity commitment.
     * @dev Must be called by the identity verification hub. Reverts if the nullifier has already been used.
     * @param attestationId The attestation identifier associated with the commitment.
     * @param nullifier A unique nullifier to prevent double registration.
     * @param commitment The identity commitment to register.
     */
    function registerCommitment(
        bytes32 attestationId,
        uint256 nullifier,
        uint256 commitment
    ) external;

    /**
     * @notice Registers a new DSC key commitment.
     * @dev Must be called by the identity verification hub. Reverts if the DSC key commitment is already registered.
     * @param dscCommitment The DSC key commitment to register.
     */
    function registerDscKeyCommitment(
        uint256 dscCommitment
    ) external;
}
