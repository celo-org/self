import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { impactLight, impactMedium, selectionChange } from '../utils/haptic';

type NavigationAction = 'default' | 'cancel' | 'confirm';

const useHapticNavigation = (
  screen: string,
  action: NavigationAction = 'default',
) => {
  const navigation = useNavigation();

  return useCallback(() => {
    switch (action) {
      case 'cancel':
        selectionChange();
        break;
      case 'confirm':
        impactMedium();
        break;
      default:
        impactLight();
    }
    navigation.navigate(screen as any);
  }, [navigation, screen, action]);
};

export default useHapticNavigation;
