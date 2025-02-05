import React, { useCallback, useEffect, useState } from 'react';
import { findBestLanguageTag } from 'react-native-localize';

import { useNavigation } from '@react-navigation/native';
import { ethers } from 'ethers';
import { YStack } from 'tamagui';

import Mnemonic from '../../components/Mnemonic';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { Caption } from '../../components/typography/Caption';
import Description from '../../components/typography/Description';
import { Title } from '../../components/typography/Title';
import useHapticNavigation from '../../hooks/useHapticNavigation';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { slate400 } from '../../utils/colors';
import { loadSecretOrCreateIt } from '../../utils/keychain';

interface ShowRecoveryPhraseScreenProps {}

const ShowRecoveryPhraseScreen: React.FC<
  ShowRecoveryPhraseScreenProps
> = ({}) => {
  const navigation = useNavigation();
  const [mnemonic, setMnemonic] = useState<string[]>();
  const [userHasSeenMnemonic, setUserHasSeenMnemonic] = useState(false);

  const onRevealWords = useCallback(() => {
    setUserHasSeenMnemonic(true);
  }, []);

  const loadPassword = useCallback(async () => {
    const privKey = await loadSecretOrCreateIt();

    const { languageTag } = findBestLanguageTag(
      Object.keys(ethers.wordlists),
    ) || { languageTag: 'en' };

    const words = ethers.Mnemonic.entropyToPhrase(
      privKey,
      ethers.wordlists[languageTag],
    );

    setMnemonic(words.trim().split(' '));
  }, []);

  useEffect(() => {
    loadPassword();
  }, []);

  const onCloudBackupPress = useHapticNavigation('TODO: cloud backup');
  const onSkipPress = useHapticNavigation('AccountVerifiedSuccess');

  return (src/Navigation.tsx
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.BottomSection>
        <YStack
          alignItems="center"
          gap="$2.5"
          pb="$2.5"
          height="100%"
          justifyContent="flex-end"
        >
          <Title>Save your recovery phrase</Title>
          <Description>
            This phrase is the only way to recover your account. Keep it secret,
            keep it safe.
          </Description>
          <Mnemonic words={mnemonic} onRevealWords={onRevealWords} />
          <YStack gap="$2.5" width="100%" pt="$6" alignItems="center">
            <Caption color={slate400}>
              You can reveal your recovery phrase in settings.
            </Caption>
            <PrimaryButton onPress={onCloudBackupPress}>
              Enable iCloud Back up
            </PrimaryButton>
            <SecondaryButton onPress={onSkipPress}>
              {userHasSeenMnemonic ? 'Continue' : 'Skip making a back up'}
            </SecondaryButton>
          </YStack>
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default ShowRecoveryPhraseScreen;
