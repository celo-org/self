import React, { useCallback, useContext } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import { Anchor, YStack } from 'tamagui';

import { RootStackParamList } from '../../Navigation';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { SecondaryButton } from '../../components/buttons/SecondaryButton';
import { Caption } from '../../components/typography/Caption';
import Description from '../../components/typography/Description';
import { Title } from '../../components/typography/Title';
import Cloud from '../../images/icons/logo_cloud_backup.svg';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { AuthContext } from '../../stores/authProvider';
import { useSettingStore } from '../../stores/settingStore';
import { type UseBackupPrivateKey } from '../../utils/cloudBackup';
// @ts-expect-error - there's cloudBackup/index.ios.ts and cloudBackup/index.android.ts
import useBackupPrivateKey from '../../utils/cloudBackup/index';
import { black, slate400, white } from '../../utils/colors';

interface CloudBackupScreenProps
  extends StaticScreenProps<
    | {
        nextScreen: keyof RootStackParamList;
      }
    | undefined
  > {}

const DocumentationLink: React.FC = ({}) => {
  if (Platform.OS === 'ios') {
    <Anchor
      style={styles.anchor}
      unstyled
      href="https://support.apple.com/en-us/102651"
    >
      iCloud data
    </Anchor>;
  }
  return (
    <Anchor
      style={styles.anchor}
      unstyled
      href="https://developer.android.com/identity/data/autobackup"
    >
      Android Backup
    </Anchor>
  );
};

const CloudBackupScreen: React.FC<CloudBackupScreenProps> = ({
  route: { params },
}) => {
  const navigation = useNavigation();
  const { loginWithBiometrics } = useContext(AuthContext);
  const { cloudBackupEnabled, toggleCloudBackupEnabled } = useSettingStore();
  const { upload, disableBackup } = (
    useBackupPrivateKey as UseBackupPrivateKey
  )();

  const toggleBackup = useCallback(async () => {
    await loginWithBiometrics();
    if (cloudBackupEnabled) {
      await disableBackup();
    } else {
      await upload();
    }
    toggleCloudBackupEnabled();
  }, [cloudBackupEnabled, upload, loginWithBiometrics]);

  const storage = Platform.OS === 'ios' ? 'iCloud' : 'Android Backup';
  return (
    <ExpandableBottomLayout.Layout>
      <ExpandableBottomLayout.TopSection>
        <Cloud height={200} width={140} color={white} />
      </ExpandableBottomLayout.TopSection>
      <ExpandableBottomLayout.BottomSection flexGrow={1}>
        <YStack alignItems="center" gap="$2.5" pb="$2.5">
          <Title>
            {cloudBackupEnabled ? `${storage} is enabled` : `Enable ${storage}`}
          </Title>
          <Description>
            {cloudBackupEnabled
              ? `Your account is being end-to-end encrypted backed up to ${storage} so you can easily restore it if you ever get a new phone.`
              : `Your account will be end-to-end encrypted backed up to ${storage} so you can easily restore it if you ever get a new phone.`}
          </Description>
          <Caption>
            Learn more about <DocumentationLink />
          </Caption>

          <YStack gap="$2.5" width="100%" pt="$6">
            {cloudBackupEnabled ? (
              <SecondaryButton onPress={toggleBackup}>
                Disable {storage} back up
              </SecondaryButton>
            ) : (
              <PrimaryButton onPress={toggleBackup}>
                Enable {storage} back up
              </PrimaryButton>
            )}

            {params?.nextScreen && (
              <PrimaryButton
                onPress={() => navigation.navigate(params.nextScreen)}
              >
                Continue
              </PrimaryButton>
            )}
          </YStack>
        </YStack>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

const styles = StyleSheet.create({
  layout: {
    backgroundColor: black,
    height: '100%',
    paddingTop: '40%',
  },
  anchor: {
    fontSize: 15,
    fontFamily: 'DINOT-Medium',
    textDecorationLine: 'underline',
    borderBottomColor: slate400,
    borderBottomWidth: 0.5,
  },
  button: {
    width: '100%',
  },
});

export default CloudBackupScreen;
