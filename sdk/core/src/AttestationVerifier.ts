import {
  countryNames,
  getCountryCode,
} from '../../../common/src/constants/constants';
import type { SelfAttestation } from '../../../common/src/utils/selfAttestation';
import {
  parsePublicSignalsDisclose,
} from '../../../common/src/utils/selfAttestation';
import {
  formatForbiddenCountriesListFromCircuitOutput,
  getAttributeFromUnpackedReveal,
  unpackReveal,
} from '../../../common/src/utils/circuits/formatOutputs';
import { castToScope } from '../../../common/src/utils/circuits/uuid';
import { VcAndDiscloseProof } from '../../../contracts/test/utils/types';
import {
  registryAbi
} from "./abi/IdentityRegistryImplV1";
import {
  verifyAllAbi
} from "./abi/VerifyAll";
import { ethers } from 'ethers';
import {
  groth16,
  Groth16Proof,
  PublicSignals
} from 'snarkjs';
import { CIRCUIT_CONSTANTS, revealedDataTypes } from '../../../common/src/constants/constants';
import { packForbiddenCountriesList } from '../../../common/src/utils/contracts/formatCallData';
import { parseSolidityCalldata } from '../../../contracts/test/utils/generateProof';


export class AttestationVerifier {

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
    registryContractAddress: `0x${string}`,
    verifyAllContractAddress: `0x${string}`,
  ) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.registryContract = new ethers.Contract(registryContractAddress, registryAbi, provider);
    this.verifyAllContract = new ethers.Contract(verifyAllContractAddress, verifyAllAbi, provider);
  }

  public async verify(
    proof: Groth16Proof, 
    publicSignals: PublicSignals
  ): Promise<SelfAttestation> {
    const excludedCountryCodes = this.excludedCountries.value.map(country => getCountryCode(country));
    const forbiddenCountriesListPacked = packForbiddenCountriesList(excludedCountryCodes);
    const packedValue = forbiddenCountriesListPacked.length > 0 ? forbiddenCountriesListPacked[0] : '0';
    const solidityProof = parseSolidityCalldata(await groth16.exportSolidityCallData(
      proof,
      publicSignals
    ), {} as VcAndDiscloseProof);

    const vcAndDiscloseHubProof = {
      olderThanEnabled: this.minimumAge.enabled,  
      olderThan: this.minimumAge.value,                
      forbiddenCountriesEnabled: this.excludedCountries.enabled,  
      forbiddenCountriesListPacked: packedValue, 
      ofacEnabled: [
        this.passportNoOfac, 
        this.nameAndDobOfac, 
        this.nameAndYobOfac
      ],  
      vcAndDiscloseProof: {
          a: solidityProof.a,
          b: [solidityProof.b[0], solidityProof.b[1]],  
          c: solidityProof.c,
          pubSignals: solidityProof.pubSignals
      }
    };

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

    const timestamp = this.targetRootTimestamp;
    const result = await this.verifyAllContract.verifyAll(
        timestamp,
        vcAndDiscloseHubProof,
        types
    );

    const credentialSubject = {
      userId: publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_USER_IDENTIFIER_INDEX],
      valid: result[1],
      application: this.scope,
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
      nullifier: publicSignals[CIRCUIT_CONSTANTS.VC_AND_DISCLOSE_NULLIFIER_INDEX],
    }

    const attestation: SelfAttestation = {
      credentialSubject: credentialSubject,
      proof: {
        type: "Groth16Proof",
        verificationMethod: "Vc and Disclose",
        value: {
          proof: proof,
          publicSignals: publicSignals,
        },
        vkey: "",
      }
    }

    return attestation;
  }

}
