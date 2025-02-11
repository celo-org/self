import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { Text, YStack } from 'tamagui';

import warningAnimation from '../assets/animations/warning.json';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { ExpandableBottomLayout } from '../layouts/ExpandableBottomLayout';
import { useSettingStore } from '../stores/settingStore';
import { white } from '../utils/colors';
import { confirmTap, notificationWarning } from '../utils/haptic';
import { BodyText } from '../components/typography/BodyText';
import Caution from '../components/typography/Caution';
import { dinot } from '../utils/fonts';

const DisclaimerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { dismissPrivacyNote } = useSettingStore();

  useEffect(() => {
    notificationWarning();
  }, []);

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <LottieView
          autoPlay
          loop={false}
          source={warningAnimation}
          style={styles.animation}
          cacheComposition={true}
          renderMode="HARDWARE"
        />
        <YStack f={1} jc="flex-end" pb="$4">
          <Text style={styles.subheader}>Caution</Text>
        </YStack>
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <YStack gap="$2.5">
          <Caution>
            Apps that request sensitive or personally identifiable information
            (like passwords, Social Security numbers, or financial details)
            should be trusted only if they're secure and necessary.
          </Caution>
          <Caution style={{ marginTop: 10 }}>
            Always verify an app's legitimacy before sharing your data.
          </Caution>
          <PrimaryButton
            style={{ marginVertical: 30 }}
            onPress={() => {
              confirmTap();
              dismissPrivacyNote();
              navigation.navigate('Home');
            }}
          >
            Dismiss
          </PrimaryButton>
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default DisclaimerScreen;

const styles = StyleSheet.create({
  animation: {
    position: 'absolute',
    width: '125%',
    height: '125%',
  },
  subheader: {
    fontFamily: dinot,
    color: white,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
