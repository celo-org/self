import { resetGenericPassword } from 'react-native-keychain';

import { DEFAULT_DOB, DEFAULT_DOE, DEFAULT_PNUMBER } from '@env';
import { create } from 'zustand';

interface UserState {
  passportNumber: string;
  dateOfBirth: string;
  dateOfExpiry: string;
  clearPassportDataFromStorage: () => void;
  clearSecretFromStorage: () => void;
  update: (patch: any) => void;
  deleteMrzFields: () => void;
}

const useUserStore = create<UserState>((set, get) => ({
  passportNumber: DEFAULT_PNUMBER ?? '',
  dateOfBirth: DEFAULT_DOB ?? '',
  dateOfExpiry: DEFAULT_DOE ?? '',

  clearPassportDataFromStorage: async () => {
    await resetGenericPassword({ service: 'passportData' });
  },

  clearSecretFromStorage: async () => {
    await resetGenericPassword({ service: 'secret' });
  },

  update: patch => {
    set({
      ...get(),
      ...patch,
    });
  },

  deleteMrzFields: () =>
    set({
      passportNumber: '',
      dateOfBirth: '',
      dateOfExpiry: '',
    }),
}));

export default useUserStore;
