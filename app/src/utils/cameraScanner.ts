import { NativeModules, Platform } from 'react-native';

import useNavigationStore from '../stores/navigationStore';
import { extractMRZInfo, formatDateToYYMMDD } from './utils';

type Callback = (
  error: Error | null,
  result?: {
    passportNumber: string;
    dateOfBirth: string;
    dateOfExpiry: string;
  },
) => void;
type CancelScan = () => void;

const handleCameraError = (
  e: Error,
  callback: Callback,
  trackEvent: (eventName: string, properties?: Record<string, any>) => void,
) => {
  console.error('Camera Activity Error:', e);
  trackEvent('Camera Activity Error', { error: e.message });
  callback(e);
};

export const startCameraScan = (callback: Callback): CancelScan => {
  const { trackEvent } = useNavigationStore.getState();
  if (Platform.OS === 'ios') {
    NativeModules.MRZScannerModule.startScanning()
      .then(
        (result: {
          documentNumber: string;
          birthDate: string;
          expiryDate: string;
        }) => {
          console.log('Scan result:', result);
          console.log(
            `Document Number: ${result.documentNumber}, Expiry Date: ${result.expiryDate}, Birth Date: ${result.birthDate}`,
          );

          callback(null, {
            passportNumber: result.documentNumber,
            dateOfBirth: formatDateToYYMMDD(result.birthDate),
            dateOfExpiry: formatDateToYYMMDD(result.expiryDate),
          });
        },
      )
      .catch((e: Error) => handleCameraError(e, callback, trackEvent));

    return () => {
      // TODO
      NativeModules.MRZScannerModule.stopScanning();
    };
  } else {
    NativeModules.CameraActivityModule.startCameraActivity()
      .then((mrzInfo: string) => {
        try {
          const { passportNumber, dateOfBirth, dateOfExpiry } =
            extractMRZInfo(mrzInfo);

          callback(null, {
            passportNumber,
            dateOfBirth,
            dateOfExpiry,
          });
        } catch (e) {
          console.error('Invalid MRZ format:', (e as Error).message);
          trackEvent('Invalid MRZ format', {
            error: (e as Error).message,
          });

          callback(e as Error);
        }
      })
      .catch((e: Error) => handleCameraError(e, callback, trackEvent));

    return () => {
      // TODO
      // NativeModules.CameraActivityModule.cancelCameraActivity();
      console.log('this would destroy the view');
    };
  }
};
