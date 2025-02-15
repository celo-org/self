import { LeanIMT } from '@openpassport/zk-kit-lean-imt';
import { SMT } from '@openpassport/zk-kit-smt';
import { poseidon2 } from 'poseidon-lite';

import nameAndDobSMTData from '../../../../common/ofacdata/outputs/nameAndDobSMT.json';
import nameAndYobSMTData from '../../../../common/ofacdata/outputs/nameAndYobSMT.json';
import passportNoAndNationalitySMTData from '../../../../common/ofacdata/outputs/passportNoAndNationalitySMT.json';
import {
  DEFAULT_MAJORITY,
  DEPLOYED_CIRCUITS_DSC,
  DEPLOYED_CIRCUITS_REGISTER,
  PASSPORT_ATTESTATION_ID,
  WS_RPC_URL_DSC,
  WS_RPC_URL_REGISTER,
  WS_RPC_URL_VC_AND_DISCLOSE,
  attributeToPosition,
} from '../../../../common/src/constants/constants';
import { SelfApp } from '../../../../common/src/utils/appType';
import { getCircuitNameFromPassportData } from '../../../../common/src/utils/circuits/circuitsName';
import {
  generateCircuitInputsDSC,
  generateCircuitInputsRegister,
  generateCircuitInputsVCandDisclose,
} from '../../../../common/src/utils/circuits/generateInputs';
import {
  generateCommitment,
  generateNullifier,
} from '../../../../common/src/utils/passports/passport';
import {
  getCSCATree,
  getCommitmentTree,
  getDSCTree,
  getLeafDscTree,
} from '../../../../common/src/utils/trees';
import { PassportData } from '../../../../common/src/utils/types';
import { ProofStatusEnum } from '../../stores/proofProvider';
import { sendPayload } from './tee';

async function generateTeeInputsRegister(
  secret: string,
  passportData: PassportData,
) {
  const serialized_dsc_tree = await getDSCTree();
  const inputs = generateCircuitInputsRegister(
    secret,
    passportData,
    serialized_dsc_tree,
  );
  const circuitName = getCircuitNameFromPassportData(passportData, 'register');
  if (circuitName == null) {
    throw new Error('Circuit name is null');
  }
  return { inputs, circuitName };
}

export function checkPassportSupported(passportData: PassportData) {
  const passportMetadata = passportData.passportMetadata;
  if (!passportMetadata) {
    console.log('Passport metadata is null');
    return false;
  }
  if (!passportMetadata.cscaFound) {
    console.log('CSCA not found');
    return false;
  }
  const circuitNameRegister = getCircuitNameFromPassportData(
    passportData,
    'register',
  );
  if (
    !circuitNameRegister ||
    !DEPLOYED_CIRCUITS_REGISTER.includes(circuitNameRegister)
  ) {
    console.log('Circuit not supported:', circuitNameRegister);
    return false;
  }
  const circuitNameDsc = getCircuitNameFromPassportData(passportData, 'dsc');
  if (!circuitNameDsc || !DEPLOYED_CIRCUITS_DSC.includes(circuitNameDsc)) {
    console.log('DSC circuit not supported:', circuitNameDsc);
    return false;
  }
  return true;
}

export async function sendRegisterPayload(
  passportData: PassportData,
  secret: string,
) {
  const { inputs, circuitName } = await generateTeeInputsRegister(
    secret,
    passportData,
  );
  console.log('WS_RPC_URL_REGISTER', WS_RPC_URL_REGISTER);
  await sendPayload(
    inputs,
    'register',
    circuitName,
    'https',
    'https://self.xyz',
    WS_RPC_URL_REGISTER,
  );
}

async function generateTeeInputsDsc(passportData: PassportData) {
  const serialized_csca_tree = await getCSCATree();
  const inputs = generateCircuitInputsDSC(
    passportData.dsc,
    serialized_csca_tree,
  );
  const circuitName = getCircuitNameFromPassportData(passportData, 'dsc');
  if (circuitName == null) {
    throw new Error('Circuit name is null');
  }
  return { inputs, circuitName };
}

async function checkIdPassportDscIsInTree(
  passportData: PassportData,
): Promise<boolean> {
  const dscTree = await getDSCTree();
  const hashFunction = (a: any, b: any) => poseidon2([a, b]);
  const tree = LeanIMT.import(hashFunction, dscTree);
  const leaf = getLeafDscTree(
    passportData.dsc_parsed!,
    passportData.csca_parsed!,
  );
  console.log('DSC leaf:', leaf);
  const index = tree.indexOf(BigInt(leaf));
  if (index === -1) {
    console.log('DSC is not found in the tree, sending DSC payload');
    const dscStatus = await sendDscPayload(passportData);
    if (dscStatus !== ProofStatusEnum.SUCCESS) {
      console.log('DSC proof failed');
      return false;
    }
  } else {
    // console.log('DSC i found in the tree, sending DSC payload for debug');
    // const dscStatus = await sendDscPayload(passportData);
    // if (dscStatus !== ProofStatusEnum.SUCCESS) {
    //   console.log('DSC proof failed');
    //   return false;
    // }
    console.log('DSC is found in the tree, skipping DSC payload');
  }
  return true;
}

