import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SkeletonListLoader } from "@/components/common/skeleton";

type DataStateProps = {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyIcon?: React.ComponentProps<typeof Ionicons>["name"];
  emptyTitle?: string;
  emptyBody?: string;
  loadingLabel?: string;
  minHeight?: number;
  /** Rows loading with a spinner + label (default) instead of the
   * row-shaped shimmer skeleton. Use for short, non-tabular waits. */
  loadingVariant?: "skeleton" | "spinner";
  skeletonRows?: number;
  children: React.ReactNode;
};

/**
 * Shared loading/error/empty slot for data-driven screens.
 * Falls through to `children` once loading is done, there's no error, and data isn't empty.
 */
export function DataState({
  loading,
  error,
  isEmpty,
  onRetry,
  emptyIcon = "file-tray-outline",
  emptyTitle = "Nothing here yet",
  emptyBody,
  loadingLabel = "Loading…",
  minHeight = 220,
  loadingVariant = "skeleton",
  skeletonRows = 5,
  children,
}: DataStateProps) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const fade = React.useRef(new Animated.Value(0)).current;
  const phase = loading ? "loading" : error ? "error" : isEmpty ? "empty" : "content";

  React.useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [phase, fade]);

  if (loading) {
    if (loadingVariant === "skeleton") {
      return (
        <Animated.View style={{ minHeight, opacity: fade }}>
          <SkeletonListLoader rows={skeletonRows} />
        </Animated.View>
      );
    }
    return (
      <Animated.View style={[styles.center, { minHeight, opacity: fade }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        {!!loadingLabel && <Text style={styles.loadingText}>{loadingLabel}</Text>}
      </Animated.View>
    );
  }

  if (error) {
    return (
      <Animated.View style={[styles.center, { minHeight, opacity: fade }]}>
        <View style={[styles.iconBubble, { backgroundColor: "#FEF2F2" }]}>
          <Ionicons name="alert-circle-outline" size={22} color={theme.colors.error} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>Something went wrong</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{error}</Text>
        {!!onRetry && (
          <TouchableOpacity onPress={onRetry} style={[styles.retryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Ionicons name="refresh" size={14} color={theme.colors.primary} />
            <Text style={[styles.retryText, { color: theme.colors.primary }]}>Try again</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }

  if (isEmpty) {
    return (
      <Animated.View style={[styles.center, { minHeight, opacity: fade }]}>
        <View style={[styles.iconBubble, { backgroundColor: theme.colors.accent }]}>
          <Ionicons name={emptyIcon} size={22} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{emptyTitle}</Text>
        {!!emptyBody && <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{emptyBody}</Text>}
      </Animated.View>
    );
  }

  return <Animated.View style={{ opacity: fade }}>{children}</Animated.View>;
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    center: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      paddingHorizontal: 24,
      gap: 8,
    },
    iconBubble: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    loadingText: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.textSecondary,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },
    body: {
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
      maxWidth: 360,
      lineHeight: 19,
    },
    retryButton: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    retryText: {
      fontSize: 13,
      fontWeight: "700",
    },
  });
