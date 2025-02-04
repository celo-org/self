import React, { useCallback, useEffect, useRef } from 'react';
import { NativeSyntheticEvent, requireNativeComponent } from 'react-native';
import { PixelRatio, UIManager, findNodeHandle } from 'react-native';

interface RCTQRCodeScannerViewProps {
  ref: ReturnType<typeof useRef>;
  style: {
    width: number;
    height: number;
  };
  onError: (
    event: NativeSyntheticEvent<{
      error: string;
      errorMessage: string;
      stackTrace: string;
    }>,
  ) => void;
  onQRData: (event: NativeSyntheticEvent<{ data: string }>) => void;
}

const RCT_COMPONENT_NAME = 'QRCodeScannerViewManager';
const QRCodeScannerViewManager: React.ComponentType<RCTQRCodeScannerViewProps> =
  requireNativeComponent(RCT_COMPONENT_NAME);

export interface QRCodeScannerViewProps {
  isMounted: boolean;
  onQRData: (error: Error | null, uri?: string) => void;
}

function createFragment(viewId: number) {
  try {
    UIManager.dispatchViewManagerCommand(
      viewId,
      // we are calling the 'create' command
      UIManager.getViewManagerConfig(
        RCT_COMPONENT_NAME,
      ).Commands.create.toString(),
      [viewId],
    );
  } catch (e) {
    // Error creatingthe fragment
    // TODO: assert this only happens in dev mode when the fragment is already mounted
    console.log(e);
    destroyFragment(viewId);
  }
}
function destroyFragment(viewId: number) {
  try {
    UIManager.dispatchViewManagerCommand(
      viewId,
      // we are calling the 'create' command
      UIManager.getViewManagerConfig(
        RCT_COMPONENT_NAME,
      ).Commands.destroy.toString(),
      [viewId],
    );
  } catch (e) {
    // noop, fragment was destroyed earlier either through navigation or else
    console.log(e);
  }
}

export const QRCodeScannerView: React.FC<QRCodeScannerViewProps> = ({
  onQRData,
  isMounted,
}) => {
  const ref = useRef(null);

  const _onError = useCallback<RCTQRCodeScannerViewProps['onError']>(
    ({ nativeEvent: { error, errorMessage, stackTrace } }) => {
      if (!isMounted) {
        return;
      }
      const e = new Error(errorMessage);
      e.stack = stackTrace;
      e.cause = error;
      onQRData(e);
    },
    [onQRData, isMounted],
  );

  const _onQRData = useCallback<RCTQRCodeScannerViewProps['onQRData']>(
    ({ nativeEvent: { data } }) => {
      if (!isMounted) {
        return;
      }
      console.log(data);
      onQRData(null, data);
    },
    [onQRData, isMounted],
  );

  useEffect(() => {
    const viewId = findNodeHandle(ref.current);
    if (!viewId) {
      return;
    }

    if (isMounted) {
      createFragment(viewId);
    } else {
      destroyFragment(viewId);
    }
  }, [ref, isMounted]);

  return (
    <QRCodeScannerViewManager
      style={{
        // converts dpi to px, provide desired height
        height: PixelRatio.getPixelSizeForLayoutSize(800),
        // converts dpi to px, provide desired width
        width: PixelRatio.getPixelSizeForLayoutSize(400),
      }}
      onError={_onError}
      onQRData={_onQRData}
      ref={ref}
    />
  );
};
