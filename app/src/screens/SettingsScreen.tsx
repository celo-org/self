import React, { PropsWithChildren, useCallback } from 'react';
import { Linking, Share } from 'react-native';
import { SvgProps } from 'react-native-svg';

import { useNavigation } from '@react-navigation/native';
import { Button, XStack, YStack } from 'tamagui';

import { BodyText } from '../components/typography/BodyText';
import Github from '../images/icons/github.svg';
import Cloud from '../images/icons/settings_cloud_backup.svg';
import Data from '../images/icons/settings_data.svg';
import Feedback from '../images/icons/settings_feedback.svg';
import Lock from '../images/icons/settings_lock.svg';
import ShareIcon from '../images/icons/share.svg';
import Star from '../images/icons/star.svg';
import Telegram from '../images/icons/telegram.svg';
import Web from '../images/icons/webpage.svg';
import { amber500, black, neutral700, slate800, white } from '../utils/colors';

interface SettingsScreenProps {}
interface MenuButtonProps extends PropsWithChildren {
  Icon: React.FC<SvgProps>;
  onPress: () => void;
}
interface MenuButtonProps {
  Icon: React.FC<SvgProps>;
  onPress: () => void;
}
interface SocialButtonProps {
  Icon: React.FC<SvgProps>;
  href: string;
}

type RouteOption = keyof ReactNavigation.RootParamList | 'share';

const routes = [
  [Data, 'View passport info', 'TODO: passportinfo'],
  [Lock, 'Reveal recovery phrase', 'ShowRecoveryPhrase'],
  [Cloud, 'Enable cloud back up', 'TODO: backup'],
  [Feedback, 'Send feeback', 'TODO: feedback'],
  [ShareIcon, 'Share Self app', 'share'],
] as [React.FC<SvgProps>, string, RouteOption][];

const social = [
  [Github, 'http://github.com/celo-org/self'],
  [Web, 'https://www.openpassport.app/'],
  [Telegram, 'TODO: Telegram URL?'],
] as [React.FC<SvgProps>, string][];

const MenuButton: React.FC<MenuButtonProps> = ({ children, Icon, onPress }) => (
  <Button
    unstyled
    onPress={onPress}
    width="100%"
    flexDirection="row"
    gap={6}
    padding={20}
    borderBottomColor={neutral700}
    borderBottomWidth={1}
  >
    <Icon height={24} width={21} color={white} />
    <BodyText color={white} fontSize={18} lineHeight={23}>
      {children}
    </BodyText>
  </Button>
);

const SocialButton: React.FC<SocialButtonProps> = ({ Icon, href }) => {
  const onPress = useCallback(() => {
    Linking.openURL(href);
  }, []);

  return (
    <Button
      unstyled
      icon={<Icon height={32} width={32} color={amber500} onPress={onPress} />}
    />
  );
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({}) => {
  const navigation = useNavigation();
  const onMenuPress = useCallback(
    (menuRoute: RouteOption) => {
      return () => {
        if (menuRoute === 'share') {
          Share.share('TODO: WHAT ARE WE SHARING?');
        } else {
          navigation.navigate(menuRoute);
        }
      };
    },
    [navigation],
  );

  return (
    <YStack
      bg={black}
      gap={20}
      jc="space-between"
      height={'100%'}
      padding={20}
      borderTopLeftRadius={30}
      borderTopRightRadius={30}
      paddingBottom={50}
    >
      <YStack ai="flex-start" gap={20} justifyContent="flex-start" width="100%">
        {routes.map(([Icon, menuText, menuRoute]) => (
          <MenuButton
            key={menuRoute}
            Icon={Icon}
            onPress={onMenuPress(menuRoute)}
          >
            {menuText}
          </MenuButton>
        ))}
      </YStack>
      <YStack ai="center" gap={20} justifyContent="center" paddingBottom={40}>
        <Button
          unstyled
          icon={<Star color={white} height={24} width={21} />}
          width="100%"
          padding={20}
          backgroundColor={slate800}
          color={white}
          flexDirection="row"
          jc="center"
          ai="center"
          gap={6}
          borderRadius={4}
        >
          <BodyText color={white}>Leave an app store review</BodyText>
        </Button>
        <XStack gap={32}>
          {social.map(([Icon, href], i) => (
            <SocialButton key={i} Icon={Icon} href={href} />
          ))}
        </XStack>
        <BodyText color={amber500} fontSize={15}>
          SELF
        </BodyText>
      </YStack>
    </YStack>
  );
};

export default SettingsScreen;
