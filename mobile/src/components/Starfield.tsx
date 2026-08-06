import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

// Deterministic pseudo-random so the field doesn't reshuffle on every re-render.
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function Starfield({ count = 60 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        top: `${seededRandom(i * 12.9898) * 100}%`,
        left: `${seededRandom(i * 78.233) * 100}%`,
        size: 1 + seededRandom(i * 37.719) * 2.2,
        opacity: 0.25 + seededRandom(i * 93.989) * 0.6,
      })),
    [count]
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: star.top as any,
              left: star.left as any,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  star: { position: "absolute", borderRadius: 999, backgroundColor: "#ffffff" },
});
