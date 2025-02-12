import {
  countryNames,
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
import { SelfVerifierReport } from './SelfVerifierReport';
import {
  registryAbi
} from "./abi/IdentityRegistryImplV1";
import {
  verifyAllAbi
} from "./abi/VerifyAll";
import { ethers } from 'ethers';
// import type { VcAndDiscloseHubProofStruct } from "../../../common/src/utils/contracts/typechain-types/contracts/IdentityVerificationHubImplV1.sol/IdentityVerificationHubImplV1";
import {
  groth16,
  Groth16Proof,
  PublicSignals
} from 'snarkjs';
import { CIRCUIT_CONSTANTS, revealedDataTypes } from '../../../common/src/constants/constants';
import { packForbiddenCountriesList } from '../../../common/src/utils/contracts/formatCallData';
import { parseSolidityCalldata } from '../../../contracts/test/utils/generateProof';


export class AttestationVerifier {

  protected devMode: boolean;
  protected scope: string;
  protected report: SelfVerifierReport;
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

  public async verify(proof: Groth16Proof, publicSignals: PublicSignals): Promise<SelfAttestation> {
    const forbiddenCountriesListPacked = packForbiddenCountriesList(this.excludedCountries.value);
    const solidityProof = parseSolidityCalldata(await groth16.exportSolidityCallData(
        proof,
        publicSignals
    ), {} as VcAndDiscloseProof);

    const vcAndDiscloseHubProof = {
      olderThanEnabled: true,  
      olderThan: "20",                
      forbiddenCountriesEnabled: true,  
      forbiddenCountriesListPacked: forbiddenCountriesListPacked[0], 
      ofacEnabled: [true, true, true],  
      vcAndDiscloseProof: {
          a: solidityProof.a,
          b: [solidityProof.b[0], solidityProof.b[1]],  
          c: solidityProof.c,
          pubSignals: solidityProof.pubSignals
      }
  };

    const types = ["0", "1", "2"];

    const timestamp = this.targetRootTimestamp;

    console.log('Debug info:');
    console.log('timestamp:', timestamp);
    console.log('vcAndDiscloseHubProof:', vcAndDiscloseHubProof);
    console.log('types:', types);

    const result = await this.verifyAllContract.verifyAll(
        timestamp,
        vcAndDiscloseHubProof,
        types
    );

    console.log(result);

    const credentialSubject = {
      userId: "",
      application: this.scope,
      merkle_root: "",
      attestation_id: "",
      current_date: "",
      issuing_state: result[0],
      name: result[0],
      passport_number: result[0],
      nationality: result[0],
      date_of_birth: result[0],
      gender: result[0],
      expiry_date: result[0],
      older_than: result[0],
      valid: result[1],
      nullifier: publicSignals[CIRCUIT_CONSTANTS.REGISTER_NULLIFIER_INDEX],
    }

    const attestation: SelfAttestation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'SelfAttestation'],
      issuer: 'https://selfattestation.com',
      issuanceDate: new Date().toISOString(),
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
