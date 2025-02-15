import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import LottieView from 'lottie-react-native';

// Import passport data generation and payload functions from common
import { genMockPassportData } from '../../../../common/src/utils/passports/genMockPassportData';
// Import animations
import failAnimation from '../../assets/animations/loading/fail.json';
import miscAnimation from '../../assets/animations/loading/misc.json';
import successAnimation from '../../assets/animations/loading/success.json';
import useHapticNavigation from '../../hooks/useHapticNavigation';
import { usePassport } from '../../stores/passportDataProvider';
import { ProofStatusEnum, useProofInfo } from '../../stores/proofProvider';
import {
  checkPassportSupported,
  registerPassport,
} from '../../utils/proving/payload';

const LoadingScreen: React.FC = () => {
  const goToSuccessScreen = useHapticNavigation('AccountVerifiedSuccess');
  const goToErrorScreen = useHapticNavigation('ConfirmBelongingScreen');
  const goToUnsupportedScreen = useHapticNavigation('UnsupportedPassport');
  const goToSuccessScreenWithDelay = () => {
    setTimeout(() => {
      goToSuccessScreen();
    }, 3000);
  };
  const goToErrorScreenWithDelay = () => {
    setTimeout(() => {
      goToErrorScreen();
    }, 3000);
  };
  const [animationSource, setAnimationSource] = useState<any>(miscAnimation);
  const { status, setStatus, resetProof } = useProofInfo();
  const { getPassportDataAndSecret, clearPassportData } = usePassport();

  // Ensure we only set the initial status once on mount (if needed)
  useEffect(() => {
    setStatus(ProofStatusEnum.PENDING);
  }, []);

  // New effect to reset status when the screen loads
  useEffect(() => {
    resetProof();
    processPayloadCalled.current = false;
  }, []);

  useEffect(() => {
    // Change animation based on the global proof status.
    if (status === ProofStatusEnum.SUCCESS) {
      setAnimationSource(successAnimation);
      goToSuccessScreenWithDelay();
      setTimeout(() => resetProof(), 3000);
    } else if (
      status === ProofStatusEnum.FAILURE ||
      status === ProofStatusEnum.ERROR
    ) {
      setAnimationSource(failAnimation);
      goToErrorScreenWithDelay();
      setTimeout(() => resetProof(), 3000);
    }
  }, [status]);

  // Use a ref to make sure processPayload is only executed once during the component's lifecycle.
  const processPayloadCalled = useRef(false);

  useEffect(() => {
    if (!processPayloadCalled.current) {
      processPayloadCalled.current = true;
      const processPayload = async () => {
        try {
          // Generate passport data and update the store.
          const passportData = genMockPassportData(
            'sha256', // sha1
            'sha256',
            'rsa_sha256_65537_2048',
            'FRA',
            '000101',
            '300101',
          );

          const passportDataAndSecret = await getPassportDataAndSecret();
          if (!passportDataAndSecret) {
            return;
          }

          const {
            // passportData,
            secret,
          } = passportDataAndSecret.data;

          const isSupported = checkPassportSupported(passportData);
          if (!isSupported) {
            goToUnsupportedScreen();
            console.log('Passport not supported');
            // passport data has not been fully parsed correctly
            // so we clear it from the keychain
            clearPassportData();
            return;
          }

          // This will trigger sendPayload(), which updates global status via your tee.ts code.
          registerPassport(passportData, secret);
        } catch (error) {
          console.error('Error processing payload:', error);
          setStatus(ProofStatusEnum.ERROR);
        }
      };
      processPayload();
    }
  }, []);

  return (
    <LottieView
      autoPlay
      // Loop only the misc animation. Once payload processing completes,
      // success or error animations will display without looping.
      loop={animationSource === miscAnimation}
      source={animationSource}
      style={styles.animation}
      resizeMode="cover"
      renderMode="HARDWARE"
    />
  );
};

const styles = StyleSheet.create({
  animation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default LoadingScreen;
