import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

type AnimatedLoadingProps = {
  label?: string;
  transparent?: boolean;
  style?: ViewStyle;
};

// Branded full-screen loader: a single breathing circle around a medical
// cross icon. Kept to one symmetric in/out/in loop (each cycle ends exactly
// where it started, so there's no reset for the eye to catch) rather than
// combining a spinner + glow + core, which read as busier than a loading
// state needs to be.
export function AnimatedLoading({ label, transparent, style }: AnimatedLoadingProps) {
  const breathe = useRef(new Animated.Value(0)).current;
  const labelFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    Animated.timing(labelFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    return () => pulse.stop();
  }, [breathe, labelFade]);

  const coreScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });

  return (
    <View style={[styles.container, transparent ? styles.transparent : styles.opaque, style]}>
      <Animated.View style={[styles.core, { transform: [{ scale: coreScale }] }]}>
        <Ionicons name="medical" size={26} color="#fff" />
      </Animated.View>
      {label ? <Animated.Text style={[styles.label, { opacity: labelFade }]}>{label}</Animated.Text> : null}
    </View>
  );
}

const CORE_SIZE = 52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  opaque: {
    backgroundColor: colors.light.background,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  label: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.textSecondary,
    textAlign: "center",
  },
});
