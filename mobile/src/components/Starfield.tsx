import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// Deterministic pseudo-random so the field doesn't reshuffle on every re-render.
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

type StarSpec = {
  top: string;
  left: string;
  size: number;
  baseOpacity: number;
  floatDistance: number;
  floatDuration: number;
  twinkleDuration: number;
  delay: number;
};

function Star({ spec }: { spec: StarSpec }) {
  const twinkle = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: spec.twinkleDuration,
          delay: spec.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: spec.twinkleDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: spec.floatDuration,
          delay: spec.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: spec.floatDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    twinkleLoop.start();
    floatLoop.start();
    return () => {
      twinkleLoop.stop();
      floatLoop.stop();
    };
  }, [twinkle, float, spec]);

  const opacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [spec.baseOpacity * 0.25, spec.baseOpacity],
  });
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.floatDistance],
  });

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top: spec.top as any,
          left: spec.left as any,
          width: spec.size,
          height: spec.size,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export function Starfield({ count = 60 }: { count?: number }) {
  const stars = useMemo<StarSpec[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        top: `${seededRandom(i * 12.9898) * 100}%`,
        left: `${seededRandom(i * 78.233) * 100}%`,
        size: 1 + seededRandom(i * 37.719) * 2.2,
        baseOpacity: 0.25 + seededRandom(i * 93.989) * 0.6,
        floatDistance: 6 + seededRandom(i * 15.73) * 10,
        floatDuration: 2200 + seededRandom(i * 51.11) * 2600,
        twinkleDuration: 1200 + seededRandom(i * 27.61) * 1800,
        delay: seededRandom(i * 63.97) * 2000,
      })),
    [count]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star, i) => (
        <Star key={i} spec={star} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  star: { position: "absolute", borderRadius: 999, backgroundColor: "#ffffff" },
});
