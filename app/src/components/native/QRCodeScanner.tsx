import React, { useCallback } from 'react';
import {
  Platform,
  NativeSyntheticEvent,
  PixelRatio,
  requireNativeComponent,
} from 'react-native';

import { RCTFragment, RCTFragmentViewManagerProps } from './RCTFragment';

interface RCTQRCodeScannerViewProps extends RCTFragmentViewManagerProps {
  onQRData: (event: NativeSyntheticEvent<{ data: string }>) => void;
}

let QRCodeNativeComponent: React.ComponentType<any>;

if (Platform.OS === 'ios') {
  // For iOS, use the new native module (registered as 'QRCodeScannerView')
  QRCodeNativeComponent = requireNativeComponent('QRCodeScannerView');
} else {
  // For Android, use the existing native component (registered as 'QRCodeScannerViewManager')
  QRCodeNativeComponent = requireNativeComponent('QRCodeScannerViewManager');
}

export interface QRCodeScannerViewProps {
  isMounted: boolean;
  onQRData: (error: Error | null, uri?: string) => void;
}

export const QRCodeScannerView: React.FC<QRCodeScannerViewProps> = ({
  onQRData,
  isMounted,
}) => {
  const _onError = useCallback(
    (
      event: NativeSyntheticEvent<{
        error: string;
        errorMessage: string;
        stackTrace: string;
      }>
    ) => {
      if (!isMounted) {
        return;
      }
      const { error, errorMessage, stackTrace } = event.nativeEvent;
      const e = new Error(errorMessage);
      e.stack = stackTrace;
      onQRData(e);
    },
    [onQRData, isMounted]
  );

  const _onQRData = useCallback(
    (event: NativeSyntheticEvent<{ data: string }>) => {
      if (!isMounted) {
        return;
      }
      console.log(event.nativeEvent.data);
      onQRData(null, event.nativeEvent.data);
    },
    [onQRData, isMounted]
  );

  const style = {
    height: PixelRatio.getPixelSizeForLayoutSize(800),
    width: PixelRatio.getPixelSizeForLayoutSize(400),
  };

  if (Platform.OS === 'ios') {
    return (
      <QRCodeNativeComponent
        onQRData={_onQRData}
        onError={_onError}
        style={style}
      />
    );
  } else {
    // For Android, wrap the native component inside your RCTFragment to preserve existing functionality.
    const Fragment = RCTFragment as React.FC<RCTQRCodeScannerViewProps>;
    return (
      <Fragment
        RCTFragmentViewManager={QRCodeNativeComponent}
        fragmentComponentName="QRCodeScannerViewManager"
        isMounted={isMounted}
        style={style}
        onError={_onError}
        onQRData={_onQRData}
      />
    );
  }
};
