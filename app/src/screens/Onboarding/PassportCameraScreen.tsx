import React, { useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Image, View, XStack, YStack } from 'tamagui';

import Bulb from '../../images/icons/passport_camera_bulb.svg';
import Scan from '../../images/icons/passport_camera_scan.svg';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { slate400, slate500, black } from '../../utils/colors';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { useNavigation } from '@react-navigation/native';
import { startCameraScan } from '../../utils/cameraScanner';
import useUserStore from '../../stores/userStore';

interface PassportNFCScanScreen {}

const PassportCameraScreen: React.FC<PassportNFCScanScreen> = ({}) => {
  const navigation = useNavigation();
  const store = useUserStore();

  useEffect(() => {
    const cancelCamera = startCameraScan((error, result) => {
      if (error) {
        // handle error
        console.error(error);
      } else {
        const { passportNumber, dateOfBirth, dateOfExpiry } = result!;
        store.update({ passportNumber, dateOfBirth, dateOfExpiry });
        navigation.navigate('PassportNFCScan');
      }
    });

    return cancelCamera;
  }, []);

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <View height={400} bg={black}></View>
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <YStack alignItems="center" gap="$2.5">
          <YStack alignItems="center" gap="$5" pb="$2.5">
            <Text style={styles.title}>Scan your passport</Text>
            <XStack gap="$6" alignSelf="flex-start">
              <View>
                <Scan height={40} width={40} />
              </View>
              <View
                alignItems="flex-start"
                justifyContent="flex-start"
                maxWidth="70%"
              >
                <Text style={styles.subheader}>
                  Open to the photograph page
                </Text>
                <Text style={styles.description}>
                  Position all four corners of the first passport page clearly
                  in the frame.
                </Text>
              </View>
            </XStack>
            <XStack gap="$6" alignSelf="flex-start">
              <View>
                <Bulb height={40} width={40} />
              </View>
              <View
                alignItems="flex-start"
                justifyContent="flex-start"
                maxWidth="70%"
              >
                <Text style={styles.subheader}>
                  Avoid dim lighting or glare{' '}
                </Text>
                <Text style={styles.description}>
                  Ensure that the text and photo are clearly readable and well
                  lit.
                </Text>
              </View>
            </XStack>
          </YStack>

          <SecondaryButton onPress={() => navigation.navigate('Home')}>
            Cancel
          </SecondaryButton>
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default PassportCameraScreen;

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 35,
    color: black,
  },
  subheader: {
    textAlignVertical: 'center',
    color: slate500,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 23,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    color: slate400,
  },
});
