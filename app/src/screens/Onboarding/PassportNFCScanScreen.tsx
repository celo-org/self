import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import {
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import { H2, Image, Sheet, Spinner, View, XStack, YStack } from 'tamagui';

import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { slate400, slate500, black } from '../../utils/colors';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { useNavigation } from '@react-navigation/native';
import useUserStore from '../../stores/userStore';
import NfcManager from 'react-native-nfc-manager';
import { scan } from '../../utils/nfcScannerNew';
import NFC_IMAGE from '../../images/nfc.png';

interface PassportNFCScanScreenProps {}

const emitter =
  Platform.OS === 'android'
    ? new NativeEventEmitter(NativeModules.nativeModule)
    : null;

const PassportNFCScanScreen: React.FC<PassportNFCScanScreenProps> = ({}) => {
  const navigation = useNavigation();
  let { passportNumber, dateOfBirth, dateOfExpiry } = useUserStore();
  const [dialogMessage, setDialogMessage] = useState('');
  const [isNfcSupported, setIsNfcSupported] = useState(true);
  const [isNfcEnabled, setIsNfcEnabled] = useState(true);
  const [isNfcSheetOpen, setIsNfcSheetOpen] = useState(false);
  const [scanningMessage, setScanningMessage] = useState('');

  const checkNfcSupport = useCallback(async () => {
    const isSupported = await NfcManager.isSupported();
    if (isSupported) {
      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        setDialogMessage(
          'NFC is not enabled. Would you like to enable it in settings?',
        );
        setIsNfcEnabled(false);
      }
      setIsNfcSupported(true);
    } else {
      setDialogMessage(
        "Sorry, your device doesn't seem to have an NFC reader.",
      );
      setIsNfcSupported(false);
    }
  }, []);

  const onPress = useCallback(async () => {
    if (isNfcEnabled) {
      try {
        setIsNfcSheetOpen(true);
        await scan({ passportNumber, dateOfBirth, dateOfExpiry });
        // Feels better somehow
        await new Promise(resolve => setTimeout(resolve, 1000));
        navigation.navigate('NextScreen');
      } catch (e) {
        console.log(e);
      } finally {
        setIsNfcSheetOpen(false);
      }
    } else if (isNfcSupported) {
      if (Platform.OS === 'ios') {
        Linking.openURL('App-Prefs:root=General&path=About');
      } else {
        Linking.sendIntent('android.settings.NFC_SETTINGS');
      }
    }
  }, [isNfcSupported, isNfcEnabled, passportNumber, dateOfBirth, dateOfExpiry]);

  const cancelScanIfRunning = useCallback(async () => {
    // // TODO: cancel if scanning
    // setIsNfcSheetOpen(false);
  }, [isNfcSheetOpen]);

  useEffect(() => {
    checkNfcSupport();

    if (Platform.OS === 'android' && emitter) {
      const subscription = emitter.addListener(
        'NativeEvent',
        (event: string) => {
          console.log(event);
          setScanningMessage(event);
        },
      );

      return () => {
        subscription.remove();
      };
    }
  }, [checkNfcSupport]);

  console.log('text?', scanningMessage);

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <View height={400} bg={black}></View>
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <YStack alignItems="center" gap="$2.5">
          {isNfcSheetOpen ? (
            <>
              <YStack alignItems="center" gap="$5" pb="$2.5">
                <Text style={styles.title}>Ready to scan</Text>
                <Text style={styles.description}>{scanningMessage}</Text>
              </YStack>

              <Image
                h="$8"
                w="$8"
                alignSelf="center"
                borderRadius={1000}
                source={{
                  uri: NFC_IMAGE,
                }}
              />
              <Text>
                Hold your device near the NFC tag and stop moving when it
                vibrates.
              </Text>
            </>
          ) : (
            <>
              <YStack alignItems="center" gap="$5" pb="$2.5">
                <Text style={styles.title}>Verify your passport</Text>
                <Text style={styles.description}>
                  {isNfcEnabled
                    ? 'Open your passport to the last page to access the NFC chip. Place your phone against the page'
                    : dialogMessage}
                </Text>
              </YStack>
              <PrimaryButton onPress={onPress} disabled={!isNfcSupported}>
                {isNfcEnabled || !isNfcSupported
                  ? 'Start Scan'
                  : 'Open settings'}
              </PrimaryButton>
              <SecondaryButton onPress={() => navigation.navigate('Home')}>
                Cancel
              </SecondaryButton>
            </>
          )}
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default PassportNFCScanScreen;

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
    textAlign: 'center',
  },
});
