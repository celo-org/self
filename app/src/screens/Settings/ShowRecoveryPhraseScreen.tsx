import React, { useCallback, useState } from 'react';

import Mnemonic from '../../components/Mnemonic';
import Description from '../../components/typography/Description';
import { ExpandableBottomLayout } from '../../layouts/ExpandableBottomLayout';
import { useAuth } from '../../stores/authProvider';

interface ShowRecoveryPhraseScreenProps {}

const ShowRecoveryPhraseScreen: React.FC<
  ShowRecoveryPhraseScreenProps
> = ({}) => {
  const { getOrCreateMnemonic } = useAuth();
  const [mnemonic, setMnemonic] = useState<string[]>();

  const onRevealWords = useCallback(async () => {
    await loadMnemonic();
  }, []);

  const loadMnemonic = useCallback(async () => {
    const storedMnemonic = await getOrCreateMnemonic();
    if (!storedMnemonic) {
      return;
    }
    const { phrase } = JSON.parse(storedMnemonic.data);
    setMnemonic(phrase.trim().split(' '));
  }, []);

  return (
    <ExpandableBottomLayout.Layout backgroundColor="white">
      <ExpandableBottomLayout.BottomSection
        backgroundColor="white"
        justifyContent="center"
        gap={20}
      >
        <Mnemonic words={mnemonic} onRevealWords={onRevealWords} />
        <Description>
          This phrase is the only way to recover your account. Keep it secret,
          keep it safe.
        </Description>
      </ExpandableBottomLayout.BottomSection>
    </ExpandableBottomLayout.Layout>
  );
};

export default ShowRecoveryPhraseScreen;
