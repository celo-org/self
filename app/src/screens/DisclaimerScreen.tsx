import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { Text, YStack } from 'tamagui';

import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { ExpandableBottomLayout } from '../layouts/ExpandableBottomLayout';
import { useSettingStore } from '../stores/settingStore';
import { slate700, white } from '../utils/colors';
import { confirmTap, notificationWarning } from '../utils/haptic';
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
          source={require('../assets/animations/warning.json')}
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
          <Text style={styles.disclaimer}>
            Apps that request sensitive or personally identifiable information
            (like passwords, Social Security numbers, or financial details)
            should be trusted only if they're secure and necessary.
          </Text>
          <Text style={{ ...styles.disclaimer, marginTop: 10 }}>
            Always verify an app's legitimacy before sharing your data.
          </Text>
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
    color: white,
    fontFamily: dinot,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  disclaimer: {
    color: slate700,
    fontFamily: dinot,
    fontSize: 18,
    fontWeight: '500',
  },
});
