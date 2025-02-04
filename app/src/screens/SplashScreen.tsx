import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Anchor, Image, Spinner, Text, YStack, View } from 'tamagui';

import { PrimaryButton } from '../components/buttons/PrimaryButton';
import Logo from '../images/logo.svg';
import { ExpandableBottomLayout } from '../layouts/ExpandableBottomLayout';
import {
  slate50,
  slate100,
  slate500,
  slate700,
  amber500,
} from '../utils/colors';
import useUserStore from '../stores/userStore';

interface SplashScreenProps {}

const SplashScreen: React.FC<SplashScreenProps> = ({}) => {
  const navigation = useNavigation();
  const { userLoaded, passportData } = useUserStore();

  useEffect(() => {
    if (userLoaded) {
      if (passportData && passportData.dg2Hash) {
        navigation.navigate('Home');
      } else {
        navigation.navigate('Launch');
      }
    }
  }, [userLoaded]);

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <Image
          source={require('../images/texture.png')}
          style={{
            opacity: 0.1,
            position: 'absolute',
          }}
        />
        <Logo />
        <Spinner width={80} height={80} color={amber500} />
      </ExpandableBottomLayout.TopSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  subheader: {
    color: slate700,
    fontWeight: '500',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  link: {
    textDecorationLine: 'underline',
  },
  notice: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: slate50,
    borderColor: slate100,
    borderWidth: 1,
    borderStyle: 'solid',
    color: slate500,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
});
