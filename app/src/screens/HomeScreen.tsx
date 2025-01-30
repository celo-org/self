import React from 'react';

import { Image, styled, View, YStack } from 'tamagui';

import MAP from '../images/map.png';
import ScanIcon from '../images/icons/qr-scan.svg';

import { black, gold, neutral700 } from '../utils/colors';
import { Caption } from '../components/typography/Caption';

const ScanButton = styled(View, {
  borderRadius: 20,
  width: 90,
  height: 90,
  borderColor: neutral700,
  borderWidth: 1,
  backgroundColor: '#1D1D1D', // TODO: if this is an unnamed (possibly one time used) color, do we just keep it here?
  alignItems: 'center',
  justifyContent: 'center',
});

const HomeScreen: React.FC = () => {
  return (
    <YStack f={1} px="$4" bg={black}>
      <YStack f={1} mt="$6" mb="$10" gap="$0" ai="center" jc="space-between">
        <View ai="center" gap="$4">
          <Image src={MAP} />
          <Caption color={gold} opacity={0.3} textTransform="uppercase">
            Only visible to you
          </Caption>
        </View>
        <View ai="center" gap="$3.5">
          <ScanButton>
            <ScanIcon fill={gold} />
          </ScanButton>
          <Caption color={gold} textTransform="uppercase">
            Prove your SELF ID
          </Caption>
        </View>
      </YStack>
    </YStack>
  );
};

export default HomeScreen;
