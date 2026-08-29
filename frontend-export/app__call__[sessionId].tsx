import { PageShell } from "@/components/layout/page_shell";
import { useAuth } from "@/contexts/auth_context";
import { db } from "@/database/database_conn";
import { buildCallChannelName, fetchCallConfig } from "@/services/calling";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ActiveCallState = "connecting" | "ringing" | "in-call" | "ended";

type CallUiNotice = {
  tone: "info" | "warning" | "error";
  text: string;
};

export default function CallSessionPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    conversationId?: string;
    clinicId?: string;
    role?: "caller" | "callee";
    peerId?: string;
    peerName?: string;
    startedById?: string;
    startedBy?: string;
    receiverId?: string;
  }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const sessionId = String(params.sessionId ?? "");
  const conversationId = String(params.conversationId ?? "");
  const clinicId = String(params.clinicId ?? user?.clinic_id ?? "");
  const role = params.role === "callee" ? "callee" : "caller";
  const peerId = String(params.peerId ?? "");
  const peerName = String(params.peerName ?? "Team member");

  const channelRef = React.useRef<ReturnType<typeof db.channel> | null>(null);
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const remoteStreamRef = React.useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = React.useRef<RTCIceCandidateInit[]>([]);

  const [callState, setCallState] = React.useState<ActiveCallState>(role === "caller" ? "ringing" : "connecting");
  const [callUiNotice, setCallUiNotice] = React.useState<CallUiNotice | null>(null);
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [microphoneEnabled, setMicrophoneEnabled] = React.useState(true);
  const [localHasMicrophone, setLocalHasMicrophone] = React.useState(true);
  const [fatalError, setFatalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const lockedUrl = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem("medsync_call_lock_url", lockedUrl);
  }, []);

  const cleanupPeerConnection = React.useCallback(() => {
    try {
      channelRef.current?.unsubscribe();
    } catch {}
    channelRef.current = null;

    try {
      peerConnectionRef.current?.close();
    } catch {}
    peerConnectionRef.current = null;

    pendingIceCandidatesRef.current = [];

    try {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {}
    localStreamRef.current = null;

    try {
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {}
    remoteStreamRef.current = null;
  }, []);

  const syncMediaState = React.useCallback(() => {
    const local = localStreamRef.current;
    const audioTrack = local?.getAudioTracks?.()[0] ?? null;
    setMicrophoneEnabled(audioTrack ? audioTrack.enabled !== false : false);
    setLocalStream(local ?? null);
    setRemoteStream(remoteStreamRef.current ?? null);
  }, []);

  const sendCallEvent = React.useCallback(async (event: string, payload: Record<string, unknown>) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
  }, []);

  const flushPendingIceCandidates = React.useCallback(async () => {
    const peer = peerConnectionRef.current;
    if (!peer?.remoteDescription) return;

    const queued = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    }
  }, []);

  const handleRemoteIceCandidate = React.useCallback(async (candidate: RTCIceCandidateInit) => {
    const peer = peerConnectionRef.current;
    if (!peer) return;

    if (!peer.remoteDescription) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }

    try {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {}
  }, []);

  const createPeerConnection = React.useCallback(async () => {
    if (Platform.OS !== "web") {
      throw new Error("Calling is currently available on web only.");
    }
    if (typeof RTCPeerConnection === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      throw new Error("This browser does not support WebRTC calling.");
    }

    const { iceServers } = await fetchCallConfig();
    const peer = new RTCPeerConnection({ iceServers });
    const remoteMediaStream = new MediaStream();
    const media = await acquireLocalMedia();

    media.stream.getTracks().forEach((track) => peer.addTrack(track, media.stream));
    if (!media.hasAudioTrack) {
      peer.addTransceiver("audio", { direction: "recvonly" });
    }

    setLocalHasMicrophone(media.hasAudioTrack);
    setCallUiNotice(media.fallbackNotice ? { tone: "warning", text: media.fallbackNotice } : null);

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      void sendCallEvent("ice-candidate", {
        sessionId,
        fromUserId: user?.id || "",
        candidate: event.candidate.toJSON(),
      });
    };

    peer.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => remoteMediaStream.addTrack(track));
      remoteStreamRef.current = remoteMediaStream;
      setRemoteStream(remoteMediaStream);
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") setCallState("in-call");
      else if (state === "connecting") setCallState("connecting");
      else if (state === "failed" || state === "disconnected") {
        setCallUiNotice({ tone: "error", text: "Connection dropped. You can close this tab and try again." });
      }
    };

    peerConnectionRef.current = peer;
    localStreamRef.current = media.stream;
    remoteStreamRef.current = remoteMediaStream;
    syncMediaState();
  }, [sendCallEvent, sessionId, syncMediaState, user?.id]);

  React.useEffect(() => {
    if (!user?.id || !sessionId || !clinicId || !peerId) return;

    let cancelled = false;

    const setup = async () => {
      try {
        const channel = db.channel(buildCallChannelName(sessionId), {
          config: { broadcast: { self: true } },
        });

        channel
          .on("broadcast", { event: "accept" }, async () => {
            if (cancelled || role !== "caller" || !peerConnectionRef.current) return;
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            await sendCallEvent("offer", {
              sessionId,
              fromUserId: user.id,
              description: offer,
            });
            setCallState("connecting");
          })
          .on("broadcast", { event: "reject" }, () => {
            if (cancelled) return;
            setCallState("ended");
            setCallUiNotice({ tone: "info", text: `${peerName} declined the call.` });
          })
          .on("broadcast", { event: "offer" }, async ({ payload }) => {
            if (cancelled || role !== "callee" || !peerConnectionRef.current || !payload?.description) return;
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.description));
            await flushPendingIceCandidates();
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            await sendCallEvent("answer", {
              sessionId,
              fromUserId: user.id,
              description: answer,
            });
            setCallState("connecting");
          })
          .on("broadcast", { event: "answer" }, async ({ payload }) => {
            if (cancelled || role !== "caller" || !peerConnectionRef.current || !payload?.description) return;
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.description));
            await flushPendingIceCandidates();
          })
          .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
            if (cancelled || !payload?.candidate) return;
            await handleRemoteIceCandidate(payload.candidate as RTCIceCandidateInit);
          })
          .on("broadcast", { event: "end" }, () => {
            if (cancelled) return;
            setCallState("ended");
            setCallUiNotice({ tone: "info", text: "Call ended." });
          });

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Unable to join the call session.")), 10000);
          channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
              clearTimeout(timeout);
              resolve();
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
              clearTimeout(timeout);
              reject(new Error("Unable to subscribe to the call channel."));
            }
          });
        });

        channelRef.current = channel;
        await createPeerConnection();

        if (cancelled) return;

        if (role === "callee") {
          await sendCallEvent("accept", {
            sessionId,
            acceptedById: user.id,
            acceptedAt: new Date().toISOString(),
          });
        } else {
          setCallState("ringing");
        }
      } catch (error: any) {
        if (cancelled) return;
        setFatalError(error?.message || "Unable to start the call.");
      }
    };

    void setup();

    return () => {
      cancelled = true;
      cleanupPeerConnection();
    };
  }, [cleanupPeerConnection, clinicId, createPeerConnection, flushPendingIceCandidates, handleRemoteIceCandidate, peerId, peerName, role, sendCallEvent, sessionId, user?.id]);

  const endCurrentCall = React.useCallback(async () => {
    await sendCallEvent("end", {
      sessionId,
      endedById: user?.id || "",
      endedAt: new Date().toISOString(),
    }).catch(() => {});
    cleanupPeerConnection();
    setCallState("ended");
    setCallUiNotice({ tone: "info", text: "Call ended. You can close this tab." });
  }, [cleanupPeerConnection, sendCallEvent, sessionId, user?.id]);

  const toggleMicrophone = React.useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    syncMediaState();
  }, [syncMediaState]);

  const closeCallTab = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("medsync_call_lock_url");
      window.close();
      setTimeout(() => {
        if (conversationId) {
          router.replace(`/chats/${conversationId}` as any);
          return;
        }
        router.replace("/chats" as any);
      }, 150);
      return;
    }

    if (conversationId) {
      router.replace(`/chats/${conversationId}` as any);
      return;
    }
    router.replace("/chats" as any);
  }, [conversationId, router]);

  const localDeviceBadges = React.useMemo(() => {
    const badges: { label: string; tone: "default" | "warning" }[] = [];
    badges.push({
      label: localHasMicrophone ? (microphoneEnabled ? "Microphone on" : "Microphone muted") : "Microphone missing",
      tone: localHasMicrophone ? "default" : "warning",
    });
    return badges;
  }, [localHasMicrophone, microphoneEnabled]);

  const statusCopy =
    callState === "ringing"
      ? `Calling ${peerName}...`
      : callState === "connecting"
        ? `Connecting with ${peerName}...`
        : callState === "in-call"
          ? `Connected with ${peerName}`
          : `Call with ${peerName} ended`;

  if (fatalError) {
    return (
      <PageShell hideTopBar contentStyle={{ flex: 1, paddingTop: 18 }}>
        <View style={styles.fallbackCard}>
          <Text style={styles.fallbackTitle}>Call unavailable</Text>
          <Text style={styles.fallbackText}>{fatalError}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={closeCallTab}>
            <Text style={styles.primaryBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </PageShell>
    );
  }

  return (
    <PageShell hideTopBar scrollable={false} contentStyle={{ flex: 1, paddingBottom: 12, paddingTop: 18 }}>
      <View style={styles.page}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.eyebrow}>Audio call</Text>
            <Text style={styles.headerTitle}>{peerName}</Text>
            <Text style={styles.headerSubtitle}>{statusCopy}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => { void endCurrentCall().finally(closeCallTab); }}>
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.dangerBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.shell}>
          <View style={styles.callHeader}>
            <View style={styles.callHeaderCopy}>
              <Text style={styles.callTitle}>Secure audio call</Text>
              <Text style={styles.callSubtitle}>{statusCopy}</Text>
            </View>
            <View style={styles.callDeviceRow}>
              {localDeviceBadges.map((badge) => (
                <View key={badge.label} style={[styles.callDeviceBadge, badge.tone === "warning" ? styles.callDeviceBadgeWarning : null]}>
                  <Text style={[styles.callDeviceBadgeText, badge.tone === "warning" ? styles.callDeviceBadgeTextWarning : null]}>
                    {badge.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.callHeaderActions}>
              <TouchableOpacity
                style={[styles.callControlBtn, !localHasMicrophone ? styles.callControlBtnDisabled : null]}
                onPress={toggleMicrophone}
                disabled={!localHasMicrophone}
              >
                <Ionicons name={microphoneEnabled ? "mic-outline" : "mic-off-outline"} size={18} color="#3158A8" />
              </TouchableOpacity>
            </View>
          </View>

          {callUiNotice ? (
            <View style={[styles.callNotice, callUiNotice.tone === "warning" ? styles.callNoticeWarning : null, callUiNotice.tone === "error" ? styles.callNoticeError : null]}>
              <Ionicons
                name={callUiNotice.tone === "warning" ? "warning-outline" : callUiNotice.tone === "error" ? "alert-circle-outline" : "information-circle-outline"}
                size={16}
                color={callUiNotice.tone === "warning" ? "#B45309" : callUiNotice.tone === "error" ? "#B91C1C" : "#3158A8"}
              />
              <Text style={[styles.callNoticeText, callUiNotice.tone === "error" ? styles.callNoticeTextError : null]}>{callUiNotice.text}</Text>
            </View>
          ) : null}

          <View style={styles.callStage}>
            <CallMediaTile
              title="You"
              subtitle={!localHasMicrophone ? "Listening only" : microphoneEnabled ? "Microphone on" : "Muted"}
              stream={localStream}
              muted
              styles={styles}
              fallbackName={user?.fullname || user?.email || "You"}
              emptyLabel={!localHasMicrophone ? "No microphone detected on this device" : undefined}
            />
            <CallMediaTile
              title={peerName}
              subtitle={callState === "in-call" ? "Live" : "Waiting for media"}
              stream={remoteStream}
              styles={styles}
              fallbackName={peerName}
            />
          </View>
        </View>
      </View>
    </PageShell>
  );
}

function CallMediaTile({
  title,
  subtitle,
  stream,
  styles,
  fallbackName,
  emptyLabel,
  muted = false,
}: {
  title: string;
  subtitle: string;
  stream: MediaStream | null;
  styles: ReturnType<typeof createStyles>;
  fallbackName: string;
  emptyLabel?: string;
  muted?: boolean;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const avatarPalette = React.useMemo(() => getAvatarPalette(fallbackName), [fallbackName]);

  React.useEffect(() => {
    const element = audioRef.current;
    if (!element || !stream || muted) return;
    element.srcObject = stream;
    void element.play().catch(() => {});
    return () => {
      element.srcObject = null;
    };
  }, [muted, stream]);

  return (
    <View style={[styles.callParticipantTile, styles.callParticipantTileAudio]}>
      {!muted && stream ? <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} /> : null}
      <View style={styles.callAvatarWrap}>
        <View style={[styles.callAvatarBubble, { backgroundColor: avatarPalette.backgroundColor, borderColor: avatarPalette.borderColor }]}>
          <Text style={[styles.callAvatarText, { color: avatarPalette.color }]}>{getAvatarInitials(fallbackName)}</Text>
        </View>
        <Text style={styles.callAvatarName}>{title}</Text>
        <Text style={styles.callAvatarMeta}>{subtitle}</Text>
        {!!emptyLabel && <Text style={styles.callAvatarHint}>{emptyLabel}</Text>}
      </View>
      <View style={styles.callParticipantMeta}>
        <Text style={styles.callParticipantName} numberOfLines={1}>{title}</Text>
        <Text style={styles.callParticipantStatus}>{subtitle}</Text>
      </View>
    </View>
  );
}

async function acquireLocalMedia() {
  const attempts: { constraints: MediaStreamConstraints; fallbackNotice?: string }[] = [
    { constraints: { audio: true, video: false } },
    { constraints: { audio: false, video: false }, fallbackNotice: "Microphone not found. Joining in receive-only mode." },
  ];

  let lastError: any = null;
  for (const attempt of attempts) {
    try {
      const hasLocalTrack = !!attempt.constraints.audio || !!attempt.constraints.video;
      const stream = hasLocalTrack ? await navigator.mediaDevices.getUserMedia(attempt.constraints) : new MediaStream();
      return {
        stream,
        fallbackNotice: attempt.fallbackNotice || null,
        hasAudioTrack: stream.getAudioTracks().length > 0,
      };
    } catch (error: any) {
      lastError = error;
      const name = String(error?.name || "");
      const retryable =
        name === "NotFoundError" ||
        name === "DevicesNotFoundError" ||
        name === "OverconstrainedError" ||
        name === "ConstraintNotSatisfiedError";
      if (!retryable) throw error;
    }
  }
  throw lastError || new Error("Unable to access local media devices.");
}

function getAvatarInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "TM"
  );
}

