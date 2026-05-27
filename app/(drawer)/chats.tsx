import { useAuth } from "@/contexts/auth_context";
import { callRpc } from "@/services/backend";
import { getConversations, getOrCreateDirectConversation } from "@/services/chats.services";
import type { UsersMetadataRow } from "@/services/backend.types";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function ChatsEntryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const hasNavigatedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasNavigatedRef.current) return;
    let cancelled = false;
    const run = async () => {
      if (!user?.id) return;
      try {
        const [staffRes, convRes] = await Promise.all([
          callRpc<any, Record<string, unknown>>("rpc_get_clinic_staff", { p_requester_id: user.id }),
          getConversations({ requesterId: user.id, itemsPerPage: 100 }),
        ]);
        if (cancelled) return;

        const conversationRows = convRes?.conversations ?? [];
        if (conversationRows.length > 0) {
          hasNavigatedRef.current = true;
          router.replace(`/chats/${conversationRows[0].id}` as any);
          return;
        }

        const staffRows = (Array.isArray(staffRes) ? staffRes : []) as UsersMetadataRow[];
        const firstTeammate = staffRows.find((entry) => entry?.id && entry.id !== user.id);
        if (firstTeammate?.id) {
          const id = await getOrCreateDirectConversation({
            requesterId: user.id,
            otherUserId: firstTeammate.id,
          });
          if (!cancelled) {
            hasNavigatedRef.current = true;
            router.replace(`/chats/${id}` as any);
          }
          return;
        }

        hasNavigatedRef.current = true;
        router.replace("/notifications");
      } catch {
        if (!cancelled) {
          hasNavigatedRef.current = true;
          router.replace("/notifications");
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router, user?.id]);

  return (
    <View style={styles.loaderWrap}>
      <ActivityIndicator size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
});
