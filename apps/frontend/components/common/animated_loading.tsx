import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/theme/colors";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type AnimatedLoadingProps = {
  label?: string;
  transparent?: boolean;
  style?: ViewStyle;
};

const CORE_SIZE = 56;
const RING_MAX_SCALE = 2;
const EKG_WIDTH = 148;
const EKG_HEIGHT = 34;
// A single heartbeat trace (flat - small bump - sharp spike - flat), traced
// left to right. Length below is the approximate on-screen path length,
// used to size the moving dash so it travels the full trace before looping.
const EKG_PATH = "M0 17 H32 L40 6 L48 28 L54 17 H72 L79 10 L85 24 L91 17 H148";
const EKG_PATH_LENGTH = 300;
const EKG_TRACE_LENGTH = 46;

// Branded full-screen loader: a breathing medical-cross core, two radar-style
// pulse rings expanding outward from it, and a small EKG trace sweeping
// beneath - reads as "vitals monitor" rather than a generic spinner, while
// staying to one calm, evenly-paced loop (nothing that resets abruptly for
// the eye to catch).
export function AnimatedLoading({ label, transparent, style }: AnimatedLoadingProps) {
  const breathe = useRef(new Animated.Value(0)).current;
  const ringA = useRef(new Animated.Value(0)).current;
  const ringB = useRef(new Animated.Value(0)).current;
  const trace = useRef(new Animated.Value(0)).current;
  const labelFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );

    const ringLoop = (value: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(700),
        ]),
      );
    const ringLoopA = ringLoop(ringA);
    const ringLoopB = ringLoop(ringB);

    const traceLoop = Animated.loop(
      Animated.timing(trace, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: false }),
    );

    pulse.start();
    ringLoopA.start();
    const staggerTimeout = setTimeout(() => ringLoopB.start(), 800);
    traceLoop.start();
    Animated.timing(labelFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    return () => {
      pulse.stop();
      ringLoopA.stop();
      ringLoopB.stop();
      traceLoop.stop();
      clearTimeout(staggerTimeout);
    };
  }, [breathe, ringA, ringB, trace, labelFade]);

  const coreScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] });

  const ringStyle = (value: Animated.Value) => ({
    transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [1, RING_MAX_SCALE] }) }],
    opacity: value.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.4, 0] }),
  });

  const dashOffset = trace.interpolate({
    inputRange: [0, 1],
    outputRange: [EKG_TRACE_LENGTH, -(EKG_PATH_LENGTH + EKG_TRACE_LENGTH)],
  });

  return (
    <View style={[styles.container, transparent ? styles.transparent : styles.opaque, style]}>
      <View style={styles.badgeWrap}>
        <Animated.View style={[styles.ring, ringStyle(ringA)]} />
        <Animated.View style={[styles.ring, ringStyle(ringB)]} />
        <Animated.View style={[styles.core, { transform: [{ scale: coreScale }] }]}>
          <Ionicons name="medical" size={26} color="#fff" />
        </Animated.View>
      </View>

      <Svg width={EKG_WIDTH} height={EKG_HEIGHT} style={styles.ekg}>
        <Path d={EKG_PATH} stroke={colors.light.borderMuted} strokeWidth={2} fill="none" opacity={0.5} />
        <AnimatedPath
          d={EKG_PATH}
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${EKG_TRACE_LENGTH} ${EKG_PATH_LENGTH}`}
          strokeDashoffset={dashOffset as unknown as number}
        />
      </Svg>

      {label ? <Animated.Text style={[styles.label, { opacity: labelFade }]}>{label}</Animated.Text> : null}
    </View>
  );
}

const RING_WRAP_SIZE = CORE_SIZE * RING_MAX_SCALE;

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
  badgeWrap: {
    width: RING_WRAP_SIZE,
    height: RING_WRAP_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  ekg: {
    marginTop: 6,
  },
  label: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.textSecondary,
    textAlign: "center",
  },
});
