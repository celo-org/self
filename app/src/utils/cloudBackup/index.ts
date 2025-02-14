import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  CloudStorage,
  CloudStorageProvider,
  CloudStorageScope,
} from 'react-native-cloud-storage';

import { name } from '../../../package.json';
import { googleSignIn } from './google';

const ENCRYPTED_FILE_PATH = `/${name}/encrypted-private-key`;
CloudStorage.setProviderOptions({ scope: CloudStorageScope.AppData });

export const STORAGE_NAME = Platform.OS === 'ios' ? 'iCloud' : 'Google Drive';

export function useBackupPrivateKey() {
  return useMemo(
    () => ({
      upload,
      download,
      disableBackup,
    }),
    [],
  );
}

async function addAccessTokenForGoogleDrive() {
  if (CloudStorage.getProvider() === CloudStorageProvider.GoogleDrive) {
    const response = await googleSignIn();
    if (!response) {
      // user canceled
      return;
    }
    CloudStorage.setProviderOptions({
      accessToken: response.accessToken,
    });
  }
}

async function upload(privateKey: string) {
  if (!privateKey) {
    throw new Error(
      'Private key not set yet. Did the user see the recovery phrase?',
    );
  }

  await addAccessTokenForGoogleDrive();
  await CloudStorage.mkdir(`/${name}`);
  await CloudStorage.writeFile(ENCRYPTED_FILE_PATH, privateKey);
}

async function download() {
  await addAccessTokenForGoogleDrive();
  console.log(await CloudStorage.exists(ENCRYPTED_FILE_PATH));
  const privateKey = await CloudStorage.readFile(ENCRYPTED_FILE_PATH);
  return privateKey;
}

async function disableBackup() {
  await addAccessTokenForGoogleDrive();
  await CloudStorage.unlink(ENCRYPTED_FILE_PATH);
}
