import { useMemo } from 'react';
import { CloudStorage, CloudStorageScope } from 'react-native-cloud-storage';
import RNFS from 'react-native-fs';

// Note: also defined in app/android/app/src/main/res/xml/backup_rules.xml
const ENCRYPTED_FILE_PATH =
  RNFS.DocumentDirectoryPath + '/encrypted-private-key';

export const STORAGE_NAME = 'iCloud Backup';

export function useBackupPrivateKey() {
  return useMemo(
    () => ({
      upload: (privateKey: string) => backupWithICloud(privateKey),
      download: () => downloadFromICloud(),
      disableBackup: () => disableBackupToICloud,
    }),
    [],
  );
}

async function backupWithICloud(privateKey: string) {
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
  return privateKey;
}

async function disableBackupToICloud() {
  await CloudStorage.unlink(ENCRYPTED_FILE_PATH, CloudStorageScope.AppData);
}
