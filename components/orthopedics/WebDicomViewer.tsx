import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";

export function WebDicomViewer({ theme }: { theme: any }) {
  return (
    <View style={{ padding: 14, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.surface }}>
      <Text style={{ fontWeight: "900", color: theme.colors.text }}>DICOM viewer (web only)</Text>
      <Text style={{ marginTop: 6, fontWeight: "700", color: theme.colors.textSecondary }}>
        Cornerstone3D integration with Expo/Metro needs extra bundler setup (it pulls in webpack/worker-loader). For now, use OHIF (external).
      </Text>
      <TouchableOpacity
        onPress={() => Linking.openURL("https://viewer.ohif.org/")}
        style={{ marginTop: 10, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start" }}
      >
        <Text style={{ fontWeight: "900", color: theme.colors.primary }}>Open OHIF Demo</Text>
      </TouchableOpacity>
    </View>
  );
}
