import React from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/theme_provider";

type ToggleProps = {
  value: boolean;
  onValueChange?: (next: boolean) => void;
  disabled?: boolean;
  /** Announced to screen readers - required when there is no adjacent label. */
  accessibilityLabel?: string;
  style?: ViewStyle;
};

const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 26;
const KNOB_SIZE = 20;
const KNOB_INSET = 3;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2;

/**
 * Themed on/off switch.
 *
 * React Native's own `Switch` does not apply `trackColor` on web - it falls
 * back to the platform accent (a green), which clashed with the primary blue
 * used by every other control. This renders the track and knob directly so the
 * colour is ours on all platforms, and matches the toggle already drawn by
 * hand on the team/users screen.
 */
export function Toggle({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
  style,
}: ToggleProps) {
  const { theme } = useTheme();
  const progress = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      // `left` is a layout prop, so this cannot run on the native driver.
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.disabled, theme.colors.primary],
  });

  const knobLeft = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [KNOB_INSET, KNOB_INSET + KNOB_TRAVEL],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      style={[styles.hit, disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.knob, { left: knobLeft, backgroundColor: theme.colors.surface }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Keeps the pressable at the 44pt minimum touch target without making the
  // track itself taller than the design.
  hit: {
    minHeight: 44,
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : null),
  },
  disabled: {
    opacity: 0.5,
    ...(Platform.OS === "web" ? ({ cursor: "default" } as any) : null),
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: 999,
    justifyContent: "center",
  },
  knob: {
    position: "absolute",
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 1px 2px rgba(15,23,42,0.25)" } as any)
      : null),
  },
});

export default Toggle;