function getAvatarPalette(name: string) {
  const tones = [
    { backgroundColor: "#EDF5FF", borderColor: "#CCDBF1", color: "#1D4ED8" },
    { backgroundColor: "#EAFBF4", borderColor: "#BCEBD6", color: "#047857" },
    { backgroundColor: "#F3EDFF", borderColor: "#DED2FF", color: "#7C3AED" },
    { backgroundColor: "#FFF7ED", borderColor: "#FED7AA", color: "#EA580C" },
  ] as const;

  const seed = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return tones[seed % tones.length];
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    page: {
      flex: 1,
      gap: 14,
      minHeight: 0,
    },
    headerBar: {
      paddingHorizontal: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      flexWrap: "wrap",
    },
    eyebrow: {
      color: "#3158A8",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    headerTitle: {
      marginTop: 6,
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: "700",
    },
    headerSubtitle: {
      marginTop: 4,
      color: "#64748B",
      fontSize: 13,
      fontWeight: "700",
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    dangerBtn: {
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: "#DC2626",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dangerBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    shell: {
      flex: 1,
      minHeight: 0,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "#D4E2F3",
      backgroundColor: "rgba(255,255,255,0.96)",
      overflow: "hidden",
      ...(Platform.OS === "web" ? ({ boxShadow: "0 18px 48px rgba(48,80,130,0.10)" } as any) : null),
    },
    callHeader: {
      minHeight: 78,
      paddingHorizontal: 18,
      paddingVertical: 16,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#E4EDF8",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    callHeaderCopy: {
      minWidth: 180,
      flex: 1,
    },
    callTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "700",
    },
    callSubtitle: {
      marginTop: 4,
      color: "#64748B",
      fontSize: 12,
      fontWeight: "600",
    },
    callDeviceRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      flex: 1,
      minWidth: 220,
    },
    callDeviceBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "#EEF5FF",
      borderWidth: 1,
      borderColor: "#D7E7FF",
    },
    callDeviceBadgeWarning: {
      backgroundColor: "#FFF6E6",
      borderColor: "#FCD9A4",
    },
    callDeviceBadgeText: {
      color: "#3158A8",
      fontSize: 11,
      fontWeight: "700",
    },
    callDeviceBadgeTextWarning: {
      color: "#B45309",
    },
    callHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginLeft: "auto",
    },
    callControlBtn: {
      width: 42,
      height: 42,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#D4E2F3",
      backgroundColor: "#F7FBFF",
      alignItems: "center",
      justifyContent: "center",
    },
    callControlBtnDisabled: {
      opacity: 0.45,
    },
    callNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 18,
      marginTop: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: "#EEF5FF",
      borderWidth: 1,
      borderColor: "#D7E7FF",
    },
    callNoticeWarning: {
      backgroundColor: "#FFF6E6",
      borderColor: "#FCD9A4",
    },
    callNoticeError: {
      backgroundColor: "#FEF2F2",
      borderColor: "#FECACA",
    },
    callNoticeText: {
      flex: 1,
      color: "#3158A8",
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 18,
    },
    callNoticeTextError: {
      color: "#B91C1C",
    },
    callStage: {
      flex: 1,
      minHeight: 0,
      padding: 18,
      gap: 16,
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "stretch",
      alignItems: "stretch",
      backgroundColor: "#F7FAFE",
    },
    callParticipantTile: {
      overflow: "hidden",
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "#D7E5F6",
      backgroundColor: "#FFFFFF",
    },
    callParticipantTileAudio: {
      flex: 1,
      minWidth: 320,
      minHeight: 0,
      paddingHorizontal: 24,
      paddingTop: 30,
      paddingBottom: 18,
    },
    callAvatarWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 0,
    },
    callAvatarBubble: {
      width: 108,
      height: 108,
      borderRadius: 999,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    callAvatarText: {
      fontSize: 42,
      fontWeight: "700",
    },
    callAvatarName: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    callAvatarMeta: {
      color: "#64748B",
      fontSize: 12,
      fontWeight: "600",
    },
    callAvatarHint: {
      maxWidth: 260,
      color: "#94A3B8",
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 17,
      textAlign: "center",
    },
    callParticipantMeta: {
      marginTop: 18,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.92)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      borderWidth: 1,
      borderColor: "#E4EDF8",
    },
    callParticipantName: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: "700",
    },
    callParticipantStatus: {
      color: "#64748B",
      fontSize: 11,
      fontWeight: "600",
    },
    fallbackCard: {
      marginTop: 48,
      alignSelf: "center",
      width: "100%",
      maxWidth: 540,
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#D4E2F3",
      backgroundColor: "#FFFFFF",
      gap: 12,
      ...(Platform.OS === "web" ? ({ boxShadow: "0 18px 48px rgba(48,80,130,0.10)" } as any) : null),
    },
    fallbackTitle: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: "700",
    },
    fallbackText: {
      color: "#64748B",
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 22,
    },
    primaryBtn: {
      alignSelf: "flex-start",
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: "#2563EB",
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
