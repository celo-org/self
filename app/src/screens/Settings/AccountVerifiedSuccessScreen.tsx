import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Image } from 'tamagui';

import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import Description from '../../components/typography/Description';
import { Title } from '../../components/typography/Title';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';

const AccountVerifiedSuccessScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <></>
        {/* TODO: Animation goes here */}
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <View style={styles.content}>
          <Title size="large">ID Verified</Title>
          <Description>
            Your passport information is now protected by Self ID. Just scan a
            participating partner's QR code to prove your identity.
          </Description>
        </View>
        <PrimaryButton
          onPress={() => {
            navigation.navigate('Home');
          }}
        >
          Continue
        </PrimaryButton>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default AccountVerifiedSuccessScreen;

export const styles = StyleSheet.create({
  content: {
    paddingTop: 40,
    paddingHorizontal: 10,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
});
