import { groth16 } from 'snarkjs';
import {
  countryNames,
  countryCodes,
} from '../../../common/src/constants/constants';
import {
  areArraysEqual,
  getCurrentDateFormatted,
  getVkeyFromArtifacts,
  verifyDSCValidity,
} from '../utils/utils';
import {
  OpenPassportAttestation,
  parsePublicSignalsDisclose,
  parsePublicSignalsDsc,
  parsePublicSignalsProve,
} from '../../../common/src/utils/selfAttestation';
import { Mode } from 'fs';
import forge from 'node-forge';
import {
  castToScope,
  formatForbiddenCountriesListFromCircuitOutput,
  getAttributeFromUnpackedReveal,
  getOlderThanFromCircuitOutput,
  splitToWords,
} from '../../../common/src/utils/utils';
import { unpackReveal } from '../../../common/src/utils/revealBitmap';
import { getCSCAModulusMerkleTree } from '../../../common/src/utils/csca';
import { OpenPassportVerifierReport } from './SelfVerifierReport';
import { fetchTreeFromUrl } from '../../../common/src/utils/pubkeyTree';
import fs from 'fs';
import { ethers } from 'ethers';
import type { VcAndDiscloseHubProofStruct } from "../../../common/src/utils/contracts/typechain-types/contracts/IdentityVerificationHubImplV1.sol/IdentityVerificationHubImplV1";
import { revealedDataTypes } from '../../../common/src/constants/constants';
import {
  Groth16Proof,
  PublicSignals,
  groth16
} from 'snarkjs';
import { CIRCUIT_CONSTANTS } from '../../../common/src/constants/constants';

export class AttestationVerifier {
  protected devMode: boolean;
  protected scope: string;
  protected report: OpenPassportVerifierReport;

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
    this.report = new OpenPassportVerifierReport();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const registryAbi = JSON.parse(fs.readFileSync('./abi/IdentityRegistryImplV1.json', 'utf8'));
    this.registryContract = new ethers.Contract(registryContractAddress, registryAbi.abi, provider);
    const hubAbi = JSON.parse(fs.readFileSync('./abi/IdentityVerificationHubImplV1.json', 'utf8'));
    this.hubContract = new ethers.Contract(hubContractAddress, hubAbi.abi, provider);
  }

  public async verify(attestation: OpenPassportAttestation): Promise<OpenPassportVerifierReport> {

    let parsedPublicSignals = parsePublicSignalsDisclose(attestation.proof.value.publicSignals);

    this.verifyAttribute('scope', castToScope(parsedPublicSignals.scope), this.scope);

    await this.verifyProof(
      attestation
    );

    return this.report;
  }

  private async verifyProof(
    attestation: OpenPassportAttestation
  ): Promise<void> {

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

    let result
    try {
      result = await this.hubContract.verifyVcAndDisclose(vcAndDiscloseHubProof);
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
          this.report.exposeAttribute(
            'current_date', 
            , 
            'true'
          );
          break;
        case "INVALID_OLDER_THAN":
          this.report.exposeAttribute(
            'older_than', 
            attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_OLDER_THAN_INDEX], 
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
            attestation.proof.value.publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_OFAC_ROOT_INDEX], 
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

    const readableRevealedData = await this.registryContract.getReadableRevealedData(
      result.revealedDataPacked, 
      [
        revealedDataTypes.issuing_state, 
        revealedDataTypes.name, 
        revealedDataTypes.passport_number, 
        revealedDataTypes.nationality, 
        revealedDataTypes.date_of_birth, 
        revealedDataTypes.gender, 
        revealedDataTypes.expiry_date, 
        revealedDataTypes.older_than, 
        revealedDataTypes.ofac
      ]
    );

      return readableRevealedData;
  }

  private verifyAttribute(
    attribute: keyof OpenPassportVerifierReport,
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
