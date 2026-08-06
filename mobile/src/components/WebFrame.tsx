import React from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { colors } from "../theme";

const MAX_WIDTH = 480;

export function WebFrame({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== "web" || width <= MAX_WIDTH) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: "#050512" }}>
      <View
        style={{
          flex: 1,
          width: MAX_WIDTH,
          maxWidth: MAX_WIDTH,
          backgroundColor: colors.background,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
          boxShadow: "0 0 60px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </View>
    </View>
  );
}
