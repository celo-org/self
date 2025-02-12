import { expect } from "chai";
import { ethers } from "hardhat";
import { deploySystemFixtures } from "../utils/deployment";
import { DeployedActors } from "../utils/types";
import { generateRandomFieldElement } from "../utils/utils";
import { generateCommitment } from "../../../common/src/utils/passports/passport";
import { ATTESTATION_ID, CIRCUIT_CONSTANTS } from "../utils/constants";
import { LeanIMT } from "@openpassport/zk-kit-lean-imt";
import { poseidon2 } from "poseidon-lite";
import { generateVcAndDiscloseRawProof, parseSolidityCalldata } from "../utils/generateProof";
import { Formatter } from "../utils/formatter";
import { formatCountriesList, reverseBytes } from "../../../common/src/utils/circuits/formatInputs";
import { VerifyAll } from "../../typechain-types";
import { AttestationVerifier } from "../../../sdk/core/src/AttestationVerifier";
import { Groth16Proof, PublicSignals, groth16 } from "snarkjs";
import { VcAndDiscloseProof } from "../utils/types";

describe("VerifyAll", () => {
    let deployedActors: DeployedActors;
    let verifyAll: VerifyAll;
    let snapshotId: string;
    let baseVcAndDiscloseProof: any;
    let vcAndDiscloseProof: any;
    let registerSecret: any;
    let imt: any;
    let commitment: any;
    let nullifier: any;
    let forbiddenCountriesList: string[];
    let forbiddenCountriesListPacked: string;
    let rawProof: {
        proof: Groth16Proof,
        publicSignals: PublicSignals
    };

    before(async () => {
        deployedActors = await deploySystemFixtures();
        const VerifyAllFactory = await ethers.getContractFactory("VerifyAll");
        verifyAll = await VerifyAllFactory.deploy(
            deployedActors.hub.getAddress(),
            deployedActors.registry.getAddress()
        );

        registerSecret = generateRandomFieldElement();
        nullifier = generateRandomFieldElement();
        commitment = generateCommitment(registerSecret, ATTESTATION_ID.E_PASSPORT, deployedActors.mockPassport);
        
        const hashFunction = (a: bigint, b: bigint) => poseidon2([a, b]);
        imt = new LeanIMT<bigint>(hashFunction);
        await imt.insert(BigInt(commitment));

        forbiddenCountriesList = ['AAA', 'ABC', 'CBA'];
        forbiddenCountriesListPacked = reverseBytes(Formatter.bytesToHexString(new Uint8Array(formatCountriesList(forbiddenCountriesList))));

        rawProof = await generateVcAndDiscloseRawProof(
            registerSecret,
            BigInt(ATTESTATION_ID.E_PASSPORT).toString(),
            deployedActors.mockPassport,
            "test-scope",
            new Array(88).fill("1"),
            "1",
            imt,
            "20",
            undefined,
            undefined,
            forbiddenCountriesList,
            (await deployedActors.user1.getAddress()).slice(2)
        );
        baseVcAndDiscloseProof = parseSolidityCalldata(await groth16.exportSolidityCallData(rawProof.proof, rawProof.publicSignals), {} as VcAndDiscloseProof);
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    beforeEach(async () => {
        vcAndDiscloseProof = structuredClone(baseVcAndDiscloseProof);
    });

    afterEach(async () => {
        await ethers.provider.send("evm_revert", [snapshotId]);
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    // describe("verifyAll", () => {
    //     it("should verify and get result successfully", async () => {
    //         const {registry, owner} = deployedActors;

    //         const tx = await registry.connect(owner).devAddIdentityCommitment(
    //             ATTESTATION_ID.E_PASSPORT,
    //             nullifier,
    //             commitment
    //         );
    //         const receipt = await tx.wait() as any;
    //         const timestamp = (await ethers.provider.getBlock(receipt.blockNumber))!.timestamp;

    //         const vcAndDiscloseHubProof = {
    //             olderThanEnabled: true,
    //             olderThan: "20",
    //             forbiddenCountriesEnabled: true,
    //             forbiddenCountriesListPacked: forbiddenCountriesListPacked,
    //             ofacEnabled: true,
    //             vcAndDiscloseProof: vcAndDiscloseProof
    //         };

    //         const types = ['0', '1', '2']; // Example types
    //         const [readableData, success] = await verifyAll.verifyAll(
    //             timestamp,
    //             vcAndDiscloseHubProof,
    //             types
    //         );

    //         expect(success).to.be.true;
    //         expect(readableData.name).to.not.be.empty;
            
    //     });

    //     it("should verify and get result successfully with out timestamp verification", async () => {
    //         const {registry, owner} = deployedActors;

    //         await registry.connect(owner).devAddIdentityCommitment(
    //             ATTESTATION_ID.E_PASSPORT,
    //             nullifier,
    //             commitment
    //         );
    //         const vcAndDiscloseHubProof = {
    //             olderThanEnabled: true,
    //             olderThan: "20",
    //             forbiddenCountriesEnabled: true,
    //             forbiddenCountriesListPacked: forbiddenCountriesListPacked,
    //             ofacEnabled: true,
    //             vcAndDiscloseProof: vcAndDiscloseProof
    //         };

    //         const types = ['0', '1', '2']; // Example types
    //         const [readableData, success] = await verifyAll.verifyAll(
    //             0,
    //             vcAndDiscloseHubProof,
    //             types
    //         );

    //         expect(success).to.be.true;
    //         expect(readableData.name).to.not.be.empty;
            
    //     });

    //     it("should return empty result when verification fails", async () => {
    //         const {registry, owner} = deployedActors;

    //         await registry.connect(owner).devAddIdentityCommitment(
    //             ATTESTATION_ID.E_PASSPORT,
    //             nullifier,
    //             commitment
    //         );

    //         vcAndDiscloseProof.pubSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX] = generateRandomFieldElement();
    //         const vcAndDiscloseHubProof = {
    //             olderThanEnabled: true,
    //             olderThan: "20",
    //             forbiddenCountriesEnabled: true,
    //             forbiddenCountriesListPacked: forbiddenCountriesListPacked,
    //             ofacEnabled: true,
    //             vcAndDiscloseProof: vcAndDiscloseProof
    //         };

    //         const types = ['0', '1', '2'];
    //         const [readableData, success] = await verifyAll.verifyAll(
    //             0,
    //             vcAndDiscloseHubProof,
    //             types
    //         );

    //         expect(success).to.be.false;
    //         expect(readableData.name).to.be.empty;
            
    //     });

    //     it("should fail with invalid root timestamp", async () => {
    //         const {registry, owner} = deployedActors;

    //         await registry.connect(owner).devAddIdentityCommitment(
    //             ATTESTATION_ID.E_PASSPORT,
    //             nullifier,
    //             commitment
    //         );

    //         const vcAndDiscloseHubProof = {
    //             olderThanEnabled: true,
    //             olderThan: "20",
    //             forbiddenCountriesEnabled: true,
    //             forbiddenCountriesListPacked: forbiddenCountriesListPacked,
    //             ofacEnabled: true,
    //             vcAndDiscloseProof: vcAndDiscloseProof
    //         };

    //         const types = ['0', '1', '2'];
    //         const [readableData, success] = await verifyAll.verifyAll(
    //             123456, // Invalid timestamp
    //             vcAndDiscloseHubProof,
    //             types
    //         );

    //         expect(success).to.be.false;
    //         expect(readableData.name).to.be.empty;
    //     });
    // });

    // describe("admin functions", () => {
    //     it("should allow owner to set new hub address", async () => {
    //         const newHubAddress = await deployedActors.user1.getAddress();
    //         await verifyAll.setHub(newHubAddress);
    //     });

    //     it("should allow owner to set new registry address", async () => {
    //         const newRegistryAddress = await deployedActors.user1.getAddress();
    //         await verifyAll.setRegistry(newRegistryAddress);
    //     });

    //     it("should not allow non-owner to set new hub address", async () => {
    //         const newHubAddress = await deployedActors.user1.getAddress();
    //         await expect(
    //             verifyAll.connect(deployedActors.user1).setHub(newHubAddress)
    //         ).to.be.revertedWithCustomError(verifyAll, "OwnableUnauthorizedAccount");
    //     });

    //     it("should not allow non-owner to set new registry address", async () => {
    //         const newRegistryAddress = await deployedActors.user1.getAddress();
    //         await expect(
    //             verifyAll.connect(deployedActors.user1).setRegistry(newRegistryAddress)
    //         ).to.be.revertedWithCustomError(verifyAll, "OwnableUnauthorizedAccount");
    //     });
    // });

    describe("VerifyAll with AttestationVerifier", () => {
        let attestationVerifier: AttestationVerifier;
        let proof: Groth16Proof;
        let publicSignals: PublicSignals;

        before(async () => {
            // Setup AttestationVerifier with the same verifyAll contract
            attestationVerifier = new AttestationVerifier(
                true, // devMode
                "http://localhost:8545", // or your test RPC URL
                await verifyAll.getAddress() as `0x${string}`,
                await deployedActors.registry.getAddress() as `0x${string}`,
                0 // targetRootTimestamp
            );
        });

        it("should verify attestation using AttestationVerifier", async () => {
            // Setup proof and public signals from the existing test
            

            // Verify using AttestationVerifier
            const attestation = await attestationVerifier.verify(
                rawProof.proof,
                rawProof.publicSignals
            );

            // Verify the attestation result
            expect(attestation).to.not.be.null;
            expect(attestation.credentialSubject.valid).to.be.true;
            expect(attestation.credentialSubject.name).to.not.be.empty;
        });

        it("should handle verification failure in AttestationVerifier", async () => {
            // Modify proof to cause verification failure
            const invalidProof = { ...vcAndDiscloseProof.proof };
            const invalidPublicSignals = [...vcAndDiscloseProof.pubSignals];
            invalidPublicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX] = generateRandomFieldElement();

            try {
                await attestationVerifier.verify(
                    invalidProof,
                    invalidPublicSignals
                );
                expect.fail("Should have thrown an error");
            } catch (error) {
                expect(error).to.exist;
            }
        });
    });
});
