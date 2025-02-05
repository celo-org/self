import { create } from 'zustand';


interface SettingsState {
    hasPrivacyNoteBeenDismissed: boolean;
    dismissPrivacyNote: () => void;
}

export const useSettingStore = create<SettingsState>((set, get) => ({
    hasPrivacyNoteBeenDismissed: false,
    dismissPrivacyNote: () => {
        set({ hasPrivacyNoteBeenDismissed: true });
    },
}))