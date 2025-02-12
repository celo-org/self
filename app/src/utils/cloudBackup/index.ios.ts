import { CloudStorage, CloudStorageScope } from 'react-native-cloud-storage';
import RNFS from 'react-native-fs';

import { loadSecret, restoreFromPrivateKey } from '../keychain';

// Note: also defined in app/android/app/src/main/res/xml/backup_rules.xml
const ENCRYPTED_FILE_PATH =
  RNFS.DocumentDirectoryPath + '/encrypted-private-key';

export const STORAGE_NAME = 'iCloud Backup';

export function useBackupPrivateKey() {
  return {
    upload: backupWithICloud,
    download: downloadFromICloud,
    disableBackup: disableBackupToICloud,
  };
}

async function backupWithICloud() {
  const privateKey = await loadSecret();
  if (!privateKey) {
    throw new Error(
      'Private key not set yet. Did the user see the recovery phrase?',
    );
  }

  await CloudStorage.writeFile(
    ENCRYPTED_FILE_PATH,
    privateKey,
    CloudStorageScope.AppData,
  );
}
async function downloadFromICloud() {
  const privateKey = await CloudStorage.readFile(
    ENCRYPTED_FILE_PATH,
    CloudStorageScope.AppData,
  );
  await restoreFromPrivateKey(privateKey);
  return privateKey;
}

async function disableBackupToICloud() {
  await CloudStorage.unlink(ENCRYPTED_FILE_PATH, CloudStorageScope.AppData);
}
