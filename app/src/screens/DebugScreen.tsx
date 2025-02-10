import React from 'react';
import { ScrollView } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Button, Stack, YStack } from 'tamagui';

import { RootStackParamList } from '../Navigation';

const DebugScreen = () => {
  const navigation = useNavigation();

  // Get all screen names from the navigation type
  const screens: (keyof RootStackParamList)[] = [
    'Debug',
    'Splash',
    'Launch',
    'Start',
    'PassportOnboarding',
    'PassportCamera',
    'PassportNFCScan',
    'ConfirmBelongingScreen',
    'CreateMock',
    'NextScreen',
    'Home',
    'Disclaimer',
    'QRCodeViewFinder',
    'ProveScreen',
    'ValidProofScreen',
    'WrongProofScreen',
    'Settings',
    'AccountRecovery',
    'SaveRecoveryPhrase',
    'RecoverWithPhrase',
    'AccountVerifiedSuccess',
    'ShowRecoveryPhrase',
  ];

  return (
    <ScrollView>
      <Stack padding={16}>
        <YStack space={8}>
          {screens.sort().map(screen => (
            <Button
              key={screen}
              onPress={() => navigation.navigate(screen)}
              size="$4"
            >
              {screen}
            </Button>
          ))}
        </YStack>
      </Stack>
    </ScrollView>
  );
};

export default DebugScreen;
