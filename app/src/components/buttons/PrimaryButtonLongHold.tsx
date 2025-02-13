import React, { useEffect, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  useAnimatedValue,
} from 'react-native';

import { ButtonProps } from './AbstractButton';
import { PrimaryButton } from './PrimaryButton';

type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;

const ACTION_TIMER = 1000; // time in ms
//slate400 to slate800 but in rgb
const COLORS: RGBA[] = ['rgba(30, 41, 59, 0.3)', 'rgba(30, 41, 59, 1)'];
export function HeldPrimaryButton({
  children,
  onPress,
  ...props
}: ButtonProps) {
  const animation = useAnimatedValue(0);

  const [size, setSize] = useState({ width: 0, height: 0 });

  const onPressIn = () => {
    Animated.timing(animation, {
      toValue: 1,
      duration: ACTION_TIMER,
      useNativeDriver: false,
    });
  };

  const onPressOut = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: ACTION_TIMER,
      useNativeDriver: false,
    });
  };

  const getButtonSize = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width - 1;
    const height = e.nativeEvent.layout.height - 1;
    setSize({ width, height });
  };

  const getProgressStyles = () => {
    const width = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, size.width],
    });
    const bgColor = animation.interpolate({
      inputRange: [0, 1],
      outputRange: COLORS,
    });
    return {
      width: width,
      height: size.height,
      backgroundColor: bgColor,
    };
  };

  useEffect(() => {
    animation.addListener(({ value }) => {
      // when the animation is done we want to call the onPress function
      if (value === 1) {
        // @ts-expect-error
        onPress();
      }
    });
    return () => {
      animation.removeAllListeners();
    };
  }, [animation]);

  return (
    <PrimaryButton
      {...props}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onLayout={getButtonSize}
      animatedComponent={
        <Animated.View style={[styles.fill, getProgressStyles()]} />
      }
    >
      {children}
    </PrimaryButton>
  );
}
const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
});
