import { Platform } from 'react-native';

import SpInAppUpdates, {
  IAUUpdateKind,
  StartUpdateOptions,
} from 'sp-react-native-in-app-updates';

const inAppUpdates = new SpInAppUpdates(
  __DEV__, // isDebug
);

export const useInAppUpdate = () => {
  const checkForUpdates = async (forceTest: boolean = false) => {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const result = await inAppUpdates.checkNeedsUpdate();

      if (result.shouldUpdate || forceTest) {
        const updateOptions: StartUpdateOptions = {
          updateType: IAUUpdateKind.IMMEDIATE,
        };

        await inAppUpdates.startUpdate(updateOptions);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  };

  const startFlexibleUpdate = async () => {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const updateOptions: StartUpdateOptions = {
        updateType: IAUUpdateKind.FLEXIBLE,
      };
      await inAppUpdates.startUpdate(updateOptions);
      return true;
    } catch (error) {
      console.error('Error starting flexible update:', error);
      return false;
    }
  };

  return {
    checkForUpdates,
    startFlexibleUpdate,
  };
};
