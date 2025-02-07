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
} from '../../../common/src/utils/openPassportAttestation';
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
import { OpenPassportVerifierReport } from './OpenPassportVerifierReport';
import { fetchTreeFromUrl } from '../../../common/src/utils/pubkeyTree';
import fs from 'fs';
import { ethers } from 'ethers';
import { VcAndDiscloseHubProofStruct } from '../../../common/src/typechain-types/contracts/IdentityVerificationHubImplV1.sol/IdentityVerificationHubImplV1';

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
      attestation.proof.mode,
      attestation.proof.value.proof,
      attestation.proof.value.publicSignals,
      attestation.proof.signatureAlgorithm,
      attestation.proof.hashFunction
    );

    switch (attestation.proof.mode) {
      case 'vc_and_disclose':
        await this.verifyDisclose(attestation);
        break;
    }
    return this.report;
  }

  private async verifyDisclose(attestation: OpenPassportAttestation) {
    // verify the root of the commitment
    this.verifyCommitment(attestation);
    // verify disclose attributes
    this.verifyDiscloseAttributes(attestation);
  }

  private verifyDiscloseAttributes(attestation: OpenPassportAttestation) {
    let parsedPublicSignals = parsePublicSignalsDisclose(attestation.proof.value.publicSignals);
    this.verifyAttribute(
      'current_date',
      parsedPublicSignals.current_date.toString(),
      getCurrentDateFormatted().toString()
    );

    const unpackedReveal = unpackReveal(parsedPublicSignals.revealedData_packed);
    if (this.minimumAge.enabled) {
      const attributeValueInt = getOlderThanFromCircuitOutput(parsedPublicSignals.older_than);
      const selfAttributeOlderThan = parseInt(this.minimumAge.value);
      if (attributeValueInt < selfAttributeOlderThan) {
        this.report.exposeAttribute(
          'older_than',
          attributeValueInt.toString(),
          this.minimumAge.value.toString()
        );
      } else {
        console.log('\x1b[32m%s\x1b[0m', '- minimum age verified');
      }
    }
    if (this.nationality.enabled) {
      if (this.nationality.value === 'Any') {
        console.log('\x1b[32m%s\x1b[0m', '- nationality verified');
      } else {
        const attributeValue = getAttributeFromUnpackedReveal(unpackedReveal, 'nationality');
        this.verifyAttribute('nationality', countryCodes[attributeValue], this.nationality.value);
      }
    }
    if (this.ofac) {
      const attributeValue = parsedPublicSignals.ofac_result.toString();
      this.verifyAttribute('ofac', attributeValue, '1');
    }
    if (this.excludedCountries.enabled) {
      const formattedCountryList = formatForbiddenCountriesListFromCircuitOutput(
        parsedPublicSignals.forbidden_countries_list_packed_disclosed
      );
      const formattedCountryListFullCountryNames = formattedCountryList.map(
        (countryCode) => countryCodes[countryCode]
      );
      this.verifyAttribute(
        'forbidden_countries_list',
        formattedCountryListFullCountryNames.toString(),
        this.excludedCountries.value.toString()
      );
    }
  }

  private async verifyCommitment(attestation: OpenPassportAttestation) {
    const tree = await fetchTreeFromUrl(this.commitmentMerkleTreeUrl);
    const parsedPublicSignals = parsePublicSignalsDisclose(attestation.proof.value.publicSignals);
    this.verifyAttribute(
      'merkle_root_commitment',
      tree.root.toString(),
      parsedPublicSignals.merkle_root
    );
  }

  private async verifyProof(
    mode: Mode,
    proof: string[],
    publicSignals: string[],
    signatureAlgorithm: string,
    hashFunction: string
  ): Promise<void> {
    try {
      const vcAndDiscloseHubProof = {

      }
      const result = await this.hubContract.verifyVcAndDisclose(proof);
    } catch (error) {
      this.report.exposeAttribute('proof', 'false', 'true');
    }
  }

}
