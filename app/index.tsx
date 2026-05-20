import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";
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
 * - hero = animated scheduling UI illustration (no static image)
 * - section spacing + cards
 * - consistent reveal animations across sections
 * - click nav items -> smooth scroll to section
 */

const navItems = [
  { label: "Fonctionnalites", id: "features" },
  { label: "Avis medecins", id: "testimonials" },
  { label: "Tarifs", id: "pricing" },
  { label: "FAQ", id: "faq" },
  { label: "Contact", id: "contact" },
];

const features = [
  {
    title: "Agenda du medecin",
    description: "Une vue claire pour les rendez-vous, les passages spontanes et les suivis.",
    icon: "calendar-outline",
    image:
      "https://images.unsplash.com/photo-1633526543814-9718c8922b7a?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Dossiers patients",
    description: "Historique, constantes, consultations et documents retrouves rapidement.",
    icon: "folder-open-outline",
    image:
      "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Facturation simple",
    description: "Suivez les actes, factures, paiements recus et montants en attente.",
    icon: "card-outline",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Ordonnances PDF",
    description: "Imprimez ordonnances, lettres et documents avec en-tete du cabinet.",
    icon: "document-text-outline",
    image:
      "https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=1600&q=80",
  },
];

const testimonials = [
  {
    name: "Dr. Amina B.",
    specialty: "Medecine generale",
    text: "Le workflow reste simple pour un cabinet solo tout en gardant les notes, paiements et suivis bien organises.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Dr. Karim M.",
    specialty: "Dentisterie",
    text: "Les rendez-vous, traitements et paiements sont plus faciles a suivre sans passer par plusieurs carnets papier.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Dr. Lina H.",
    specialty: "Dermatologie",
    text: "Le dossier patient est pratique. Les observations et les taches de suivi restent au meme endroit.",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Dr. Samir A.",
    specialty: "Urology",
    text: "Une alternative moderne aux logiciels locaux, surtout quand on veut acces web et sauvegarde.",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
  },
    {
    name: "Dr. Nesrine T.",
    specialty: "Cardiology",
    text: "Le tableau de bord rend la journee plus lisible : visites, taches, paiements et actions patient.",
    avatar: "https://randomuser.me/api/portraits/men/74.jpg",
  },
];

const specialties = [
  "Medecine generale",
  "Pediatrie",
  "Orthopedie",
  "Ophtalmologie",
  "Cardiologie",
  "Urologie",
  "Dermatologie",
  "Neurologie",
];

const stats = [
  { value: 120, suffix: "+", label: "Cabinets cibles" },
  { value: 35000, suffix: "+", label: "Patients organises" },
  { value: 300, suffix: "+", label: "Medecins a servir" },
];

const pricingPlans = [
  {
    name: "Medecin solo",
    price: "9 900 DA",
    cadence: "/ an",
    description: "Pour un cabinet prive gere par un seul medecin.",
    icon: "person-outline",
    featured: false,
    features: ["Agenda et rendez-vous", "Dossiers patients", "Consultations et constantes", "Ordonnances et lettres", "Paiements simples"],
  },
  {
    name: "Clinique",
    price: "26 000 DA",
    cadence: "/ an",
    description: "Pour cabinet avec assistant, equipe ou plusieurs postes.",
    icon: "business-outline",
    featured: false,
    features: ["Tout le plan solo", "Medecins et assistants", "Services et facturation", "Taches partagees", "Support prioritaire"],
  },
  {
    name: "Pro",
    price: "35 000 DA",
    cadence: "/ an",
    description: "Pour les cliniques structurees avec plus d operations, de supervision et d accompagnement.",
    icon: "sparkles-outline",
    featured: true,
    features: [
      "Tout le plan clinique",
      "Multi-postes et suivi d equipe avance",
      "Rapports mensuels et annuels",
      "Journal d activite et supervision",
      "Accompagnement prioritaire au lancement",
    ],
  },
  {
    name: "Test",
    price: "0 DA",
    cadence: "10 jours",
    description: "Essai accompagne avant activation reelle du cabinet.",
    icon: "key-outline",
    featured: false,
    features: ["Demonstration complete", "Donnees exemple", "Configuration guidee", "Retour metier", "Sans engagement"],
  },
];

