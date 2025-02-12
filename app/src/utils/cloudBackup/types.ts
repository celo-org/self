export type UseBackupPrivateKey = () => {
  upload: () => Promise<void>;
  download: () => Promise<string>;
  disableBackup: () => Promise<void>;
};
