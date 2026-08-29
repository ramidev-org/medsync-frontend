import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AnimatePresence, MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/theme_provider";

type ToastKind = "info" | "success" | "warning" | "error" | "message";

type ToastInput = {
  title: string;
  body?: string;
  kind?: ToastKind;
  durationMs?: number;
  onPress?: () => void;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastKind, React.ComponentProps<typeof Ionicons>["name"]> = {
  info: "information-circle",
  success: "checkmark-circle",
  warning: "warning",
  error: "alert-circle",
  message: "chatbubble-ellipses",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      const duration = toast.durationMs ?? 5000;
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const colorFor = (kind: ToastKind = "info") => {
    switch (kind) {
      case "success":
        return theme.colors.success;
      case "warning":
        return theme.colors.warning;
      case "error":
        return theme.colors.error;
      case "message":
        return theme.colors.primary;
      default:
        return theme.colors.info ?? theme.colors.primary;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.host} pointerEvents="box-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const tint = colorFor(toast.kind);
            return (
              <MotiView
                key={toast.id}
                from={{ opacity: 0, translateY: -16, scale: 0.96 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                exit={{ opacity: 0, translateX: 60, scale: 0.96 }}
                transition={{ type: "timing", duration: 220 }}
                style={[styles.toast, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Pressable
                  style={styles.toastInner}
                  onPress={() => {
                    toast.onPress?.();
                    dismiss(toast.id);
                  }}
                >
                  <View style={[styles.iconBubble, { backgroundColor: `${tint}22` }]}>
                    <Ionicons name={ICONS[toast.kind ?? "info"]} size={18} color={tint} />
                  </View>
                  <View style={styles.textWrap}>
                    <Text numberOfLines={1} style={[styles.title, { color: theme.colors.text }]}>{toast.title}</Text>
                    {!!toast.body && (
                      <Text numberOfLines={2} style={[styles.body, { color: theme.colors.textSecondary }]}>{toast.body}</Text>
                    )}
                  </View>
                  <Pressable hitSlop={8} onPress={() => dismiss(toast.id)} style={styles.closeBtn}>
                    <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                  </Pressable>
                </Pressable>
              </MotiView>
            );
          })}
        </AnimatePresence>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: Platform.OS === "web" ? ("fixed" as any) : "absolute",
    top: 16,
    right: 16,
    zIndex: 9999,
    gap: 10,
    alignItems: "flex-end",
    maxWidth: 380,
  },
  toast: {
    width: 360,
    maxWidth: "100%",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
    ...(Platform.OS === "web" ? ({ boxShadow: "0px 16px 32px rgba(15,23,42,0.14)" } as any) : null),
  },
  toastInner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  iconBubble: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontWeight: "700", fontSize: 13.5 },
  body: { marginTop: 2, fontSize: 12.5, fontWeight: "500", lineHeight: 17 },
  closeBtn: { padding: 2 },
});