const faqItems = [
  {
    question: "Mes donnees patients sont-elles securisees ?",
    answer: "Le lancement production doit inclure acces strict par cabinet, sauvegardes et journal audit avant les vrais patients.",
  },
  {
    question: "Est-ce que je peux etre accompagne ?",
    answer:
      "Oui. Le lancement doit inclure une configuration guidee et un support WhatsApp pour les cabinets pilotes.",
  },
  {
    question: "Est-ce reserve aux grandes cliniques ?",
    answer: "Non. Le workflow principal est pense d abord pour un medecin seul dans un cabinet prive.",
  },
  {
    question: "Que se passe-t-il si je change ordinateur ?",
    answer:
      "En mode reel, les donnees du cabinet sont liees au compte et non a une seule machine.",
  },
];

const complianceHighlights = [
  {
    title: "Acces par role",
    description: "Medecin, assistant et administrateur avec permissions separees pour limiter les erreurs et proteger les dossiers.",
    icon: "shield-checkmark-outline",
  },
  {
    title: "Sauvegardes et tracabilite",
    description: "Journal d actions, sauvegardes planifiees et reprise plus simple avant mise en production reelle.",
    icon: "archive-outline",
  },
  {
    title: "Hebergement et confidentialite",
    description: "Preparation du cadre de confidentialite, des conditions d utilisation et des engagements de traitement des donnees.",
    icon: "document-lock-outline",
  },
];

const productScreens = [
  {
    title: "Agenda et file d attente",
    subtitle: "Vue reception + medecin pour la journee en cours",
    accent: "#0D6EFD",
    metrics: ["18 rendez-vous", "4 patients en attente", "2 rappels envoyes"],
  },
  {
    title: "Dossier patient complet",
    subtitle: "Constantes, antecedents, consultation et documents",
    accent: "#16a34a",
    metrics: ["Antecedents", "Mesures vitales", "Ordonnances PDF"],
  },
  {
    title: "Paiements et services",
    subtitle: "Facturation simple avec suivi des actes et recus",
    accent: "#f59e0b",
    metrics: ["6 paiements recus", "2 impayes", "Journal du jour"],
  },
];

const workflowSteps = [
  {
    title: "1. Setup",
    description: "Activation du cabinet, configuration de base et personnalisation des informations de pratique.",
  },
  {
    title: "2. Onboard team",
    description: "Invitation des medecins et assistants avec les bons acces selon leurs roles.",
  },
  {
    title: "3. Start consultations",
    description: "Commencez les rendez-vous, les dossiers patients, les ordonnances et les paiements dans le meme espace.",
  },
];

const audienceCards = [
  {
    title: "Medecin solo",
    description: "Pour un cabinet prive qui veut gagner du temps sur les rendez-vous, les notes et les ordonnances.",
    bullets: ["Vue simple", "Demarrage rapide", "Suivi patient centralise"],
  },
  {
    title: "Cabinet avec assistant",
    description: "Pour une organisation reception + medecin avec planning partage, paiements et coordination du flux patient.",
    bullets: ["Accueil et file d attente", "Gestion des paiements", "Taches partagees"],
  },
  {
    title: "Clinique multi-docteurs",
    description: "Pour les structures qui ont besoin de plusieurs postes, de supervision et de reporting.",
    bullets: ["Multi-postes", "Suivi equipe", "Pilotage plus avance"],
  },
];

const specialtyCards = [
  {
    title: "Dentisterie",
    description: "Suivi soins, actes, odontogramme et historique de traitement.",
    icon: "medkit-outline",
    tags: ["Odontogramme", "Actes", "Historique"],
  },
  {
    title: "Dermatologie",
    description: "Photos, suivi de lesions et comparaisons avant/apres.",
    icon: "image-outline",
    tags: ["Photos", "Suivi lesions", "Comparaison"],
  },
  {
    title: "Cardiologie",
    description: "Observations cliniques, suivi tension et consultation structuree.",
    icon: "heart-outline",
    tags: ["Constantes", "Observation", "Suivi"],
  },
  {
    title: "Gynecologie",
    description: "Formulaires specialises, historique et parcours de consultation.",
    icon: "female-outline",
    tags: ["Formulaire", "Historique", "Parcours"],
  },
];

