export type UseBackupPrivateKey = () => {
  upload: (privateKey: string) => Promise<void>;
  download: () => Promise<string>;
  disableBackup: () => Promise<void>;
};
