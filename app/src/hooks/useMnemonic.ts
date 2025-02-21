import { useCallback, useState } from 'react';

import { useAuth } from '../stores/authProvider';
import { Mnemonic } from '../types/mnemonic';

export default function useMnemonic() {
  const { getOrCreateMnemonic } = useAuth();
  const [mnemonic, setMnemonic] = useState<string[]>();

  const loadMnemonic = useCallback(async () => {
    const storedMnemonic = await getOrCreateMnemonic();
    if (!storedMnemonic) {
      return;
    }
    const { phrase } = JSON.parse(storedMnemonic.data) as Mnemonic;
    setMnemonic(phrase.trim().split(' '));
  }, []);

  return {
    loadMnemonic,
    mnemonic,
  };
}
