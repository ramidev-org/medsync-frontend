import { logClientError } from "@/services/backend";
import { router, usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  children: React.ReactNode;
  route?: string;
};

type State = {
  error: Error | null;
};

class ErrorBoundaryClass extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
    void logClientError(error.message, {
      stack: info.componentStack ?? error.stack,
      route: this.props.route,
    });
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleGoHome = () => {
    this.setState({ error: null });
    router.replace("/dashboard");
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error.message || "An unexpected error occurred."}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={this.handleGoHome}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go to dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <ErrorBoundaryClass route={pathname}>{children}</ErrorBoundaryClass>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: "#F4F7FB",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    maxWidth: 420,
  },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E1EE",
  },
  secondaryButtonText: {
    color: "#2563EB",
  },
});
