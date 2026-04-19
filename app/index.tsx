"use client";

import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  Layout,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/**
 * Cal.com-ish feel:
 * - sticky header w/ subtle blur
 * - hero = animated “scheduling UI” illustration (no static image)
 * - section spacing + cards
 * - consistent reveal animations across sections
 * - click nav items -> smooth scroll to section
 */

const navItems = [
  { label: "Features", id: "features" },
  { label: "Testimonials", id: "testimonials" },
  { label: "FAQ", id: "faq" },
  { label: "Contact", id: "contact" },
];

// You can keep these for later (used in sections)
const DASHBOARD_IMAGE =
  "https://images.unsplash.com/photo-1676364424409-e87919caffe1?auto=format&fit=crop&w=1600&q=80";

const features = [
  {
    title: "Appointment Management",
    description: "Smart scheduling with automated reminders",
    image:
      "https://images.unsplash.com/photo-1633526543814-9718c8922b7a?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Patient Records",
    description: "Complete digital medical files",
    image:
      "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Billing & Payments",
    description: "Invoicing and payment tracking",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Prescription Printing",
    description: "Quick prescription generation",
    image:
      "https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=1600&q=80",
  },
];

const testimonials = [
  {
    name: "Dr. Sarah Mitchell",
    specialty: "General Practitioner",
    text: "For 2 years the software has made my work and consultations easier. Professional team.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Dr. James Parker",
    specialty: "Pediatrics",
    text: "Ergonomic software with the most useful features, plus a technical team that listens and is very available.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Dr. Emily Roberts",
    specialty: "Neurophysiology",
    text: "Facilitates many tasks and a dynamic, professional team. Congratulations.",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Urology",
    text: "Always listening, efficient support. Facilitates management and good patient care.",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
    {
    name: "Dr. Samir Ahmed",
    specialty: "Urology",
    text: "Always listening, efficient support. Facilitates management and good patient care.",
    avatar: "https://randomuser.me/api/portraits/men/74.jpg",
  },
];

const specialties = [
  "General Practitioner",
  "Pediatrics",
  "Orthopedist",
  "Ophthalmologist",
  "Cardiology",
  "Urology",
  "Dermatology",
  "Neurology",
];

const stats = [
  { number: "900+", label: "Doctors" },
  { number: "4.35M+", label: "Patients" },
  { number: "32+", label: "Regions" },
];

const faqItems = [
  {
    question: "Is my data secure?",
    answer: "Yes, all data is encrypted and securely stored with regular backups.",
  },
  {
    question: "Can I get help if I can't use certain features?",
    answer:
      "Our support team is available to assist you with any features you need help with.",
  },
  {
    question: "Is the software compatible with Mac?",
    answer: "Yes, our software works on Windows, Mac, and web browsers.",
  },
  {
    question: "How do I recover my data if I change equipment?",
    answer:
      "Your data is cloud-based and can be accessed from any device after login.",
  },
];

const MAX_WIDTH = 1200;

function Container({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <View
        style={{
          width: "100%",
          maxWidth: MAX_WIDTH,
          paddingHorizontal: 20,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.98))}
      onPressOut={() => (scale.value = withSpring(1))}
    >
      <Animated.View
        style={[
          {
            backgroundColor: "#0D6EFD",
            paddingVertical: 13,
            paddingHorizontal: 18,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 22,
            elevation: 6,
          },
          aStyle,
        ]}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          paddingVertical: 13,
          paddingHorizontal: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(13,110,253,0.35)",
          backgroundColor: "rgba(13,110,253,0.06)",
        }}
      >
        <Text
          style={{
            color: "#0D6EFD",
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  center,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <View
      style={{
        marginBottom: 26,
        alignItems: center ? "center" : "flex-start",
      }}
    >
      {eyebrow ? (
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 12,
            letterSpacing: 2,
            color: "#0D6EFD",
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: center ? 34 : 32,
          color: "#0b1220",
          textAlign: center ? "center" : "left",
          lineHeight: center ? 40 : 38,
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 16,
            color: "#556070",
            marginTop: 10,
            lineHeight: 24,
            maxWidth: 820,
            textAlign: center ? "center" : "left",
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

/** Cal-like “hero illustration” (animated UI cards + blobs) */
function ClinicHeroIllustration({ isWide }: { isWide: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, {
        duration: 5200,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [t]);

  const blob1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-10, 12]) },
      { translateX: interpolate(t.value, [0, 1], [-8, 10]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.08]) },
    ],
    opacity: 0.6,
  }));

  const blob2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [12, -12]) },
      { translateX: interpolate(t.value, [0, 1], [10, -10]) },
      { scale: interpolate(t.value, [0, 1], [1.05, 1]) },
    ],
    opacity: 0.45,
  }));

  const cardA = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, -12]) },
      { rotate: `${interpolate(t.value, [0, 1], [-1.2, 1.2])}deg` },
    ],
  }));

  const cardB = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [0, 14]) },
      { rotate: `${interpolate(t.value, [0, 1], [1.0, -1.0])}deg` },
    ],
  }));

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 1.1]) }],
    opacity: interpolate(t.value, [0, 1], [0.6, 1]),
  }));

  const ekg = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          t.value,
          [0, 1],
          [0, isWide ? 240 : 160]
        ),
      },
    ],
  }));

  return (
    <View
      style={{
        width: "100%",
        height: isWide ? 420 : 300,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(2,6,23,0.10)",
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 28,
        elevation: 7,
      }}
    >
      {/* Animated blobs */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 999,
            backgroundColor: "rgba(13,110,253,0.18)",
            top: -140,
            left: -140,
          },
          blob1,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 999,
            backgroundColor: "rgba(56,189,248,0.16)",
            bottom: -160,
            right: -140,
          },
          blob2,
        ]}
      />

      {/* Pulse dot */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 18,
            right: 18,
            width: 12,
            height: 12,
            borderRadius: 999,
            backgroundColor: "#22c55e",
          },
          pulse,
        ]}
      />

      {/* Main “scheduling UI” card */}
      <View
        style={{
          position: "absolute",
          top: isWide ? 42 : 26,
          left: isWide ? 42 : 18,
          right: isWide ? 42 : 18,
          height: isWide ? 280 : 200,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.95)",
          borderWidth: 1,
          borderColor: "rgba(2,6,23,0.10)",
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              backgroundColor: "#0D6EFD",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>
              Dr
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                color: "#0b1220",
                fontSize: 14,
              }}
            >
              Consultation
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              Tue • 15 min • Online
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "rgba(13,110,253,0.10)",
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#0D6EFD",
              }}
            >
              Available
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 14, flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: "#0b1220",
              }}
            >
              May 2026
            </Text>

            <View
              style={{
                marginTop: 10,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {Array.from({ length: 14 }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: isWide ? 34 : 26,
                    height: isWide ? 30 : 24,
                    borderRadius: 8,
                    backgroundColor:
                      i === 8 ? "#0D6EFD" : "rgba(2,6,23,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 11,
                      color: i === 8 ? "#fff" : "#334155",
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ width: isWide ? 160 : 120, gap: 8 }}>
            {["09:30", "10:00", "10:30", "11:00"].map((time, idx) => (
              <View
                key={time}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor:
                    idx === 1
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(2,6,23,0.06)",
                  borderWidth: 1,
                  borderColor:
                    idx === 1
                      ? "rgba(34,197,94,0.35)"
                      : "rgba(2,6,23,0.08)",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: "#0b1220",
                  }}
                >
                  {time}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* tiny moving “EKG” bar */}
        <View
          style={{
            marginTop: 14,
            height: 8,
            borderRadius: 999,
            backgroundColor: "rgba(13,110,253,0.10)",
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: 8,
                width: "35%",
                borderRadius: 999,
                backgroundColor: "rgba(13,110,253,0.45)",
              },
              ekg,
            ]}
          />
        </View>
      </View>

      {/* Floating mini cards */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: isWide ? 38 : 18,
            left: isWide ? 56 : 16,
            width: isWide ? 230 : 180,
            borderRadius: 16,
            padding: 14,
            backgroundColor: "rgba(255,255,255,0.92)",
            borderWidth: 1,
            borderColor: "rgba(2,6,23,0.10)",
          },
          cardA,
        ]}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            color: "#0b1220",
          }}
        >
          Reminder sent
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          Patient confirmed ✅
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: isWide ? 22 : 8,
            right: isWide ? 56 : 16,
            width: isWide ? 230 : 180,
            borderRadius: 16,
            padding: 14,
            backgroundColor: "rgba(255,255,255,0.92)",
            borderWidth: 1,
            borderColor: "rgba(2,6,23,0.10)",
          },
          cardB,
        ]}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            color: "#0b1220",
          }}
        >
          Next appointment
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          Wed • 10:00 • Pediatrics
        </Text>
      </Animated.View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [activeFaq, setActiveFaq] = useState<number | null>(0);


  

  // Smooth scroll support
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({
    features: 0,
    testimonials: 0,
    faq: 0,
    contact: 0,
  }).current;

  // Optional: active nav highlight
  const [activeNav, setActiveNav] = useState<string>("features");

  const isWide = useMemo(() => {
    const w = Dimensions.get("window").width;
    return w >= 900;
  }, []);

  if (!fontsLoaded) return null;

  const scrollToSection = (id: string) => {
    const y = sectionY[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;

    // simple active section detection
    const entries = Object.entries(sectionY).sort((a, b) => a[1] - b[1]);
    let current = entries[0]?.[0] ?? "features";
    for (const [id, top] of entries) {
      if (y + 120 >= top) current = id;
    }
    if (current !== activeNav) setActiveNav(current);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#fff" }}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled
      scrollEventThrottle={16}
      onScroll={onScroll}
    >
      {/* HEADER */}
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.86)",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(15,23,42,0.08)",
          paddingVertical: 14,
          ...(Platform.OS === "web"
            ? ({
                position: "sticky" as any,
                top: 0,
                zIndex: 50,
                backdropFilter: "blur(10px)",
              } as any)
            : null),
        }}
      >
        <Container>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 22,
                color: "#0D6EFD",
              }}
            >
              MedSync
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {navItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <Pressable key={item.id} onPress={() => scrollToSection(item.id)}>
                    <View
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        backgroundColor: isActive ? "rgba(13,110,253,0.10)" : "transparent",
                        borderWidth: 1,
                        borderColor: isActive ? "rgba(13,110,253,0.18)" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                          color: isActive ? "#0D6EFD" : "#334155",
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              <View style={{ width: 10 }} />

              <SecondaryButton label="SIGN IN" onPress={() => router.push("/login")} />
              <PrimaryButton label="SIGN UP NOW" onPress={() => router.push("/signup")} />
            </View>
          </View>
        </Container>
      </View>

      {/* HERO */}
      <View style={{ backgroundColor: "#f8fafc" }}>
        <Container>
          <View style={{ paddingVertical: 64 }}>
            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 28,
              }}
            >
              <Animated.View entering={FadeInUp.duration(650)} style={{ flex: 1 }}>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(13,110,253,0.10)",
                    borderColor: "rgba(13,110,253,0.20)",
                    borderWidth: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    marginBottom: 14,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 12,
                      color: "#0D6EFD",
                    }}
                  >
                    Scheduling • Patient records • Billing
                  </Text>
                </View>

                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: isWide ? 52 : 40,
                    color: "#0b1220",
                    lineHeight: isWide ? 58 : 46,
                  }}
                >
                  Modern clinic management,
                  {"\n"}made simple.
                </Text>

                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 16,
                    color: "#556070",
                    lineHeight: 26,
                    marginTop: 14,
                    maxWidth: 560,
                  }}
                >
                  A Cal.com-style experience for your clinic: beautifully designed scheduling,
                  automated reminders, and tools that keep consultations flowing.
                </Text>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                  <PrimaryButton label="GET STARTED" onPress={() => router.push("/signup")} />
                  <SecondaryButton label="SEE FEATURES" onPress={() => scrollToSection("features")} />
                </View>

                <View style={{ flexDirection: "row", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
                  {["Fast onboarding", "Secure cloud", "Support included"].map((t) => (
                    <View
                      key={t}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        backgroundColor: "rgba(2,6,23,0.04)",
                        borderWidth: 1,
                        borderColor: "rgba(2,6,23,0.06)",
                      }}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 999,
                          backgroundColor: "#22c55e",
                        }}
                      />
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#334155" }}>
                        {t}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(650)} style={{ flex: 1, width: "100%" }}>
                <ClinicHeroIllustration isWide={isWide} />
              </Animated.View>
            </View>
          </View>
        </Container>
      </View>

      {/* DESCRIPTION */}
      <Container>
        <Animated.View entering={FadeInUp.delay(80).duration(650)} style={{ paddingVertical: 64 }}>
          <SectionHeader
            eyebrow="CLINIC MANAGEMENT"
            title="Everything you need to run your clinic"
            description="Simple to learn, powerful to use. Designed for day-to-day operations, consultations, billing, and patient follow-up."
          />

          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <View style={{ flex: 1, gap: 12 }}>
              {[
                "Appointment Management",
                "Consultation Management",
                "Patient Files",
                "Payment Management",
                "Printing",
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 99,
                      backgroundColor: "#0D6EFD",
                    }}
                  />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: "#334155" }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <Animated.View
              entering={FadeInUp.delay(120).duration(650)}
              style={{
                flex: 1,
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(2,6,23,0.10)",
                backgroundColor: "#fff",
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 20,
                elevation: 6,
              }}
            >
              <Image
                source={{ uri: DASHBOARD_IMAGE }}
                style={{ width: "100%", height: 320 }}
                contentFit="cover"
                transition={250}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </Container>

      {/* FEATURES */}
      <View
        onLayout={(e) => {
          sectionY.features = e.nativeEvent.layout.y;
        }}
        style={{ backgroundColor: "#f8fafc" }}
      >
        <Container>
          <Animated.View entering={FadeInUp.delay(120).duration(650)} style={{ paddingVertical: 64 }}>
            <SectionHeader
              center
              title="Features built for real clinics"
              description="A clean workflow, fast actions, and tools that feel professional."
            />

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 16,
              }}
            >
              {features.map((f, idx) => (
                <Animated.View
                  key={f.title}
                  entering={FadeInUp.delay(140 + idx * 70).duration(650)}
                  style={{
                    width: 292,
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(2,6,23,0.10)",
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 18,
                    elevation: 5,
                  }}
                >
                  <Image
                    source={{ uri: f.image }}
                    style={{ width: "100%", height: 165 }}
                    contentFit="cover"
                    transition={250}
                  />
                  <View style={{ padding: 16 }}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#0b1220" }}>
                      {f.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Inter_400Regular",
                        fontSize: 14,
                        color: "#556070",
                        marginTop: 8,
                        lineHeight: 22,
                      }}
                    >
                      {f.description}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            {/* Specialties chips (Cal-like “pill list”) */}
            <Animated.View entering={FadeInUp.delay(360).duration(650)} style={{ marginTop: 34 }}>
              <SectionHeader
                center
                eyebrow="SPECIALTIES"
                title="Adapted to all specialties"
                description="Built to support any medical practice with a flexible workflow."
              />

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {specialties.map((s) => (
                  <View
                    key={s}
                    style={{
                      backgroundColor: "rgba(13,110,253,0.08)",
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: "rgba(13,110,253,0.14)",
                    }}
                  >
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#0D6EFD" }}>
                      {s}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        </Container>
      </View>

      {/* STATS */}
      <View style={{ backgroundColor: "#0D6EFD" }}>
        <Container>
          <Animated.View entering={FadeInUp.delay(200).duration(650)} style={{ paddingVertical: 46 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              {stats.map((s, idx) => (
                <Animated.View
                  key={s.label}
                  entering={FadeInUp.delay(220 + idx * 60).duration(650)}
                  style={{ alignItems: "center" }}
                >
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 44, color: "#fff" }}>
                    {s.number}
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(255,255,255,0.92)" }}>
                    {s.label}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </Container>
      </View>

      {/* TESTIMONIALS */}
<View
  onLayout={(e) => {
    sectionY.testimonials = e.nativeEvent.layout.y;
  }}
>
  <Container>
    <Animated.View entering={FadeInUp.delay(240).duration(650)} style={{ paddingVertical: 64 }}>
      <SectionHeader center eyebrow="TESTIMONIALS" title="More than 900 doctors trust us" />

      {/* ✅ Web fix wrapper */}
      <View
        style={{
          width: "100%",
          // allow web horizontal scroll (trackpad/mouse)
          ...(Platform.OS === "web"
            ? ({
                overflowX: "auto",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
                // important: allow horizontal pan on touch devices
                touchAction: "pan-x" as any,
              } as any)
            : null),
        }}
        // ✅ ensure horizontal drag doesn't get swallowed by vertical scroll
        onStartShouldSetResponderCapture={(evt) => {
          if (Platform.OS !== "web") return false;

          const t = evt.nativeEvent as any;
          // if user starts dragging mostly horizontally, capture it
          return Math.abs(t.pageX - (t.locationX ?? t.pageX)) >
            Math.abs(t.pageY - (t.locationY ?? t.pageY));
        }}
      >
        <FlatList
          horizontal
          data={testimonials}
          keyExtractor={(i) => i.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 6, gap: 14 }}

          // ✅ keep these
          nestedScrollEnabled
          scrollEnabled
          directionalLockEnabled
          alwaysBounceHorizontal={false}

          // ✅ helps web list layout
          style={{ flexGrow: 0 }}

          // ✅ make sure it *needs* scrolling
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(260 + index * 70).duration(650)}
              style={{
                width: isWide ? 420 : 340, // make cards bigger so overflow is guaranteed
                backgroundColor: "#f8fafc",
                padding: 18,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(2,6,23,0.10)",
                marginRight: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Image
                  source={{ uri: item.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 999 }}
                  contentFit="cover"
                  transition={150}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#0b1220" }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#0D6EFD" }}>
                    {item.specialty}
                  </Text>
                </View>
              </View>

              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, color: "#334155" }}>
                “{item.text}”
              </Text>
            </Animated.View>
          )}
        />
      </View>

      <Animated.View entering={FadeInUp.delay(520).duration(650)} style={{ alignItems: "center", marginTop: 10 }}>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#64748b" }}>
          Swipe horizontally to explore →
        </Text>
      </Animated.View>
    </Animated.View>
  </Container>
</View>


      {/* FAQ */}
      <View
        onLayout={(e) => {
          sectionY.faq = e.nativeEvent.layout.y;
        }}
        style={{ backgroundColor: "#f8fafc" }}
      >
        <Container>
          <Animated.View entering={FadeInUp.delay(280).duration(650)} style={{ paddingVertical: 64 }}>
            <SectionHeader center title="Frequently Asked Questions" />

            <View style={{ gap: 12, maxWidth: 860, width: "100%", alignSelf: "center" as any }}>
              {faqItems.map((f, idx) => {
                const open = activeFaq === idx;
                return (
                  <Animated.View
                    key={f.question}
                    layout={Layout.springify()}
                    entering={FadeInUp.delay(300 + idx * 60).duration(650)}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: "rgba(2,6,23,0.10)",
                      overflow: "hidden",
                    }}
                  >
                    <Pressable onPress={() => setActiveFaq(open ? null : idx)}>
                      <View
                        style={{
                          padding: 18,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            fontSize: 15,
                            color: "#0b1220",
                            flex: 1,
                          }}
                        >
                          {f.question}
                        </Text>
                        <Text style={{ fontFamily: "Inter_600SemiBold", color: "#0D6EFD" }}>
                          {open ? "–" : "+"}
                        </Text>
                      </View>
                    </Pressable>

                    {open ? (
                      <Animated.View entering={FadeInDown.duration(220)} style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#556070", lineHeight: 22 }}>
                          {f.answer}
                        </Text>
                      </Animated.View>
                    ) : null}
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </Container>
      </View>

      {/* CTA */}
      <View style={{ backgroundColor: "#0D6EFD" }}>
        <Container>
          <Animated.View
            entering={FadeInUp.delay(320).duration(650)}
            style={{ paddingVertical: 64, alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                letterSpacing: 2,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              REGISTRATION FORM
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 38,
                color: "#fff",
                textAlign: "center",
                marginTop: 12,
                lineHeight: 44,
              }}
            >
              Sign Up Now
            </Text>

            <View style={{ marginTop: 20 }}>
              <Pressable onPress={() => router.push("/signup")}>
                <View
                  style={{
                    backgroundColor: "#fff",
                    paddingVertical: 16,
                    paddingHorizontal: 34,
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#0D6EFD" }}>
                    GET STARTED
                  </Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </Container>
      </View>

      {/* FOOTER / CONTACT */}
      <View
        onLayout={(e) => {
          sectionY.contact = e.nativeEvent.layout.y;
        }}
        style={{ backgroundColor: "#0b1220" }}
      >
        <Container>
          <Animated.View entering={FadeInUp.delay(260).duration(650)} style={{ paddingVertical: 54 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
              <View style={{ minWidth: 260, flex: 1 }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 20, color: "#fff", marginBottom: 12 }}>
                  Contact Us
                </Text>

                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94a3b8", marginBottom: 6 }}>
                  +1 (555) 123-4567
                </Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94a3b8", marginBottom: 6 }}>
                  +1 (555) 987-6543
                </Text>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94a3b8", marginBottom: 18 }}>
                  contact@medsync.com
                </Text>

                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff", marginBottom: 10 }}>
                  Social Networks
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  {["Facebook", "Instagram", "X"].map((name) => (
                    <Pressable key={name}>
                      <View
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 999,
                          backgroundColor: "rgba(13,110,253,0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" }}>{name}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ marginTop: 32, paddingTop: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
              <Text style={{ textAlign: "center", fontFamily: "Inter_400Regular", fontSize: 13, color: "#94a3b8" }}>
                © Copyright 2026 MedSync. All rights reserved.
              </Text>
            </View>
          </Animated.View>
        </Container>
      </View>
    </ScrollView>
  );
}
