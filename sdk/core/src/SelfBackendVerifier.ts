import { VcAndDiscloseProof } from './types/types';
import { registryAbi } from './abi/IdentityRegistryImplV1';
import { verifyAllAbi } from './abi/VerifyAll';
import { parseSolidityCalldata } from './utils/utils';
import { ethers } from 'ethers';
import { groth16, Groth16Proof, PublicSignals } from 'snarkjs';
import {
  countryCodes,
  countryNames,
  getCountryCode,
} from '../../../common/src/constants/constants';
import type { SelfVerificationResult } from '../../../common/src/utils/selfAttestation';
import { castToScope } from '../../../common/src/utils/circuits/uuid';
import { CIRCUIT_CONSTANTS, revealedDataTypes } from '../../../common/src/constants/constants';
import { packForbiddenCountriesList } from '../../../common/src/utils/contracts/formatCallData';

export class SelfBackendVerifier {
  protected scope: string;
  protected attestationId: number = 1;
  protected targetRootTimestamp: number = 0;

  protected nationality: { enabled: boolean; value: (typeof countryNames)[number] } = {
    enabled: false,
    value: '' as (typeof countryNames)[number],
  };
  protected minimumAge: { enabled: boolean; value: string } = { enabled: false, value: '18' };
  protected excludedCountries: { enabled: boolean; value: (typeof countryNames)[number][] } = {
    enabled: false,
    value: [],
  };
  protected passportNoOfac: boolean = false;
  protected nameAndDobOfac: boolean = false;
  protected nameAndYobOfac: boolean = false;

  protected registryContract: any;
  protected verifyAllContract: any;

