import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../Navigation';
import { impactLight, impactMedium, selectionChange } from '../utils/haptic';

type NavigationAction = 'default' | 'cancel' | 'confirm';

const useHapticNavigation = <T extends keyof RootStackParamList>(
  screen: T,
  options: {
    params?: any;
    action?: NavigationAction;
  } = {},
) => {
  const navigation =
    useNavigation() as NativeStackScreenProps<RootStackParamList>['navigation'];

  return useCallback(() => {
    switch (options.action) {
      case 'cancel':
        selectionChange();
        navigation.popTo(screen, options.params);
        return;

      case 'confirm':
        impactMedium();
        break;

      case 'default':
      default:
        impactLight();
    }

    navigation.navigate(screen, options.params);
  }, [navigation, screen, options.action]);
};

export default useHapticNavigation;
