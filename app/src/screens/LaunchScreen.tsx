import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Image, YStack } from 'tamagui';

import Logo from '../images/logo.png';
import {
  BottomSection,
  ExpandableBottomLayout,
  TopSection,
} from '../components/ExpandableBottomLayout';
import { PrimaryButton } from '../components/buttons/PrimaryButton';
import { slate50, slate100, slate700, slate500 } from '../utils/colors';
import useNavigationStore from '../stores/navigationStore';

interface LaunchScreenProps {}

const LaunchScreen: React.FC<LaunchScreenProps> = ({}) => {
  const { setSelectedTab } = useNavigationStore();

  return (
    <ExpandableBottomLayout>
      <TopSection>
        <Image src={Logo} />
      </TopSection>
      <BottomSection>
        <YStack gap="$2.5">
          <Text style={styles.subheader}>
            The simplest way to verify identity for safety and trust wherever
            you are.
          </Text>
          {/* TODO add linking */}
          <Text style={styles.notice}>
            By continuing, you agree to the&nbsp;
            <Text style={styles.link}>User Terms and Conditions</Text>&nbsp;and
            acknowledge the&nbsp;
            <Text style={styles.link}>Privacy notice</Text>&nbsp;of Self ID
            provided by Self Inc.
          </Text>
          <PrimaryButton onPress={() => setSelectedTab('app')}>
            Get Started
          </PrimaryButton>
        </YStack>
      </BottomSection>
    </ExpandableBottomLayout>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  subheader: {
    color: slate700,
    // fontWeight: '500',
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
  },
});