  constructor(
    rpcUrl: string,
    scope: string,
    registryContractAddress: `0x${string}`,
    verifyAllContractAddress: `0x${string}`
  ) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.registryContract = new ethers.Contract(registryContractAddress, registryAbi, provider);
    this.verifyAllContract = new ethers.Contract(verifyAllContractAddress, verifyAllAbi, provider);
    this.scope = scope;
  }

  public async verify(
    proof: Groth16Proof,
    publicSignals: PublicSignals
  ): Promise<SelfVerificationResult> {
    const excludedCountryCodes = this.excludedCountries.value.map((country) =>
      getCountryCode(country)
    );
    const forbiddenCountriesListPacked = packForbiddenCountriesList(excludedCountryCodes);
    const packedValue =
      forbiddenCountriesListPacked.length > 0 ? forbiddenCountriesListPacked[0] : '0';
    const solidityProof = parseSolidityCalldata(
      await groth16.exportSolidityCallData(proof, publicSignals),
      {} as VcAndDiscloseProof
    );

    const isValidScope =
      this.scope ===
      castToScope(BigInt(publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_SCOPE_INDEX]));
    const isValidAttestationId =
      this.attestationId.toString() ===
      publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_ATTESTATION_ID_INDEX];

    console.log("niconiconico");

    const vcAndDiscloseHubProof = {
      olderThanEnabled: this.minimumAge.enabled,
      olderThan: this.minimumAge.value,
      forbiddenCountriesEnabled: this.excludedCountries.enabled,
      forbiddenCountriesListPacked: packedValue,
      ofacEnabled: [this.passportNoOfac, this.nameAndDobOfac, this.nameAndYobOfac],
      vcAndDiscloseProof: {
        a: solidityProof.a,
        b: [solidityProof.b[0], solidityProof.b[1]],
        c: solidityProof.c,
        pubSignals: solidityProof.pubSignals,
      },
    };
    console.log("vcAndDiscloseHubProof: ", vcAndDiscloseHubProof);

    console.log("11");
    const types = [
      revealedDataTypes.issuing_state,
      revealedDataTypes.name,
      revealedDataTypes.passport_number,
      revealedDataTypes.nationality,
      revealedDataTypes.date_of_birth,
      revealedDataTypes.gender,
      revealedDataTypes.expiry_date,
      revealedDataTypes.older_than,
      revealedDataTypes.passport_no_ofac,
      revealedDataTypes.name_and_dob_ofac,
      revealedDataTypes.name_and_yob_ofac,
    ];

    // const timestamp = this.targetRootTimestamp;
    const currentRoot = await this.registryContract.getIdentityCommitmentMerkleRoot();
    console.log("current root: ", currentRoot);
    const timestamp = await this.registryContract.rootTimestamps(currentRoot);
    console.log("timestamp: ", timestamp);
    const ownerVerifyAll = await this.verifyAllContract.owner(); 
    console.log("ownerVerifyAll: ", ownerVerifyAll);

    console.log("15");
    const encodedData = this.verifyAllContract.interface.encodeFunctionData(
      "verifyAll",
      [timestamp, vcAndDiscloseHubProof, types]
    );
    console.log("Raw input data:", encodedData);

    const result = await this.verifyAllContract.verifyAll(timestamp, vcAndDiscloseHubProof, types);
    console.log("result: ", result);

    console.log("12");
    let isValidNationality = true;
    if (this.nationality.enabled) {
      const nationality = result[0][revealedDataTypes.nationality];
      const countryCode = countryCodes[nationality as keyof typeof countryCodes];
      isValidNationality = countryCode === this.nationality.value;
    }

    const credentialSubject = {
      merkle_root: publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX],
      attestation_id: this.attestationId.toString(),
      current_date: new Date().toISOString(),
      issuing_state: result[0][revealedDataTypes.issuing_state],
      name: result[0][revealedDataTypes.name],
      passport_number: result[0][revealedDataTypes.passport_number],
      nationality: result[0][revealedDataTypes.nationality],
      date_of_birth: result[0][revealedDataTypes.date_of_birth],
      gender: result[0][revealedDataTypes.gender],
      expiry_date: result[0][revealedDataTypes.expiry_date],
      older_than: result[0][revealedDataTypes.older_than],
      passport_no_ofac: result[0][revealedDataTypes.passport_no_ofac],
      name_and_dob_ofac: result[0][revealedDataTypes.name_and_dob_ofac],
      name_and_yob_ofac: result[0][revealedDataTypes.name_and_yob_ofac],
    };

    console.log("14");
    const attestation: SelfVerificationResult = {
      isValid: result[1] && isValidScope && isValidAttestationId && isValidNationality,
      isValidDetails: {
        isValidScope: isValidScope,
        isValidAttestationId: isValidAttestationId,
        isValidProof: result[1],
        isValidNationality: isValidNationality,
      },
      userId: publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX],
      application: this.scope,
      nullifier: publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_NULLIFIER_INDEX],
      credentialSubject: credentialSubject,
      proof: {
        value: {
          proof: proof,
          publicSignals: publicSignals,
        },
      },
    };

    return attestation;
  }

  setTargetRootTimestamp(targetRootTimestamp: number): this {
    this.targetRootTimestamp = targetRootTimestamp;
    return this;
  }

  setMinimumAge(age: number): this {
    if (age < 10) {
      throw new Error('Minimum age must be at least 10 years old');
    }
    if (age > 100) {
      throw new Error('Minimum age must be at most 100 years old');
    }
    this.minimumAge = { enabled: true, value: age.toString() };
    return this;
  }

  setNationality(country: (typeof countryNames)[number]): this {
    this.nationality = { enabled: true, value: country };
    return this;
  }

  discloseNationality(): this {
    this.setNationality('Any');
    return this;
  }

  excludeCountries(...countries: (typeof countryNames)[number][]): this {
    this.excludedCountries = { enabled: true, value: countries };
    return this;
  }

  enablePassportNoOfacCheck(): this {
    this.passportNoOfac = true;
    return this;
  }

  enableNameAndDobOfacCheck(): this {
    this.nameAndDobOfac = true;
    return this;
  }

  enableNameAndYobOfacCheck(): this {
    this.nameAndYobOfac = true;
    return this;
  }
}
