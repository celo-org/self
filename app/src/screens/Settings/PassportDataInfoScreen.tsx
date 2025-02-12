import React, { useCallback, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, Separator, XStack, YStack } from 'tamagui';

import {
  PassportMetadata,
  parsePassportData,
} from '../../../../common/src/utils/passports/passport_parsing/parsePassportData';
import { PassportData } from '../../../../common/src/utils/types';
import { Caption } from '../../components/typography/Caption';
import { usePassport } from '../../stores/passportDataProvider';
import useUserStore from '../../stores/userStore';
import { black, slate200 } from '../../utils/colors';

// TODO clarify if we need more/less keys to be displayed
const dataKeysToLabels: Record<
  keyof Omit<PassportMetadata, 'countryCode' | 'dsc' | 'csca'>,
  string
> = {
  dataGroups: 'Data Groups',
  dg1HashFunction: 'DG1 Hash Function',
  dg1HashOffset: 'DG1 Hash Offset',
  dgPaddingBytes: 'DG Padding Bytes',
  eContentSize: 'eContent Size',
  eContentHashFunction: 'eContent Hash Function',
  eContentHashOffset: 'eContent Hash Offset',
  signedAttrSize: 'Signed Attributes Size',
  signedAttrHashFunction: 'Signed Attributes Hash Function',
  signatureAlgorithm: 'Signature Algorithm',
  curveOrExponent: 'Curve or Exponent',
  saltLength: 'Salt Length',
  signatureAlgorithmBits: 'Signature Algorithm Bits',
  cscaFound: 'CSCA Found',
  cscaHashFunction: 'CSCA Hash Function',
  cscaSignatureAlgorithm: 'CSCA Signature Algorithm',
  cscaCurveOrExponent: 'CSCA Curve or Exponent',
  cscaSaltLength: 'CSCA Salt Length',
  cscaSignatureAlgorithmBits: 'CSCA Signature Algorithm Bits',
};

const InfoRow: React.FC<{
  label: string;
  value: string | number;
}> = ({ label, value }) => (
  <YStack>
    <XStack py="$4" justifyContent="space-between">
      <Caption size="large">{label}</Caption>
      <Caption color={black} size="large">
        {value}
      </Caption>
    </XStack>
    <Separator borderColor={slate200} />
  </YStack>
);

interface PassportDataInfoScreenProps {}

const PassportDataInfoScreen: React.FC<PassportDataInfoScreenProps> = ({}) => {
  const { getMetadata } = usePassport();
  const [metadata, setMetadata] = useState<PassportMetadata | null>(null);

  const loadData = useCallback(async () => {
    if (metadata) {
      return;
    }

    const result = await getMetadata();
    if (!result || !result.data) {
      // maybe handle error instead
      return;
    }
    setMetadata(result.data);
  }, [metadata, getMetadata]);

  useFocusEffect(() => {
    loadData();
  });

  return (
    <ScrollView px="$4">
      <YStack f={1} p="$0" gap="$2" jc="flex-start" py="$2">
        {Object.entries(dataKeysToLabels).map(([key, label]) => (
          <InfoRow
            key={key}
            label={label}
            value={
              !metadata
                ? ''
                : key === 'cscaFound'
                ? metadata?.cscaFound === true
                  ? 'Yes'
                  : 'No'
                : (metadata?.[key as keyof PassportMetadata] as
                    | string
                    | number) || 'None'
            }
          />
        ))}
      </YStack>
    </ScrollView>
  );
};

export default PassportDataInfoScreen;
