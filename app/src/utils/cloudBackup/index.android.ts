import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

import { loadSecret, restoreFromPrivateKey } from '../keychain';

// Note: also defined in app/android/app/src/main/res/xml/backup_rules.xml
const ENCRYPTED_FILE_PATH =
  RNFS.DocumentDirectoryPath + '/encrypted-private-key';

export default function useBackupPrivateKey() {
  return {
    upload: backupWithAndroidBackup,
    download: downloadFromAndroidBackup,
    disableBackup: disableBackupToAndroidBackup,
  };
}

async function backupWithAndroidBackup() {
  const privateKey = await loadSecret();
  if (!privateKey) {
    throw new Error(
      'Private key not set yet. Did the user see the recovery phrase?',
    );
  }

  const { BackupModule } = NativeModules;
  await RNFS.write(ENCRYPTED_FILE_PATH, privateKey);
  await BackupModule.backupNow();
}

async function downloadFromAndroidBackup() {
  const { BackupModule } = NativeModules;
  await BackupModule.restoreNow();
  const privateKey = await RNFS.readFile(ENCRYPTED_FILE_PATH);

  await restoreFromPrivateKey(privateKey);
  return privateKey;
}

async function disableBackupToAndroidBackup() {
  const { BackupModule } = NativeModules;
  await RNFS.unlink(ENCRYPTED_FILE_PATH);
  await BackupModule.backupNow();
}
