import {
  countryNames,
} from '../../../common/src/constants/constants';

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
  verifyAllAbi
} from "./abi/VerifyAll";
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
  protected attestationId: number = 1;
  protected targetRootTimestamp: number = 0;

  protected issuingState: { enabled: boolean; value: string } = { enabled: false, value: '' };
  protected name: { enabled: boolean; value: string } = { enabled: false, value: '' };
  protected passportNumber: { enabled: boolean; value: string } = { enabled: false, value: '' };
  protected nationality: { enabled: boolean; value: (typeof countryNames)[number] } = {
    enabled: false,
    value: '' as (typeof countryNames)[number],
  };
  protected dateOfBirth: { enabled: boolean; value: string } = { enabled: false, value: '' };
  protected gender: { enabled: boolean; value: string } = { enabled: false, value: '' };
  protected expiryDate: { enabled: boolean; value: string } = { enabled: false, value: '' };

  protected minimumAge: { enabled: boolean; value: string } = { enabled: false, value: '18' };
  protected excludedCountries: { enabled: boolean; value: (typeof countryNames)[number][] } = {
    enabled: false,
    value: [],
  };
  protected ofac: boolean = false;

  protected registryContract: any;
  protected verifyAllContract: any;

  constructor(
    devMode: boolean = false,
    rpcUrl: string,
    registryContractAddress: `0x${string}`,
    verifyAllContractAddress: `0x${string}`,
    targetRootTimestamp: number = 0
  ) {
    this.devMode = devMode;
    this.report = new SelfVerifierReport();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.registryContract = new ethers.Contract(registryContractAddress, registryAbi, provider);
    this.verifyAllContract = new ethers.Contract(verifyAllContractAddress, verifyAllAbi, provider);
    this.targetRootTimestamp = targetRootTimestamp;
  }

  public async verify(attestation: SelfAttestation): Promise<SelfVerifierReport> {

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

    const result = await this.verifyAllContract.verifyAll(
      attestation.credentialSubject.scope,
      attestation.credentialSubject.attestation_id,
      attestation.credentialSubject.targetRootTimestamp,
      vcAndDiscloseHubProof,
    )
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
    }
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
