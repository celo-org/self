import React from 'react';
import { StyleSheet } from 'react-native';
import { YStack } from 'tamagui';

import { black, white } from '../utils/colors';

// TODO: they don't differ too much at this point
interface ExpandableBottomLayoutProps {
  children: React.ReactNode;
}

interface TopSectionProps {
  children: React.ReactNode;
}

interface BottomSectionProps {
  children: React.ReactNode;
}

// TODO: maybe using those as ExpandableBottomLayout.Wrapper, ExpandableBottomLayout.TopSection would
// be a better idea?
export const ExpandableBottomLayout: React.FC<ExpandableBottomLayoutProps> = ({
  children,
}) => {
  return <YStack style={styles.layout}>{children}</YStack>;
};

export const TopSection: React.FC<TopSectionProps> = ({ children }) => {
  return (
    <>
      <YStack style={styles.topSection}>{children}</YStack>
    </>
  );
};

export const BottomSection: React.FC<BottomSectionProps> = ({ children }) => {
  return (
    <>
      <YStack style={styles.bottomSection}>{children}</YStack>
    </>
  );
};

const styles = StyleSheet.create({
  layout: {
    height: '100%',
  },
  topSection: {
    alignSelf: 'stretch',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // TODO: don't know if it's the best idea to hardcode the colors here
    backgroundColor: black,
  },
  bottomSection: {
    backgroundColor: white,
    paddingTop: 50,
    paddingLeft: 20,
    paddingRight: 20,
  },
});
