import 'react-native-gesture-handler';
import {
  createStaticNavigation,
  StaticParamList,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LaunchScreen from './screens/LaunchScreen';
import StartScreen from './screens/StartScreen';
import PassportOnboardingScreen from './screens/PassportOnboardingScreen';

const RootStack = createStackNavigator({
  initialRouteName: 'Launch',
  screens: {
    Launch: {
      if: () => true, // TODO: useIsNewUser
      screen: LaunchScreen,
      options: {
        header: () => null,
      },
    },
    Start: {
      if: () => true, // TODO: useIsNewUser
      screen: StartScreen,
      options: {
        header: () => null,
      },
    },
    PassportOnboarding: {
      screen: PassportOnboardingScreen,
      options: {
        header: () => null,
      },
    },
  },
});

const AppNavigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default AppNavigation;
