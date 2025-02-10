import React from 'react';
import { StyleSheet } from 'react-native';

import { Anchor, Text, YStack } from 'tamagui';

import { PrimaryButton } from '../components/buttons/PrimaryButton';
import useHapticNavigation from '../hooks/useHapticNavigation';
import GetStartedCard from '../images/get-started-card.svg';
import Logo from '../images/logo.svg';
import { ExpandableBottomLayout } from '../layouts/ExpandableBottomLayout';
import { slate50, slate100, slate500, slate700 } from '../utils/colors';

const LaunchScreen: React.FC = () => {
  const onStartPress = useHapticNavigation('Start');

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <GetStartedCard />
        <Logo />
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <YStack gap="$2.5">
          <Text style={styles.subheader}>
            The simplest way to verify identity for safety and trust wherever
            you are.
          </Text>
          {/* TODO add linking */}
          <Text style={styles.notice}>
            By continuing, you agree to the&nbsp;
            <Anchor style={styles.link} href="https://example.com">
              User Terms and Conditions
            </Anchor>
            &nbsp;and acknowledge the&nbsp;
            <Anchor style={styles.link} href="https://example.com">
              Privacy notice
            </Anchor>
            &nbsp;of Self provided by Self Inc.
          </Text>
          <PrimaryButton onPress={onStartPress}>Get Started</PrimaryButton>
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default LaunchScreen;

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
