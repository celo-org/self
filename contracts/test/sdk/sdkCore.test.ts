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
import { SelfVerifier } from "../../../sdk/core/src/SelfVerifier";
import { Groth16Proof, PublicSignals, groth16 } from "snarkjs";
import { VcAndDiscloseProof } from "../utils/types";

describe("VerifyAll with AttestationVerifier", () => {
    let attestationVerifier: AttestationVerifier;
    let selfVerifier: SelfVerifier;
    let proof: Groth16Proof;
    let publicSignals: PublicSignals;
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
            undefined,
            undefined,
            forbiddenCountriesList,
            (await deployedActors.user1?.getAddress()).slice(2)
        );
        baseVcAndDiscloseProof = parseSolidityCalldata(await groth16.exportSolidityCallData(rawProof.proof, rawProof.publicSignals), {} as VcAndDiscloseProof);
        console.log("baseVcAndDiscloseProof", baseVcAndDiscloseProof);
        snapshotId = await ethers.provider.send("evm_snapshot", []);
        // Setup AttestationVerifier with the same verifyAll contract
        attestationVerifier = new AttestationVerifier(
            true, // devMode
            "http://127.0.0.1:8545", // or your test RPC URL
            await deployedActors.registry.getAddress() as `0x${string}`,
            await verifyAll.getAddress() as `0x${string}`,
            0 // targetRootTimestamp
        );
        selfVerifier = new SelfVerifier(
            "test-scope",
            true,
            "http://127.0.0.1:8545",
            await deployedActors.registry.getAddress() as `0x${string}`,
            await verifyAll.getAddress() as `0x${string}`,
            0
        );
    });

    beforeEach(async () => {
        vcAndDiscloseProof = structuredClone(baseVcAndDiscloseProof);
    });

    afterEach(async () => {
        await ethers.provider.send("evm_revert", [snapshotId]);
        snapshotId = await ethers.provider.send("evm_snapshot", []);
    });

    it("should verify attestation using AttestationVerifier", async () => {
        // Setup proof and public signals from the existing test
        

        const cscaRoot = await deployedActors.registry.getCscaRoot();
        console.log("cscaRoot", cscaRoot);
        const passportNoOfacRoot = await deployedActors.registry.getPassportNoOfacRoot();
        console.log("passportNoOfacRoot", passportNoOfacRoot);
        const nameAndDobOfacRoot = await deployedActors.registry.getNameAndDobOfacRoot();
        console.log("nameAndDobOfacRoot", nameAndDobOfacRoot);
        const nameAndYobOfacRoot = await deployedActors.registry.getNameAndYobOfacRoot();
        console.log("nameAndYobOfacRoot", nameAndYobOfacRoot);
        // Verify using AttestationVerifier
        selfVerifier.excludeCountries("Afghanistan");
        selfVerifier.setTargetRootTimestamp(0);
        const result = await selfVerifier.verify(
            rawProof.proof,
            rawProof.publicSignals
        );
        // const attestation = await attestationVerifier.verify(
        //     rawProof.proof,
        //     rawProof.publicSignals
        // );

        // Verify the attestation result
        expect(result).to.not.be.null;
        expect(result.credentialSubject.valid).to.be.true;
        expect(result.credentialSubject.name).to.not.be.empty;
    });

    // it("should handle verification failure in AttestationVerifier", async () => {
    //     // Modify proof to cause verification failure
    //     const invalidProof = { ...vcAndDiscloseProof.proof };
    //     const invalidPublicSignals = [...vcAndDiscloseProof.pubSignals];
    //     invalidPublicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX] = generateRandomFieldElement();

    //     try {
    //         await attestationVerifier.verify(
    //             invalidProof,
    //             invalidPublicSignals
    //         );
    //         expect.fail("Should have thrown an error");
    //     } catch (error) {
    //         expect(error).to.exist;
    //     }
    // });
});