import {
  countryNames,
} from '../../../common/src/constants/constants';
import {
  getCurrentDateFormatted,
} from '../utils/utils';
import {
  SelfAttestation,
  parsePublicSignalsDisclose,
} from '../../../common/src/utils/selfAttestation';
import {
  formatForbiddenCountriesListFromCircuitOutput,
  getAttributeFromUnpackedReveal,
  unpackReveal,
} from '../../../common/src/utils/circuits/formatOutputs';
import { castToScope } from '../../../common/src/utils/circuits/uuid';
import { SelfVerifierReport } from './SelfVerifierReport';
import {
  registryAbi
} from "./abi/IdentityRegistryImplV1";
import {
  hubAbi
} from "./abi/IdentityVerificationHubImplV1";
import { ethers } from 'ethers';
import type { VcAndDiscloseHubProofStruct } from "../../../common/src/utils/contracts/typechain-types/contracts/IdentityVerificationHubImplV1.sol/IdentityVerificationHubImplV1";
import {
  groth16
} from 'snarkjs';
import { CIRCUIT_CONSTANTS } from '../../../common/src/constants/constants';

export class AttestationVerifier {
  protected devMode: boolean;
  protected scope: string;
  protected report: SelfVerifierReport;

  protected minimumAge: { enabled: boolean; value: string } = { enabled: false, value: '18' };
  protected nationality: { enabled: boolean; value: (typeof countryNames)[number] } = {
    enabled: false,
    value: '' as (typeof countryNames)[number],
  };
  protected excludedCountries: { enabled: boolean; value: (typeof countryNames)[number][] } = {
    enabled: false,
    value: [],
  };
  protected ofac: boolean = false;

  protected registryContract: any;
  protected hubContract: any;

  constructor(
    devMode: boolean = false,
    rpcUrl: string,
    registryContractAddress: `0x${string}`,
    hubContractAddress: `0x${string}`
  ) {
    this.devMode = devMode;
    this.report = new SelfVerifierReport();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.registryContract = new ethers.Contract(registryContractAddress, registryAbi, provider);
    this.hubContract = new ethers.Contract(hubContractAddress, hubAbi, provider);
  }

  public async verify(attestation: SelfAttestation): Promise<SelfVerifierReport> {

    let parsedPublicSignals = parsePublicSignalsDisclose(attestation.proof.value.publicSignals);

    this.verifyAttribute('scope', castToScope(parsedPublicSignals.scope), this.scope);

    const revealdedData = await this.verifyProof(
      attestation
    );

    if (attestation.credentialSubject.issuing_state) {
      this.verifyAttribute('issuing_state', revealdedData.issuing_state, attestation.credentialSubject.issuing_state);
    } else if (attestation.credentialSubject.name) {
      this.verifyAttribute('name', revealdedData.name, attestation.credentialSubject.name);
    } else if (attestation.credentialSubject.passport_number) {
      this.verifyAttribute('passport_number', revealdedData.passport_number, attestation.credentialSubject.passport_number);
    } else if (attestation.credentialSubject.nationality) {
      this.verifyAttribute('nationality', revealdedData.nationality, attestation.credentialSubject.nationality);
    } else if (attestation.credentialSubject.date_of_birth) {
      this.verifyAttribute('date_of_birth', revealdedData.date_of_birth, attestation.credentialSubject.date_of_birth);
    } else if (attestation.credentialSubject.gender) {
      this.verifyAttribute('gender', revealdedData.gender, attestation.credentialSubject.gender);
    } else if (attestation.credentialSubject.expiry_date) {
      this.verifyAttribute('expiry_date', revealdedData.expiry_date, attestation.credentialSubject.expiry_date);
    }

    return this.report;
  }

