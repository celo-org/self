import React from 'react';

import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from '@tamagui/lucide-icons';
import { Fieldset, Image, Text, YStack, useWindowDimensions } from 'tamagui';

import { attributeToPosition } from '../../../common/src/constants/constants';
import CustomButton from '../components/CustomButton';
import USER_PROFILE from '../images/user_profile.png';
import useUserStore from '../stores/userStore';
import { bgGreen, textBlack } from '../utils/colors';
import { formatAttribute, getFirstName, maskString } from '../utils/utils';
import { firePayload } from '../utils/tee';
import { generateCircuitInputsRegister } from '../../../common/src/utils/circuits/generateInputs';
import { initPassportDataParsing } from '../../../common/src/utils/passports/passport';
const NextScreen: React.FC = () => {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const handleNext = () => {
    setRegistered(true);
    navigation.navigate('Home');
  };
  const { passportData, setRegistered } = useUserStore();
  const dataHidden = false;

  const disclosureOptions: any = {
    gender: 'optional',
    nationality: 'optional',
    expiry_date: 'optional',
    date_of_birth: 'optional',
  };

  if (!passportData) {
    return null;
  }
  function generateInputs() {
    if (!passportData) {
      return null;
    }
    const parsedPassportData = initPassportDataParsing(passportData);
    const inputs = generateCircuitInputsRegister('0', parsedPassportData);
    return inputs;
  }

  return (
    <YStack f={1} px="$4">
      <YStack alignSelf="center" my="$3">
        {dataHidden ? (
          <Image
            w={height > 750 ? 150 : 100}
            h={height > 750 ? 190 : 80}
            borderRadius={height > 800 ? '$7' : '$6'}
            source={{
              uri: USER_PROFILE,
            }}
          />
        ) : (
          <Image
            w={height > 750 ? 190 : 130}
            h={height > 750 ? 190 : 130}
            borderRadius={height > 750 ? '$7' : '$6'}
            source={{
              uri:
                passportData?.mockUser || !passportData?.photoBase64
                  ? USER_PROFILE
                  : passportData?.photoBase64 ?? USER_PROFILE,
            }}
          />
        )}
      </YStack>
      <Text color={textBlack} fontSize="$9" mt="$8">
        Hi{' '}
        <Text
          color={textBlack}
          fontSize="$9"
          style={{
            textDecorationLine: 'underline',
            textDecorationColor: bgGreen,
          }}
        >
          {dataHidden
            ? maskString(getFirstName(passportData.mrz))
            : getFirstName(passportData.mrz)}
        </Text>
      </Text>

      <YStack gap="$2.5" mt="$6">
        {Object.keys(disclosureOptions).map(key => {
          const key_ = key;
          const indexes =
            attributeToPosition[key_ as keyof typeof attributeToPosition];
          if (!passportData?.mrz || !indexes) {
            return null;
          }

          const keyFormatted = key_
            .replace(/_/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          if (
            indexes[0] >= passportData.mrz.length ||
            indexes[1] >= passportData.mrz.length
          ) {
            console.warn(
              `Invalid indexes for key ${key_}: [${indexes[0]}, ${indexes[1]}]`,
            );
            return null;
          }

          const mrzAttribute = passportData.mrz.slice(
            indexes[0],
            indexes[1] + 1,
          );
          const mrzAttributeFormatted = formatAttribute(
            key_,
            mrzAttribute ?? '',
          );

          return (
            <Fieldset horizontal key={key} gap="$3" alignItems="center">
              <Text
                color={textBlack}
                w="$14"
                justifyContent="flex-end"
                fontSize="$6"
                style={{
                  opacity: 0.7,
                }}
              >
                {keyFormatted}:
              </Text>
              <Text color={textBlack} fontSize="$6">
                {dataHidden
                  ? maskString(mrzAttributeFormatted)
                  : mrzAttributeFormatted}
              </Text>
            </Fieldset>
          );
        })}
      </YStack>

      <YStack f={1} />

      <YStack f={1} />
      <CustomButton
        onPress={async () => await firePayload(generateInputs())}
        text="Next"
        Icon={<ArrowRight color={textBlack} />}
      />

      <CustomButton
        onPress={handleNext}
        text="Next"
        Icon={<ArrowRight color={textBlack} />}
      />
    </YStack>
  );
};

export default NextScreen;