export async function sendDscPayload(
  passportData: PassportData,
): Promise<ProofStatusEnum | false> {
  if (!passportData) {
    return false;
  }
  const isSupported = checkPassportSupported(passportData);
  if (!isSupported) {
    console.log('Passport not supported');
    return false;
  }
  const { inputs, circuitName } = await generateTeeInputsDsc(passportData);
  console.log('circuitName', circuitName);
  const dscStatus = await sendPayload(
    inputs,
    'dsc',
    circuitName,
    'https',
    'https://self.xyz',
    WS_RPC_URL_DSC,
    undefined,
    { updateGlobalOnSuccess: false },
  );
  return dscStatus;
}

/*** DISCLOSURE ***/

async function getOfacSMTs() {
  // TODO: get the SMT from an endpoint
  const passportNoAndNationalitySMT = new SMT(poseidon2, true);
  passportNoAndNationalitySMT.import(passportNoAndNationalitySMTData);
  const nameAndDobSMT = new SMT(poseidon2, true);
  nameAndDobSMT.import(nameAndDobSMTData);
  const nameAndYobSMT = new SMT(poseidon2, true);
  nameAndYobSMT.import(nameAndYobSMTData);
  return { passportNoAndNationalitySMT, nameAndDobSMT, nameAndYobSMT };
}

async function generateTeeInputsVCAndDisclose(
  secret: string,
  passportData: PassportData,
  selfApp: SelfApp,
) {
  const {
    scope,
    userId,
    disclosures,
  } = selfApp;

  const selector_dg1 = Array(88).fill('0');

  Object.entries(disclosures).forEach(([attribute, reveal]) => {
    if (['ofac', 'excludedCountries', 'minimumAge'].includes(attribute)) {
      return;
    }
    if (reveal) {
      const [start, end] = attributeToPosition[attribute as keyof typeof attributeToPosition];
      selector_dg1.fill('1', start, end + 1);
    }
  });

  const majority = disclosures.minimumAge ? disclosures.minimumAge.toString() : DEFAULT_MAJORITY;
  const selector_older_than = disclosures.minimumAge ? '1' : '0';

  const selector_ofac = disclosures.ofac ? 1 : 0;

  const { passportNoAndNationalitySMT, nameAndDobSMT, nameAndYobSMT } =
    await getOfacSMTs();
  const serialized_tree = await getCommitmentTree();
  const tree = LeanIMT.import((a, b) => poseidon2([a, b]), serialized_tree);
  // const commitment = generateCommitment(secret, PASSPORT_ATTESTATION_ID, passportData);
  // tree.insert(BigInt(commitment)); // TODO: dont do that! for now we add the commitment as the whole flow is not yet implemented

  const inputs = generateCircuitInputsVCandDisclose(
    secret,
    PASSPORT_ATTESTATION_ID,
    passportData,
    scope,
    selector_dg1,
    selector_older_than,
    tree,
    majority,
    passportNoAndNationalitySMT,
    nameAndDobSMT,
    nameAndYobSMT,
    selector_ofac,
    disclosures.excludedCountries ?? [],
    userId,
  );
  return { inputs, circuitName: 'vc_and_disclose' };
}

export async function sendVcAndDisclosePayload(
  secret: string,
  passportData: PassportData | null,
  selfApp: SelfApp,
) {
  if (!passportData) {
    return null;
  }
  const { inputs, circuitName } = await generateTeeInputsVCAndDisclose(
    secret,
    passportData,
    selfApp,
  );
  return await sendPayload(
    inputs,
    'vc_and_disclose',
    circuitName,
    selfApp.endpointType,
    selfApp.endpoint,
    WS_RPC_URL_VC_AND_DISCLOSE,
  );
}

/*** Logic Flow ****/

export async function isUserRegistered(
  passportData: PassportData,
  secret: string,
) {
  const commitment = generateCommitment(
    secret,
    PASSPORT_ATTESTATION_ID,
    passportData,
  );
  const serializedTree = await getCommitmentTree();
  const tree = LeanIMT.import((a, b) => poseidon2([a, b]), serializedTree);
  const index = tree.indexOf(BigInt(commitment));
  return index !== -1;
}

export async function isPassportNullified(passportData: PassportData) {
  const nullifier = generateNullifier(passportData);
  console.log('nullifier', nullifier);
  // TODO: check if the nullifier is onchain
  return false;
}

export async function registerPassport(
  passportData: PassportData,
  secret: string,
) {
  const dscOk = await checkIdPassportDscIsInTree(passportData);
  if (!dscOk) {
    return;
  }
  await sendRegisterPayload(passportData, secret);
}
