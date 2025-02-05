import React, { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import { ExpandableBottomLayout } from '../layouts/ExpandableBottomLayout';
import useUserStore from '../stores/userStore';

interface SplashScreenProps {}

const SplashScreen: React.FC<SplashScreenProps> = ({}) => {
  const navigation = useNavigation();
  const { userLoaded, passportData } = useUserStore();

  useEffect(() => {
    if (userLoaded) {
      if (passportData) {
        navigation.navigate('Home');
      } else {
        navigation.navigate('Launch');
      }
    }
  }, [userLoaded]);

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <LottieView
          source={require('../assets/lottie/splash_screen.json')}
          autoPlay
          loop
          style={{
            width: '110%',
            height: '110%',
          }}
        />
      </ExpandableBottomLayout.TopSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default SplashScreen;
