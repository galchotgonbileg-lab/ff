import React, { useRef } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  children,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: React.ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;

  function animateTo(value: number) {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  }

  return (
    <Pressable
      {...props}
      onPressIn={(e) => {
        animateTo(scaleTo);
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1);
        props.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
