import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'tamagui';

import Passport from '../../images/passport.png';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { slate400, slate500, black } from '../../utils/colors';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { useNavigation } from '@react-navigation/native';

interface PassportOnboardingScreenProps {}

const PassportOnboardingScreen: React.FC<
  PassportOnboardingScreenProps
> = ({}) => {
  const navigation = useNavigation();

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <Image
          resizeMethod="auto"
          source={{ uri: Passport }}
          style={{
            width: '90%',
            height: '90%',
            aspectRatio: 0.69,
          }}
        />
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <View style={styles.textsContainer}>
          <Text style={styles.title}>Scan your passport</Text>
          <Text style={styles.description}>
            Open your passport to the first page to scan it.
          </Text>
          <Text style={styles.additional}>
            Self ID will not capture an image of your passport. Our system is
            only reading the fields.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <PrimaryButton onPress={() => navigation.navigate('PassportCamera')}>
            Open Camera
          </PrimaryButton>
          <SecondaryButton onPress={() => navigation.navigate('Home')}>
            Cancel
          </SecondaryButton>
        </View>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default PassportOnboardingScreen;

const styles = StyleSheet.create({
  textsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 35,
    color: black,
  },
  description: {
    textAlignVertical: 'center',
    color: slate500,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 23,
    textAlign: 'center',
  },
  additional: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    color: slate400,
    marginTop: 10,
  },
});
