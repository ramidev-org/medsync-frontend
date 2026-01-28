"use client";

import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const navItems = ["Features", "Pricing", "Testimonials", "FAQ", "Contact"];

const features = [
  {
    title: "Appointment Management",
    icon: "📅",
    description: "Smart scheduling with automated reminders",
  },
  {
    title: "Patient Records",
    icon: "📋",
    description: "Complete digital medical files",
  },
  {
    title: "Billing & Payments",
    icon: "💰",
    description: "Invoicing and payment tracking",
  },
  {
    title: "Prescription Printing",
    icon: "🖨️",
    description: "Quick prescription generation",
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

const testimonials = [
  {
    name: "Dr. Sarah Mitchell",
    specialty: "General Practitioner",
    text: "I am satisfied, for 2 years the software has made my work and consultations easier, thank you, you are a professional team.",
  },
  {
    name: "Dr. James Parker",
    specialty: "Pediatrics",
    text: "Very nice experience with an ergonomic software with the most useful features for a practitioner, not to mention a technical team that listens and is very available.",
  },
  {
    name: "Dr. Emily Roberts",
    specialty: "Neurophysiology",
    text: "Very happy and satisfied, software facilitating many tasks and a very dynamic and professional team, congratulations.",
  },
  {
    name: "Dr. Michael Chen",
    specialty: "Urology",
    text: "Very professional team. Always listening, efficient, permanent support. Software facilitating management and good patient care.",
  },
];

const stats = [
  { number: "900+", label: "Doctors" },
  { number: "4.35M+", label: "Patients" },
  { number: "32+", label: "Regions" },
];

const faqItems = [
  {
    question: "Is my data secure?",
    answer:
      "Yes, all data is encrypted and securely stored with regular backups.",
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

// Subtle fade-in animation only
const FadeIn = ({ children, delay = 0 }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>
  );
};

export default function ClinicManagementLanding() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  if (!fontsLoaded) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#fff" }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 24,
            color: "#0D6EFD",
          }}
        >
          MedSync
        </Text>
        <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
          {navItems.map((item) => (
            <Pressable key={item}>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  color: "#495057",
                }}
              >
                {item}
              </Text>
            </Pressable>
          ))}

          {/* LOGIN / SIGN IN BUTTON */}
          <Pressable
            onPress={() => router.push("/login")}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#0D6EFD",
            }}
          >
            <Text
              style={{
                color: "#0D6EFD",
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              SIGN IN
            </Text>
          </Pressable>

          {/* SIGN UP BUTTON */}
          <Pressable
            onPress={() => router.push("/signup")}
            style={{
              backgroundColor: "#0D6EFD",
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              SIGN UP NOW
            </Text>
          </Pressable>
        </View>

      </View>

      {/* HERO */}
      <FadeIn>
        <View
          style={{
            paddingVertical: 80,
            paddingHorizontal: 20,
            backgroundColor: "#f8f9fa",
          }}
        >
          <View
            style={{
              maxWidth: 1200,
              marginHorizontal: "auto",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <View style={{ flex: 1, minWidth: 300, paddingRight: 40 }}>
              <Text
                style={{
                  fontSize: 48,
                  fontFamily: "Inter_600SemiBold",
                  marginBottom: 24,
                  color: "#212529",
                  lineHeight: 58,
                }}
              >
                HELLO DOCTOR,
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_400Regular",
                  color: "#6c757d",
                  marginBottom: 32,
                  lineHeight: 28,
                }}
              >
                Dear doctors, improve your efficiency and practice with our
                cutting-edge medical software. Join our community of doctors
                using the latest technology to improve their work and provide
                the best care to their patients.
              </Text>
              <Pressable
                onPress={() => router.push("/signup")}
                style={{
                  backgroundColor: "#0D6EFD",
                  paddingVertical: 16,
                  paddingHorizontal: 32,
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                  }}
                >
                  SIGN UP NOW
                </Text>
              </Pressable>
            </View>
            <View
              style={{
                flex: 1,
                minWidth: 300,
                alignItems: "center",
                paddingTop: 40,
              }}
            >
              <Text style={{ fontSize: 120 }}>👨‍⚕️</Text>
            </View>
          </View>
        </View>
      </FadeIn>

      {/* DESCRIPTION */}
      <FadeIn delay={100}>
        <View style={{ paddingVertical: 80, paddingHorizontal: 40 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_600SemiBold",
              color: "#0D6EFD",
              letterSpacing: 2,
              marginBottom: 16,
            }}
          >
            CLINIC MANAGEMENT
          </Text>
          <Text
            style={{
              fontSize: 36,
              fontFamily: "Inter_600SemiBold",
              marginBottom: 24,
              color: "#212529",
            }}
          >
            Description
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              color: "#6c757d",
              marginBottom: 32,
              lineHeight: 26,
              maxWidth: 800,
            }}
          >
            Our clinic management software is adapted to all specialties, simple
            to use and easy to learn. It is designed with several options that
            are in alignment with the strategic and operational management of an
            office or clinic.
          </Text>
          <View style={{ gap: 12, marginBottom: 40, paddingLeft: 8 }}>
            {[
              "Appointment Management",
              "Consultation Management",
              "Patient Files",
              "Payment Management",
              "Printing",
            ].map((item, i) => (
              <View
                key={i}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Text style={{ fontSize: 20, color: "#0D6EFD" }}>•</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                    color: "#495057",
                  }}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
          <View
            style={{
              backgroundColor: "#f8f9fa",
              padding: 40,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 80 }}>💻</Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: "#212529",
                marginTop: 16,
              }}
            >
              Software Screenshot Preview
            </Text>
          </View>
        </View>
      </FadeIn>

      {/* FEATURES */}
      <FadeIn delay={200}>
        <View
          style={{
            paddingVertical: 80,
            paddingHorizontal: 20,
            backgroundColor: "#f8f9fa",
          }}
        >
          <Text
            style={{
              fontSize: 36,
              fontFamily: "Inter_600SemiBold",
              textAlign: "center",
              marginBottom: 60,
              color: "#212529",
            }}
          >
            Our Offers
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 24,
            }}
          >
            {features.map((feature, index) => (
              <View
                key={index}
                style={{
                  width: 280,
                  backgroundColor: "#fff",
                  padding: 32,
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 15,
                  elevation: 5,
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: 16 }}>
                  {feature.icon}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 18,
                    marginBottom: 12,
                    color: "#212529",
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    color: "#6c757d",
                    lineHeight: 24,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      {/* SPECIALTIES */}
      <FadeIn delay={300}>
        <View style={{ paddingVertical: 80, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_600SemiBold",
              color: "#0D6EFD",
              letterSpacing: 2,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            SPECIALTIES
          </Text>
          <Text
            style={{
              fontSize: 36,
              fontFamily: "Inter_600SemiBold",
              textAlign: "center",
              marginBottom: 24,
              color: "#212529",
            }}
          >
            Adapted to all specialties
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              textAlign: "center",
              marginBottom: 60,
              color: "#6c757d",
              lineHeight: 26,
            }}
          >
            Optimize your medical practice with our clinic management software
            adapted to all specialties. Simplify administrative management,
            appointment scheduling and patient follow-up.
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 16,
            }}
          >
            {specialties.map((specialty, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#e7f3ff",
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: "#0D6EFD",
                  }}
                >
                  {specialty}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      {/* STATS */}
      <FadeIn delay={400}>
        <View
          style={{
            paddingVertical: 60,
            paddingHorizontal: 20,
            backgroundColor: "#0D6EFD",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: 40,
            }}
          >
            {stats.map((stat, i) => (
              <View key={i} style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 52,
                    fontFamily: "Inter_600SemiBold",
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  +{stat.number}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_400Regular",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      {/* TESTIMONIALS */}
      <FadeIn delay={500}>
        <View style={{ paddingVertical: 80, paddingHorizontal: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_600SemiBold",
              color: "#0D6EFD",
              letterSpacing: 2,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            TESTIMONIALS
          </Text>
          <Text
            style={{
              fontSize: 36,
              fontFamily: "Inter_600SemiBold",
              textAlign: "center",
              marginBottom: 60,
              color: "#212529",
            }}
          >
            More than +900 doctors trust us
          </Text>
          <FlatList
            horizontal
            data={testimonials}
            keyExtractor={(item) => item.name}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 24 }}
            renderItem={({ item }) => (
              <View
                style={{
                  width: 340,
                  backgroundColor: "#f8f9fa",
                  padding: 32,
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 15,
                  elevation: 5,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: "#0D6EFD",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>👤</Text>
                </View>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 18,
                    marginBottom: 4,
                    color: "#212529",
                  }}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    color: "#0D6EFD",
                    marginBottom: 16,
                  }}
                >
                  {item.specialty}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    lineHeight: 24,
                    color: "#495057",
                  }}
                >
                  "{item.text}"
                </Text>
              </View>
            )}
          />
        </View>
      </FadeIn>

      {/* FAQ */}
      <FadeIn delay={600}>
        <View
          style={{
            paddingVertical: 80,
            paddingHorizontal: 20,
            backgroundColor: "#f8f9fa",
          }}
        >
          <Text
            style={{
              fontSize: 36,
              fontFamily: "Inter_600SemiBold",
              textAlign: "center",
              marginBottom: 60,
              color: "#212529",
            }}
          >
            Frequently Asked Questions
          </Text>
          <View style={{ maxWidth: 800, marginHorizontal: "auto", gap: 16 }}>
            {faqItems.map((item, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: "#fff",
                  padding: 24,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#e9ecef",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                    color: "#212529",
                    marginBottom: 12,
                  }}
                >
                  {item.question}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    color: "#6c757d",
                    lineHeight: 22,
                  }}
                >
                  {item.answer}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </FadeIn>

      {/* SIGN UP CTA */}
      <FadeIn delay={700}>
        <View
          style={{
            paddingVertical: 80,
            paddingHorizontal: 20,
            backgroundColor: "#0D6EFD",
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_600SemiBold",
                color: "rgba(255,255,255,0.9)",
                letterSpacing: 2,
                marginBottom: 16,
              }}
            >
              REGISTRATION FORM
            </Text>
            <Text
              style={{
                fontSize: 40,
                fontFamily: "Inter_600SemiBold",
                color: "#fff",
                textAlign: "center",
                marginBottom: 40,
                lineHeight: 48,
              }}
            >
              Sign Up Now
            </Text>
            <Pressable
              onPress={() => router.push("/signup")}
              style={{
                backgroundColor: "#fff",
                paddingVertical: 18,
                paddingHorizontal: 48,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#0D6EFD",
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                }}
              >
                GET STARTED
              </Text>
            </Pressable>
          </View>
        </View>
      </FadeIn>

      {/* FOOTER */}
      <View
        style={{
          backgroundColor: "#1a1a1a",
          paddingVertical: 60,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 40,
          }}
        >
          <View style={{ flex: 1, minWidth: 250 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 24,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Contact Us
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#adb5bd",
                marginBottom: 8,
              }}
            >
              📞 +1 (555) 123-4567
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#adb5bd",
                marginBottom: 8,
              }}
            >
              📞 +1 (555) 987-6543
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: "#adb5bd",
                marginBottom: 24,
              }}
            >
              ✉️ contact@MedSync.com
            </Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 16,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Social Networks
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {["📘", "📷", "🐦"].map((icon, i) => (
                <Pressable
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: "rgba(13, 110, 253, 0.2)",
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.1)",
            paddingTop: 30,
          }}
        >
          <Text
            style={{
              color: "#adb5bd",
              fontFamily: "Inter_400Regular",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            © Copyright 2026 MedSync. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
