import { useCallback } from 'react';

import { CommonActions, useNavigation } from '@react-navigation/native';
import * as uuid from 'uuid';

import type { RootStackParamList } from '../Navigation';
import { impactLight, impactMedium, selectionChange } from '../utils/haptic';

type NavigationAction = 'default' | 'cancel' | 'confirm';

const useHapticNavigation = <
  T extends keyof RootStackParamList,
  P extends T extends null ? never : RootStackParamList[T],
>(
  screen: T,
  options: {
    params?: P;
    action?: NavigationAction;
  } = {},
) => {
  const navigation = useNavigation();

  return useCallback(() => {
    switch (options.action) {
      case 'cancel':
        if (screen !== null) {
          navigation.dispatch(state => {
            const routes = [
              ...state.routes.slice(0, state.routes.length - 1),
              {
                key: `${screen}-${uuid.v4()}`,
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
        }

        selectionChange();
        navigation.goBack();

        return;
      case 'confirm':
        impactMedium();
        break;

      case 'default':
      default:
        impactLight();
    }

    if (screen) {
      // @ts-expect-error - This actually works from outside usage, just unsure how to
      // make typescript understand that this is correct
      navigation.navigate(screen, options.params);
    }
  }, [navigation, screen, options.action]);
};

export default useHapticNavigation;
