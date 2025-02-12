import React from 'react';
import { Platform } from 'react-native';

import { Separator, Text, View, XStack, YStack } from 'tamagui';

import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { Caption } from '../../components/typography/Caption';
import Description from '../../components/typography/Description';
import { Title } from '../../components/typography/Title';
import useHapticNavigation from '../../hooks/useHapticNavigation';
import Keyboard from '../../images/icons/keyboard.svg';
import RestoreAccountSvg from '../../images/icons/restore_account.svg';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { slate500, slate600, white } from '../../utils/colors';

interface AccountRecoveryChoiceScreenProps {}

const storage = Platform.OS === 'ios' ? 'iCloud' : 'Android Backup';

const AccountRecoveryChoiceScreen: React.FC<
  AccountRecoveryChoiceScreenProps
> = ({}) => {
  const onRestoreFromCloudPress = useHapticNavigation('RecoverWithCloud');
  const onEnterRecoveryPress = useHapticNavigation('SaveRecoveryPhrase');

  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <View borderColor={slate600} borderWidth="$1" borderRadius="$10" p="$5">
          <RestoreAccountSvg height={80} width={80} color={white} />
        </View>
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection>
        <YStack alignItems="center" gap="$2.5" pb="$2.5">
          <Title>Restore your Self account</Title>
          <Description>
            By continuing, you certify that this passport belongs to you and is
            not stolen or forged.
          </Description>

          <YStack gap="$2.5" width="100%" pt="$6">
            <PrimaryButton onPress={onRestoreFromCloudPress}>
              Restore from {storage}
            </PrimaryButton>
            <XStack gap={64} ai="center" justifyContent="space-between">
              <Separator flexGrow={1} />
              <Caption>OR</Caption>
              <Separator flexGrow={1} />
            </XStack>
            <SecondaryButton onPress={onEnterRecoveryPress}>
              <XStack alignItems="center" justifyContent="center">
                <Keyboard height={25} width={40} color={slate500} />
                <View pl={12}>
                  <Description>Enter recovery phrase</Description>
                </View>
              </XStack>
            </SecondaryButton>
          </YStack>
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default AccountRecoveryChoiceScreen;