  private async verifyProof(
    attestation: SelfAttestation
   ) {

    const unpackedReveal = unpackReveal(
      [
        attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_REVEALED_DATA_PACKED_INDEX],
        attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_REVEALED_DATA_PACKED_INDEX + 1],
        attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_REVEALED_DATA_PACKED_INDEX + 2],
      ]
    );

    const solidityProof = await groth16.exportSolidityCallData(
      attestation.proof.value.proof,
      attestation.proof.value.publicSignals,
    );

    const vcAndDiscloseHubProof: VcAndDiscloseHubProofStruct = {
      olderThanEnabled: this.minimumAge.enabled,
      olderThan: BigInt(this.minimumAge.value),
      forbiddenCountriesEnabled: this.excludedCountries.enabled,
      forbiddenCountriesListPacked: BigInt(this.excludedCountries.value.length),
      ofacEnabled: this.ofac,
      vcAndDiscloseProof: solidityProof
    }

    try {
      await this.hubContract.verifyVcAndDisclose(vcAndDiscloseHubProof);
    } catch (error: any) {
      let errorName: string | undefined;
      try {
        const decodedError = this.hubContract.interface.parseError(error.data);
        errorName = decodedError?.name;
      } catch (e) {
        console.error("Error decoding revert data:", e);
      }
      
      switch (errorName) {
        case "INVALID_COMMITMENT_ROOT":
          const expectedRoot = await this.registryContract.getIdentityCommitmentRoot();
          this.report.exposeAttribute(
            'merkle_root_commitment', 
            attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_MERKLE_ROOT_INDEX], 
            expectedRoot
          );
          break;
        case "CURRENT_DATE_NOT_IN_VALID_RANGE":
          const parsedPublicSignals = parsePublicSignalsDisclose(attestation.proof.value.publicSignals);
          this.report.exposeAttribute(
            'current_date', 
            parsedPublicSignals.current_date.toString(), 
            getCurrentDateFormatted().toString()
          );
          break;
        case "INVALID_OLDER_THAN":
          const olderThan = getAttributeFromUnpackedReveal(unpackedReveal, "older_than");
          this.report.exposeAttribute(
            'older_than', 
            olderThan,
            this.minimumAge.value
          );
          break;
        case "INVALID_OFAC":
          this.report.exposeAttribute(
            'ofac', 
            'false', 
            'true'
          );
          break;
        case "INVALID_OFAC_ROOT":
          const expectedOfacRoot = await this.registryContract.getOfacMerkleRoot();
          this.report.exposeAttribute(
            'merkle_root_ofac',
            attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_SMT_ROOT_INDEX], 
            expectedOfacRoot
          );
          break;
        case "INVALID_FORBIDDEN_COUNTRIES":
          this.report.exposeAttribute(
            'forbidden_countries_list',
            formatForbiddenCountriesListFromCircuitOutput(
              attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_FORBIDDEN_COUNTRIES_LIST_PACKED_INDEX]
            ), 
            this.excludedCountries.value
          );
          break;
        case "INVALID_VC_AND_DISCLOSE_PROOF":
          this.report.exposeAttribute(
            'proof', 
            'false', 
            'true'
          );
          break;
        default:
          console.error("Unknown error occurred:", error);
          break;
      }
    }

    const readableRevealedData = {
      issuing_state: getAttributeFromUnpackedReveal(unpackedReveal, 'issuing_state'),
      name: getAttributeFromUnpackedReveal(unpackedReveal, 'name'),
      passport_number: getAttributeFromUnpackedReveal(unpackedReveal, 'passport_number'),
      nationality: getAttributeFromUnpackedReveal(unpackedReveal, 'nationality'),
      date_of_birth: getAttributeFromUnpackedReveal(unpackedReveal, 'date_of_birth'),
      gender: getAttributeFromUnpackedReveal(unpackedReveal, 'gender'),
      expiry_date: getAttributeFromUnpackedReveal(unpackedReveal, 'expiry_date'),
      older_than: getAttributeFromUnpackedReveal(unpackedReveal, 'older_than'),

    }

    return readableRevealedData;
  }

  private verifyAttribute(
    attribute: keyof SelfVerifierReport,
    value: string,
    expectedValue: string
  ) {
    if (value !== expectedValue) {
      this.report.exposeAttribute(attribute, value, expectedValue);
    } else {
      console.log('\x1b[32m%s\x1b[0m', `- attribute ${attribute} verified`);
    }
  }

}
