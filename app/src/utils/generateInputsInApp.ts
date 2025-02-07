import { getCircuitNameFromPassportData } from '../../../common/src/utils/circuits/circuitsName';
import { generateCircuitInputsRegister } from '../../../common/src/utils/circuits/generateInputs';
import { PassportData } from '../../../common/src/utils/types';

export function generateTeeInputsRegister(
  secret: string,
  passportData: PassportData,
) {
  const inputs = generateCircuitInputsRegister(secret, passportData);
  const circuitName = getCircuitNameFromPassportData(passportData, 'register');
  if (circuitName == null) {
    throw new Error('Circuit name is null');
  }
  return { inputs, circuitName };
}