const comparisonRows = [
  {
    label: "Agenda et rendez-vous",
    values: ["Oui", "Oui", "Oui", "Oui"],
  },
  {
    label: "Utilisateurs d equipe",
    values: ["1 medecin", "Equipe", "Equipe avancee", "Demo guidee"],
  },
  {
    label: "Paiements et services",
    values: ["Essentiel", "Complet", "Complet", "Apercu"],
  },
  {
    label: "Rapports et supervision",
    values: ["-", "Basique", "Avance", "-"],
  },
  {
    label: "Accompagnement",
    values: ["Standard", "Prioritaire", "Prioritaire + migration", "Guide"],
  },
];

const trustLinks = [
  "Politique de confidentialite",
  "Conditions d utilisation",
  "Traitement des donnees",
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

function CountUpNumber({
  value,
  suffix = "",
  duration = 1200,
  start = true,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  start?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setDisplayValue(0);
      return;
    }
    let frameId = 0;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [duration, start, value]);

  const formatted =
    displayValue >= 1000 ? `${Math.round(displayValue / 1000)}k` : `${displayValue}`;

  return <>{formatted}{suffix}</>;
}

/** Animated hero illustration tuned to the MedSync workflow */
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

      {/* Main scheduling UI card */}
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
              MS
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
              Tableau de bord
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              Agenda • Patients • Consultations • Paiements
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
              Cabinet actif
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
              Journee du cabinet
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

        {/* tiny moving EKG bar */}
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
          Rappel envoyé
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          Patient confirmé
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
          Paiement enregistre
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          4 500 DA recus aujourd hui
        </Text>
      </Animated.View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [hasPlayedStats, setHasPlayedStats] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);


  

  // Smooth scroll support
  const scrollRef = useRef<ScrollView>(null);
  const testimonialsRef = useRef<FlatList<(typeof testimonials)[number]>>(null);
  const statsSectionY = useRef<number | null>(null);
  const sectionY = useRef<Record<string, number>>({
    features: 0,
    testimonials: 0,
    pricing: 0,
    faq: 0,
    contact: 0,
  }).current;

  // Optional: active nav highlight
  const [activeNav, setActiveNav] = useState<string>("features");

  const isWide = useMemo(() => {
    const w = Dimensions.get("window").width;
    return w >= 900;
  }, []);
  const testimonialCardWidth = isWide ? 432 : 352;
  const testimonialStep = testimonialCardWidth + 12;

  if (!fontsLoaded) return null;

  const scrollToSection = (id: string) => {
    const y = sectionY[id] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const viewHeight = e.nativeEvent.layoutMeasurement.height;
    const totalHeight = e.nativeEvent.contentSize.height;

    if (!hasPlayedStats && statsSectionY.current !== null && y + viewHeight * 0.9 >= statsSectionY.current) {
      setHasPlayedStats(true);
    }

    // simple active section detection
    const entries = Object.entries(sectionY).sort((a, b) => a[1] - b[1]);
    let current = entries[0]?.[0] ?? "features";
    for (const [id, top] of entries) {
      if (y + 120 >= top) current = id;
    }
    if (y + viewHeight >= totalHeight - 48) current = "contact";
    if (current !== activeNav) setActiveNav(current);
  };

  const scrollToTestimonial = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, testimonials.length - 1));
    testimonialsRef.current?.scrollToOffset({
      offset: nextIndex * testimonialStep,
      animated: true,
    });
    setActiveTestimonial(nextIndex);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#fff" }}
      contentContainerStyle={{ paddingBottom: isWide ? 0 : 96 }}
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

              <SecondaryButton label="CONNEXION" onPress={() => router.push("/login")} />
              <PrimaryButton label="ESSAI GRATUIT" onPress={() => router.push("/signup")} />
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
                    Agenda - Patients - Ordonnances - Paiements
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
                  Gerez votre cabinet medical,
                  {"\n"}simplement.
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
                  Une experience moderne pour les medecins en Algerie : rendez-vous, dossiers patients,
                  consultations, ordonnances, paiements et taches dans un seul espace.
                </Text>

                <View style={{ flexDirection: "row", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                  <PrimaryButton label="OBTENIR UNE CLE ESSAI" onPress={() => router.push("/signup")} />
                  <SecondaryButton label="VOIR LES FONCTIONNALITES" onPress={() => scrollToSection("features")} />
                </View>

                <View style={{ flexDirection: "row", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
                  {["Prise en main rapide", "Acces securise", "Support WhatsApp"].map((t) => (
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
            eyebrow="GESTION DE CABINET"
            title="Tout pour gerer le quotidien"
            description="Simple a apprendre, assez complet pour les consultations, les ordonnances, le suivi patient et les paiements."
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
                "Appointments and waiting flow",
                "Consultation notes and vitals",
                "Patient files and documents",
                "Payments and invoices",
                "Ordonnances et lettres",
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
                padding: 18,
              }}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#0b1220" }}>
                Ecran principal du cabinet
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#64748b", marginTop: 6 }}>
                Une interface unifiee pour l accueil, la consultation, les documents et les paiements.
              </Text>

              <View style={{ marginTop: 16, gap: 12 }}>
                {[
                  { title: "Accueil du jour", value: "18 rendez-vous", tone: "#0D6EFD" },
                  { title: "Patients suivis", value: "124 dossiers actifs", tone: "#16a34a" },
                  { title: "Paiements", value: "6 recus aujourd hui", tone: "#f59e0b" },
                ].map((item) => (
                  <View
                    key={item.title}
                    style={{
                      borderRadius: 16,
                      padding: 14,
                      backgroundColor: "rgba(248,250,252,0.96)",
                      borderWidth: 1,
                      borderColor: "rgba(2,6,23,0.08)",
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#0b1220" }}>{item.title}</Text>
                      <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: item.tone }} />
                    </View>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#64748b", marginTop: 8 }}>{item.value}</Text>
                  </View>
                ))}
              </View>
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
              title="Better than a simple desktop cabinet tool"
              description="Keep the familiar clean design, but add the cloud workflow, solo-doctor focus, and launch-ready operations your market needs."
            />

            <View
              style={{
                width: "100%",
                ...(Platform.OS === "web"
                  ? ({
                      overflowX: "auto",
                      overflowY: "hidden",
                      WebkitOverflowScrolling: "touch",
                      touchAction: "pan-x" as any,
                    } as any)
                  : null),
              }}
            >
              <FlatList
                horizontal
                data={productScreens}
                keyExtractor={(item) => item.title}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4, gap: 16 }}
                renderItem={({ item, index }) => (
                  <Animated.View
                    entering={FadeInUp.delay(130 + index * 70).duration(600)}
                    style={{
                      width: isWide ? 360 : 300,
                      borderRadius: 24,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "rgba(2,6,23,0.08)",
                      padding: 18,
                      shadowColor: "#000",
                      shadowOpacity: 0.06,
                      shadowRadius: 16,
                      elevation: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#0b1220" }}>{item.title}</Text>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#64748b", marginTop: 4 }}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <View style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: item.accent }} />
                    </View>

                    <View
                      style={{
                        marginTop: 18,
                        borderRadius: 20,
                        backgroundColor: "#f8fafc",
                        borderWidth: 1,
                        borderColor: "rgba(2,6,23,0.06)",
                        padding: 16,
                        gap: 10,
                      }}
                    >
                      {item.metrics.map((metric, metricIndex) => (
                        <View
                          key={metric}
                          style={{
                            borderRadius: 14,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            backgroundColor: metricIndex === 0 ? "rgba(13,110,253,0.08)" : "#fff",
                            borderWidth: 1,
                            borderColor: "rgba(2,6,23,0.06)",
                          }}
                        >
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#0b1220" }}>{metric}</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 16,
                marginTop: 28,
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
                    borderWidth: 1,
                    borderColor: "rgba(2,6,23,0.10)",
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 18,
                    elevation: 5,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: "rgba(13,110,253,0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(13,110,253,0.18)",
                    }}
                  >
                    <Ionicons name={f.icon as any} size={21} color="#0D6EFD" />
                  </View>
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
                </Animated.View>
              ))}
            </View>

            {/* Specialties chips */}
            <Animated.View entering={FadeInUp.delay(360).duration(650)} style={{ marginTop: 34 }}>
              <SectionHeader
                center
                eyebrow="SPECIALITES"
                title="Adapte aux specialites courantes"
                description="Le meme workflow de base, avec des espaces specialises quand le cabinet en a besoin."
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

            <Animated.View entering={FadeInUp.delay(390).duration(650)} style={{ marginTop: 34 }}>
              <SectionHeader
                center
                eyebrow="APERCUS"
                title="Previews specialises"
                description="Chaque specialite garde le meme socle produit, avec les outils dont la consultation a besoin."
              />

              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
                {specialtyCards.map((card, idx) => (
                  <Animated.View
                    key={card.title}
                    entering={FadeInUp.delay(410 + idx * 60).duration(650)}
                    style={{
                      width: isWide ? 272 : "100%",
                      maxWidth: 320,
                      borderRadius: 22,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "rgba(2,6,23,0.08)",
                      padding: 18,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: "rgba(13,110,253,0.10)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons name={card.icon as any} size={22} color="#0D6EFD" />
                    </View>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#0b1220" }}>{card.title}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#556070", lineHeight: 22, marginTop: 8 }}>
                      {card.description}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                      {card.tags.map((tag) => (
                        <View
                          key={tag}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            borderRadius: 999,
                            backgroundColor: "rgba(13,110,253,0.07)",
                          }}
                        >
                          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#0D6EFD" }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </Animated.View>
        </Container>
      </View>

      {/* HOW IT WORKS */}
      <View style={{ backgroundColor: "#fff" }}>
        <Container>
          <Animated.View entering={FadeInUp.delay(180).duration(650)} style={{ paddingVertical: 64 }}>
            <SectionHeader
              center
              eyebrow="MISE EN ROUTE"
              title="Comment ca marche"
              description="Un parcours simple pour activer le cabinet, integrer l equipe et commencer a consulter."
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
              {workflowSteps.map((step, idx) => (
                <Animated.View
                  key={step.title}
                  entering={FadeInUp.delay(200 + idx * 60).duration(650)}
                  style={{
                    width: isWide ? 360 : "100%",
                    maxWidth: 380,
                    borderRadius: 22,
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "rgba(2,6,23,0.08)",
                    padding: 20,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#0b1220" }}>{step.title}</Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#556070", lineHeight: 22, marginTop: 10 }}>
                    {step.description}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </Container>
      </View>

      {/* AUDIENCE */}
      <View style={{ backgroundColor: "#f8fafc" }}>
        <Container>
          <Animated.View entering={FadeInUp.delay(200).duration(650)} style={{ paddingVertical: 64 }}>
            <SectionHeader
              center
              eyebrow="POUR QUI"
              title="Un produit adapte a plusieurs tailles de cabinet"
              description="Le meme coeur produit, avec le bon niveau d organisation selon votre pratique."
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
              {audienceCards.map((card, idx) => (
                <Animated.View
                  key={card.title}
                  entering={FadeInUp.delay(220 + idx * 60).duration(650)}
                  style={{
                    width: isWide ? 360 : "100%",
                    maxWidth: 380,
                    borderRadius: 22,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: "rgba(2,6,23,0.08)",
                    padding: 20,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#0b1220" }}>{card.title}</Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#556070", lineHeight: 22, marginTop: 10 }}>
                    {card.description}
                  </Text>
                  <View style={{ gap: 9, marginTop: 14 }}>
                    {card.bullets.map((bullet) => (
                      <View key={bullet} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#334155" }}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </Container>
      </View>

      {/* STATS */}
      <View
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y;
          statsSectionY.current = y;
          if (!hasPlayedStats && y <= Dimensions.get("window").height * 0.9) {
            setHasPlayedStats(true);
          }
        }}
        style={{ backgroundColor: "#0D6EFD" }}
      >
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
                    <CountUpNumber value={s.value} suffix={s.suffix} start={hasPlayedStats} />
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

      {/* AVIS */}
<View
  onLayout={(e) => {
    sectionY.testimonials = e.nativeEvent.layout.y;
  }}
>
  <Container>
    <Animated.View entering={FadeInUp.delay(240).duration(650)} style={{ paddingVertical: 64 }}>
      <SectionHeader center eyebrow="AVIS MEDECINS" title="Pense pour les cabinets medicaux en Algerie" />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: "#64748b", flex: 1 }}>
          Parcourez les retours des medecins avec les fleches ou en glissant horizontalement.
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => scrollToTestimonial(activeTestimonial - 1)}
            disabled={activeTestimonial === 0}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(2,6,23,0.10)",
              backgroundColor: activeTestimonial === 0 ? "#f8fafc" : "#fff",
            }}
          >
            <Ionicons name="arrow-back" size={18} color={activeTestimonial === 0 ? "#94a3b8" : "#0b1220"} />
          </Pressable>
          <Pressable
            onPress={() => scrollToTestimonial(activeTestimonial + 1)}
            disabled={activeTestimonial === testimonials.length - 1}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: activeTestimonial === testimonials.length - 1 ? "rgba(2,6,23,0.10)" : "rgba(13,110,253,0.20)",
              backgroundColor: activeTestimonial === testimonials.length - 1 ? "#f8fafc" : "#0D6EFD",
            }}
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={activeTestimonial === testimonials.length - 1 ? "#94a3b8" : "#fff"}
            />
          </Pressable>
        </View>
      </View>

      {/* Web fix wrapper */}
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
        // Ensure horizontal drag does not get swallowed by vertical scroll
        onStartShouldSetResponderCapture={(evt) => {
          if (Platform.OS !== "web") return false;

          const t = evt.nativeEvent as any;
          // if user starts dragging mostly horizontally, capture it
          return Math.abs(t.pageX - (t.locationX ?? t.pageX)) >
            Math.abs(t.pageY - (t.locationY ?? t.pageY));
        }}
      >
        <FlatList
          ref={testimonialsRef}
          horizontal
          data={testimonials}
          keyExtractor={(i) => i.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 6 }}
          snapToInterval={testimonialStep}
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={(e) => {
            const nextIndex = Math.round(e.nativeEvent.contentOffset.x / testimonialStep);
            setActiveTestimonial(Math.max(0, Math.min(nextIndex, testimonials.length - 1)));
          }}

          // Keep these
          nestedScrollEnabled
          scrollEnabled
          directionalLockEnabled
          alwaysBounceHorizontal={false}

          // Helps web list layout
          style={{ flexGrow: 0 }}

          // Make sure it needs scrolling
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(260 + index * 70).duration(650)}
              style={{
                width: testimonialCardWidth,
                backgroundColor: "#f8fafc",
                padding: 20,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(2,6,23,0.10)",
                marginRight: 12,
                shadowColor: "#0f172a",
                shadowOpacity: 0.05,
                shadowRadius: 16,
                elevation: 3,
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
                {item.text}
              </Text>
            </Animated.View>
          )}
        />
      </View>

      <Animated.View entering={FadeInUp.delay(520).duration(650)} style={{ alignItems: "center", marginTop: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {testimonials.map((item, index) => (
            <Pressable
              key={item.name}
              onPress={() => scrollToTestimonial(index)}
              style={{
                width: activeTestimonial === index ? 28 : 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: activeTestimonial === index ? "#0D6EFD" : "rgba(13,110,253,0.22)",
              }}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  </Container>
</View>


      {/* PRICING */}
      <View
        onLayout={(e) => {
          sectionY.pricing = e.nativeEvent.layout.y;
        }}
        style={{ backgroundColor: "#fff" }}
      >
        <Container>
          <Animated.View entering={FadeInUp.delay(260).duration(650)} style={{ paddingVertical: 64 }}>
            <SectionHeader
              center
              eyebrow="TARIFS"
              title="Des offres simples pour demarrer"
              description="Facturation annuelle pour les plans actifs, avec un essai accompagne pour valider le workflow avant activation."
            />

            <View
              style={{
                alignSelf: "center",
                marginBottom: 18,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: "rgba(13,110,253,0.08)",
                borderWidth: 1,
                borderColor: "rgba(13,110,253,0.14)",
              }}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#0D6EFD" }}>
                Tarifs annuels • activation et onboarding inclus
              </Text>
            </View>

            <View
              style={{
                alignSelf: "center",
                marginBottom: 24,
                width: "100%",
                maxWidth: 860,
                borderRadius: 20,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "rgba(2,6,23,0.08)",
                padding: 18,
              }}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#0b1220" }}>
                Promesse onboarding
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                {["Setup initial guide", "Aide migration des donnees", "Support lun-sam 08h-18h"].map((item) => (
                  <View
                    key={item}
                    style={{
                      paddingVertical: 9,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "rgba(13,110,253,0.12)",
                    }}
                  >
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#0D6EFD" }}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
              {pricingPlans.map((plan, idx) => (
                <Animated.View
                  key={plan.name}
                  entering={FadeInUp.delay(280 + idx * 70).duration(650)}
                  style={{
                    width: isWide ? 272 : "100%",
                    maxWidth: 320,
                    minHeight: 460,
                    borderRadius: 22,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: plan.featured ? "rgba(13,110,253,0.35)" : "rgba(2,6,23,0.10)",
                    backgroundColor: plan.featured ? "#0D6EFD" : "#f8fafc",
                    shadowColor: "#000",
                    shadowOpacity: plan.featured ? 0.14 : 0.06,
                    shadowRadius: 18,
                    elevation: 5,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: plan.featured ? "rgba(255,255,255,0.16)" : "rgba(13,110,253,0.10)",
                      }}
                    >
                      <Ionicons name={plan.icon as any} size={22} color={plan.featured ? "#fff" : "#0D6EFD"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 18, color: plan.featured ? "#fff" : "#0b1220" }}>
                        {plan.name}
                      </Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: plan.featured ? "rgba(255,255,255,0.82)" : "#64748b", marginTop: 2 }}>
                        {plan.description}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 18 }}>
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 34, color: plan.featured ? "#fff" : "#0b1220" }}>
                      {plan.price}
                    </Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: plan.featured ? "rgba(255,255,255,0.78)" : "#64748b", marginBottom: 6 }}>
                      {plan.cadence}
                    </Text>
                  </View>

                  <View style={{ gap: 10, marginTop: 18 }}>
                    {plan.features.map((item) => (
                      <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <Ionicons name="checkmark-circle" size={17} color={plan.featured ? "#fff" : "#16a34a"} />
                        <Text style={{ flex: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: plan.featured ? "rgba(255,255,255,0.9)" : "#334155" }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Pressable onPress={() => router.push("/signup")} style={{ marginTop: "auto", paddingTop: 22 }}>
                    <View
                      style={{
                        height: 46,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: plan.featured ? "#fff" : "#0D6EFD",
                      }}
                    >
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: plan.featured ? "#0D6EFD" : "#fff" }}>
                        {plan.name === "Test" ? "DEMANDER UN TEST" : "CHOISIR CE PLAN"}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeInUp.delay(360).duration(650)} style={{ marginTop: 34 }}>
              <SectionHeader
                center
                eyebrow="COMPARAISON"
                title="Comparer les plans"
                description="Une vue rapide pour choisir le bon niveau de demarrage pour le cabinet."
              />

              <View
                style={{
                  width: "100%",
                  ...(Platform.OS === "web"
                    ? ({
                        overflowX: "auto",
                        overflowY: "hidden",
                        WebkitOverflowScrolling: "touch",
                        touchAction: "pan-x" as any,
                      } as any)
                    : null),
                }}
              >
                <View
                  style={{
                    minWidth: 860,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: "rgba(2,6,23,0.08)",
                    backgroundColor: "#fff",
                    padding: 12,
                    shadowColor: "#0f172a",
                    shadowOpacity: 0.05,
                    shadowRadius: 20,
                    elevation: 4,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    {["Fonction", "Solo", "Clinique", "Pro", "Test"].map((head, index) => (
                      <View
                        key={head}
                        style={{
                          width: index === 0 ? 260 : 150,
                          paddingVertical: 16,
                          paddingHorizontal: 14,
                          borderRadius: 18,
                          backgroundColor:
                            index === 0
                              ? "#eff6ff"
                              : head === "Clinique"
                                ? "#0D6EFD"
                                : "#f8fafc",
                          borderWidth: 1,
                          borderColor:
                            head === "Clinique"
                              ? "rgba(13,110,253,0.35)"
                              : "rgba(2,6,23,0.08)",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            fontSize: 13,
                            color: head === "Clinique" ? "#fff" : "#0b1220",
                          }}
                        >
                          {head}
                        </Text>
                        {head === "Clinique" ? (
                          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.82)", marginTop: 4 }}>
                            Le plus choisi
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>

                  {comparisonRows.map((row, idx) => (
                    <View
                      key={row.label}
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        marginTop: idx === 0 ? 0 : 10,
                      }}
                    >
                      <View
                        style={{
                          width: 260,
                          paddingVertical: 16,
                          paddingHorizontal: 14,
                          borderRadius: 18,
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                          borderWidth: 1,
                          borderColor: "rgba(2,6,23,0.06)",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#0b1220" }}>{row.label}</Text>
                      </View>
                      {row.values.map((value, valueIndex) => (
                        <View
                          key={`${row.label}-${valueIndex}`}
                          style={{
                            width: 150,
                            paddingVertical: 16,
                            paddingHorizontal: 14,
                            borderRadius: 18,
                            backgroundColor: valueIndex === 1 ? "rgba(13,110,253,0.08)" : idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                            borderWidth: 1,
                            borderColor: valueIndex === 1 ? "rgba(13,110,253,0.18)" : "rgba(2,6,23,0.06)",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "Inter_400Regular",
                              fontSize: 13,
                              color: valueIndex === 1 ? "#0D6EFD" : "#556070",
                            }}
                          >
                            {value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </Container>
      </View>

      {/* TRUST / COMPLIANCE */}
      <View style={{ backgroundColor: "#f8fafc" }}>
        <Container>
          <Animated.View entering={FadeInUp.delay(270).duration(650)} style={{ paddingVertical: 64 }}>
            <SectionHeader
              center
              eyebrow="CONFIANCE"
              title="Informations importantes avant mise en production"
              description="Le produit couvre deja le coeur metier du cabinet. Cette zone rappelle aussi les points de securite et d exploitation a cadrer pour un usage reel."
            />

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
              {complianceHighlights.map((item, idx) => (
                <Animated.View
                  key={item.title}
                  entering={FadeInUp.delay(290 + idx * 60).duration(650)}
                  style={{
                    width: 320,
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: "rgba(2,6,23,0.08)",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(13,110,253,0.10)",
                      marginBottom: 14,
                    }}
                  >
                    <Ionicons name={item.icon as any} size={22} color="#0D6EFD" />
                  </View>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#0b1220" }}>
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 14,
                      color: "#556070",
                      lineHeight: 22,
                      marginTop: 8,
                    }}
                  >
                    {item.description}
                  </Text>
                </Animated.View>
              ))}
            </View>
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
            <SectionHeader center title="Questions frequentes" />

            <View style={{ gap: 12, maxWidth: 860, width: "100%", alignSelf: "center" as any }}>
              {faqItems.map((f, idx) => {
                const open = activeFaq === idx;
                return (
                  <View
                    key={f.question}
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
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 999,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: open ? "rgba(13,110,253,0.10)" : "#f8fafc",
                          }}
                        >
                          <Text style={{ fontFamily: "Inter_600SemiBold", color: "#0D6EFD" }}>
                            {open ? "-" : "+"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {open ? (
                      <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
                        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#556070", lineHeight: 22 }}>
                          {f.answer}
                        </Text>
                      </View>
                    ) : null}
                  </View>
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
              ESSAI GRATUIT
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
              Lancez votre cabinet pilote
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
                    OBTENIR UNE CLÉ ESSAI
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
                  Contact
                </Text>

                <View style={{ gap: 10 }}>
                  {[
                    { label: "WhatsApp", value: "Numero onboarding a renseigner" },
                    { label: "Email", value: "Email commercial a renseigner" },
                    { label: "Onboarding", value: "Contact mise en route a renseigner" },
                  ].map((item) => (
                    <View key={item.label}>
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" }}>{item.label}</Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff", marginTop: 18, marginBottom: 10 }}>
                  Liens de confiance
                </Text>

                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                  {trustLinks.map((name) => (
                    <Pressable key={name}>
                      <View
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 999,
                          backgroundColor: "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.08)",
                        }}
                      >
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#cbd5e1" }}>{name}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff", marginBottom: 10 }}>
                  Réseaux sociaux
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
                © 2026 MyDoctor. Tous droits réservés.
              </Text>
            </View>
          </Animated.View>
        </Container>
      </View>
    </ScrollView>
    {!isWide ? (
      <View
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          borderRadius: 18,
          backgroundColor: "rgba(11,18,32,0.96)",
          padding: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" }}>
              Activez votre cabinet
            </Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 4 }}>
              Demandez un essai et commencez votre onboarding.
            </Text>
          </View>
          <Pressable onPress={() => router.push("/signup")}>
            <View
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: "#0D6EFD",
              }}
            >
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#fff" }}>
                ESSAI GRATUIT
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    ) : null}
    </View>
  );
}







