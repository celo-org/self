import { useCallback } from 'react';

import { CommonActions, useNavigation } from '@react-navigation/native';
import * as uuid from 'uuid';

import type { RootStackParamList } from '../Navigation';
import { impactLight, impactMedium, selectionChange } from '../utils/haptic';

type NavigationAction = 'default' | 'cancel' | 'confirm';

const useHapticNavigation = (
  screen: keyof RootStackParamList,
  action: NavigationAction = 'default',
) => {
  const navigation = useNavigation();

  return useCallback(() => {
    switch (action) {
      case 'cancel':
        navigation.dispatch(state => {
          const routes = [
            ...state.routes.slice(0, state.routes.length - 1),
            {
              key: `screen-${uuid.v4()}`,
              name: screen,
              params: {},
            },
            ...state.routes.slice(state.routes.length - 1),
          ];

          return CommonActions.reset({
            ...state,
            routes,
            index: routes.length - 1,
          });
        });

        selectionChange();

        navigation.goBack();

        return;
      case 'confirm':
        impactMedium();
        break;
      default:
        impactLight();
    }
    navigation.navigate(screen);
  }, [navigation, screen, action]);
};

export default useHapticNavigation;
