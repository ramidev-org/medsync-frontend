import React, { ReactNode, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TopBar } from "@/components/top_bar";
import { useTheme } from "@/theme/theme_provider";

type BadgeType = "gray" | "green" | "blue" | "orange" | "red" | "purple";
type LabStatus = "En attente" | "Prélèvement fait" | "Résultat prêt";
type LabPriority = "Urgent" | "Normal";
type LabSourceType = "Interne" | "Externe";
type ModalType = "request" | "manual" | "details" | "history" | "report" | null;
type RequestFilter = "all" | LabStatus;

type LabRequest = {
  id: string;
  patient: string;
  age: number;
  doctor: string;
  tests: string;
  status: LabStatus;
  priority: LabPriority;
  date: string;
  type: LabSourceType;
};

type ResultRow = {
  name: string;
  value: string;
  unit: string;
  normal: string;
  note: "Élevé" | "Normal";
};

type HistoryItem = {
  date: string;
  title: string;
  source: string;
  summary: string;
};

const labRequests: LabRequest[] = [
  {
    id: "LAB-001",
    patient: "Amina Bensalem",
    age: 34,
    doctor: "Dr. Karim Haddad",
    tests: "FNS, Glycémie, CRP",
    status: "En attente",
    priority: "Urgent",
    date: "Aujourd’hui 09:15",
    type: "Interne",
  },
  {
    id: "LAB-002",
    patient: "Yacine Merabet",
    age: 52,
    doctor: "Dr. Lina Rahmani",
    tests: "HbA1c, Cholestérol",
    status: "Prélèvement fait",
    priority: "Normal",
    date: "Aujourd’hui 10:05",
    type: "Interne",
  },
  {
    id: "LAB-003",
    patient: "Nour Ali",
    age: 27,
    doctor: "Dr. Sami Mekki",
    tests: "Analyse urinaire, Test grossesse",
    status: "Résultat prêt",
    priority: "Normal",
    date: "Aujourd’hui 11:30",
    type: "Externe",
  },
];

const resultPreview: ResultRow[] = [
  { name: "Glycémie", value: "1.18", unit: "g/L", normal: "0.70 - 1.10", note: "Élevé" },
  { name: "CRP", value: "7.5", unit: "mg/L", normal: "< 5", note: "Élevé" },
  { name: "Hémoglobine", value: "13.8", unit: "g/dL", normal: "12 - 16", note: "Normal" },
];

const historyItems: HistoryItem[] = [
  {
    date: "26 Mai 2026",
    title: "FNS, Glycémie, CRP",
    source: "Clinique",
    summary: "CRP élevée, glycémie légèrement élevée.",
  },
  {
    date: "12 Avril 2026",
    title: "Glycémie à jeun",
    source: "Labo externe",
    summary: "Glycémie normale: 0.96 g/L.",
  },
  {
    date: "02 Mars 2026",
    title: "Bilan lipidique",
    source: "Labo externe",
    summary: "Cholestérol LDL à surveiller.",
  },
];

const commonTests = [
  "FNS",
  "Glycémie",
  "CRP",
  "HbA1c",
  "Cholestérol",
  "Créatinine",
  "Urée",
  "Analyse urinaire",
  "TSH",
  "Vitamine D",
];

function statusType(status: LabStatus): BadgeType {
  if (status === "Résultat prêt") return "green";
  if (status === "Prélèvement fait") return "blue";
  return "orange";
}

function Badge({ children, type = "gray" }: { children: ReactNode; type?: BadgeType }) {
  return <Text style={[styles.badge, badgeStyles[type]]}>{children}</Text>;
}

function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function ActionButton({
  title,
  icon,
  variant = "primary",
  onPress,
  containerStyle,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "dark" | "light" | "blueLight";
  onPress?: () => void;
  containerStyle?: object;
}) {
  const buttonStyle =
    variant === "primary"
      ? styles.buttonPrimary
      : variant === "dark"
      ? styles.buttonDark
      : variant === "blueLight"
      ? styles.buttonBlueLight
      : styles.buttonLight;

  const textStyle =
    variant === "primary" || variant === "dark"
      ? styles.buttonTextWhite
      : variant === "blueLight"
      ? styles.buttonTextBlue
      : styles.buttonTextDark;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.buttonBase, buttonStyle, containerStyle, pressed && styles.pressed]}>
      {icon ? <Ionicons name={icon} size={18} color={textStyle.color as string} /> : null}
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

function IconBox({
  icon,
  color,
  backgroundColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.iconBox, { backgroundColor }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
  );
}

function InputField({
  label,
  value,
  placeholder,
  multiline,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        defaultValue={value}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function SelectBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.selectBox}>
        <Text style={styles.selectText}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748B" />
      </Pressable>
    </View>
  );
}

function LabModal({
  visible,
  title,
  subtitle,
  icon,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <IconBox icon={icon} color="#1D4ED8" backgroundColor="#EFF6FF" />
              <View style={styles.modalTitleTextWrap}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>{subtitle}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function LabWorkspaceScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const isWideDesktop = width >= 1280;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestFilter>("all");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>(["FNS", "Glycémie", "CRP"]);
  const pendingCount = useMemo(
    () => labRequests.filter((item) => statusType(item.status) === "orange").length,
    []
  );
  const sampledCount = useMemo(
    () => labRequests.filter((item) => statusType(item.status) === "blue").length,
    []
  );
  const readyCount = useMemo(
    () => labRequests.filter((item) => statusType(item.status) === "green").length,
    []
  );

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return labRequests.filter((item) => {
      const matchesFilter = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesQuery = !normalizedQuery
        ? true
        : `${item.patient} ${item.doctor} ${item.tests} ${item.status} ${item.type}`
            .toLowerCase()
            .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [query, statusFilter]);

  const toggleTest = (test: string) => {
    setSelectedTests((current) =>
      current.includes(test) ? current.filter((item) => item !== test) : [...current, test]
    );
  };

  return (
    <View style={styles.screenRoot}>
      <TopBar theme={theme} />
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.page, isDesktop && styles.pageDesktop]} showsVerticalScrollIndicator={false}>
        <Card style={[styles.heroCard, isWideDesktop && styles.heroCardDesktop]}>
          <View style={styles.brandPill}>
            <MaterialCommunityIcons name="flask-outline" size={16} color="#1D4ED8" />
            <Text style={styles.brandText}>MedSync</Text>
          </View>

          <Text style={styles.title}>Analyses médicales</Text>
          <Text style={styles.description}>
            Two simple workflows: request tests inside the clinic, or import external lab results for doctor review.
          </Text>

          <View style={[styles.heroButtons, isDesktop && styles.heroButtonsDesktop, isWideDesktop && styles.heroButtonsWideDesktop]}>
            <ActionButton
              title="Demander analyse"
              icon="add"
              variant="primary"
              onPress={() => setModal("request")}
              containerStyle={isWideDesktop ? styles.heroActionButtonInline : styles.heroActionButton}
            />
            <ActionButton
              title="Remplir les résultats"
              icon="flask-outline"
              variant="dark"
              onPress={() => setModal("manual")}
              containerStyle={isWideDesktop ? styles.heroActionButtonInline : styles.heroActionButton}
            />
          </View>
        </Card>

        <View style={[styles.statsGrid, isWideDesktop && styles.statsGridDesktop]}>
          <Pressable onPress={() => setModal("request")} style={({ pressed }) => [styles.statCard, isWideDesktop && styles.statCardDesktop, pressed && styles.pressed]}>
            <View style={styles.statHeader}>
              <IconBox icon="time-outline" color="#C2410C" backgroundColor="#FFF7ED" />
              <Badge type="orange">À faire</Badge>
            </View>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Demandes en attente</Text>
          </Pressable>

          <Pressable onPress={() => setModal("manual")} style={({ pressed }) => [styles.statCard, isWideDesktop && styles.statCardDesktop, pressed && styles.pressed]}>
            <View style={styles.statHeader}>
              <IconBox icon="flask-outline" color="#1D4ED8" backgroundColor="#EFF6FF" />
              <Badge type="blue">Saisie</Badge>
            </View>
            <Text style={styles.statNumber}>{sampledCount}</Text>
            <Text style={styles.statLabel}>Résultats à remplir</Text>
          </Pressable>

          <Pressable onPress={() => setModal("report")} style={({ pressed }) => [styles.statCard, isWideDesktop && styles.statCardDesktop, pressed && styles.pressed]}>
            <View style={styles.statHeader}>
              <IconBox icon="checkmark-circle-outline" color="#047857" backgroundColor="#ECFDF5" />
              <Badge type="green">Prêt</Badge>
            </View>
            <Text style={styles.statNumber}>{readyCount}</Text>
            <Text style={styles.statLabel}>Résultats prêts</Text>
          </Pressable>
        </View>

        <View style={[styles.mainGrid, isWideDesktop && styles.mainGridDesktop]}>
          <Card style={[styles.requestsCard, isWideDesktop && styles.requestsCardDesktop]}>
            <View style={[styles.cardHeader, isWideDesktop && styles.cardHeaderDesktop]}>
              <SectionTitle title="Demandes et résultats" subtitle="Internal requests and external imported results in one list." />
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Rechercher patient ou analyse..."
                  placeholderTextColor="#94A3B8"
                  style={[styles.searchInput, isWideDesktop && styles.searchInputDesktop]}
                />
              </View>
            </View>
            <View style={styles.filtersRow}>
              <Pressable onPress={() => setStatusFilter("all")} style={[styles.filterChip, statusFilter === "all" && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, statusFilter === "all" && styles.filterChipTextActive]}>Tous</Text>
              </Pressable>
              <Pressable onPress={() => setStatusFilter("En attente")} style={[styles.filterChip, statusFilter === "En attente" && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, statusFilter === "En attente" && styles.filterChipTextActive]}>En attente</Text>
              </Pressable>
              <Pressable onPress={() => setStatusFilter("Prélèvement fait")} style={[styles.filterChip, statusFilter === "Prélèvement fait" && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, statusFilter === "Prélèvement fait" && styles.filterChipTextActive]}>Prélèvement fait</Text>
              </Pressable>
              <Pressable onPress={() => setStatusFilter("Résultat prêt")} style={[styles.filterChip, statusFilter === "Résultat prêt" && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, statusFilter === "Résultat prêt" && styles.filterChipTextActive]}>Résultat prêt</Text>
              </Pressable>
            </View>

            <View style={styles.requestList}>
              {filteredRequests.length === 0 ? (
                <View style={styles.emptyStateWrap}>
                  <Ionicons name="search-outline" size={20} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>Aucun résultat</Text>
                  <Text style={styles.emptyStateText}>Ajustez la recherche ou le filtre de statut.</Text>
                </View>
              ) : null}
              {filteredRequests.map((request) => (
                <View key={request.id} style={[styles.requestItem, isWideDesktop && styles.requestItemDesktop]}>
                  <View style={styles.requestLeft}>
                    <View style={styles.avatarBox}>
                      <Ionicons name="person-outline" size={22} color="#475569" />
                    </View>
                    <View style={styles.requestInfo}>
                      <View style={styles.requestTitleRow}>
                        <Text style={styles.requestName}>{request.patient}</Text>
                        <Text style={styles.requestAge}>{request.age} ans</Text>
                      </View>

                      <View style={styles.badgeRow}>
                        <Badge type={request.type === "Externe" ? "purple" : "blue"}>{request.type}</Badge>
                        {request.priority === "Urgent" ? <Badge type="red">Urgent</Badge> : null}
                      </View>

                      <Text style={styles.requestTests}>{request.tests}</Text>
                      <Text style={styles.requestMeta}>{request.doctor} • {request.date}</Text>
                    </View>
                  </View>

                  <View style={[styles.requestActions, isWideDesktop && styles.requestActionsDesktop]}>
                    <Badge type={statusType(request.status)}>{request.status}</Badge>
                    <Pressable onPress={() => setModal("details")} style={styles.openButton}>
                      <Text style={styles.openButtonText}>Ouvrir</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <View style={[styles.sideColumn, isWideDesktop && styles.sideColumnDesktop]}>
            <Card>
              <View style={styles.summaryHeader}>
                <SectionTitle title="Résumé médecin" subtitle="Amina Bensalem • LAB-001" />
                <Badge type="green">Prêt</Badge>
              </View>

              <View style={styles.alertBox}>
                <View style={styles.alertTitleRow}>
                  <Ionicons name="warning-outline" size={17} color="#92400E" />
                  <Text style={styles.alertTitle}>Points importants</Text>
                </View>
                <Text style={styles.alertText}>
                  CRP élevée et glycémie légèrement élevée. Comparer avec l’ancien bilan si disponible.
                </Text>
              </View>

              <View style={styles.resultList}>
                {resultPreview.map((item) => (
                  <View key={item.name} style={styles.resultItem}>
                    <View>
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultNormal}>Normal: {item.normal}</Text>
                    </View>
                    <View style={styles.resultRight}>
                      <Text style={styles.resultValue}>{item.value} {item.unit}</Text>
                      <Text style={item.note === "Normal" ? styles.resultNoteNormal : styles.resultNoteHigh}>{item.note}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.twoButtons}>
                <ActionButton title="Rapport" icon="print-outline" variant="dark" onPress={() => setModal("report")} />
                <ActionButton title="Historique" icon="time-outline" variant="blueLight" onPress={() => setModal("history")} />
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>

      <RequestModal
        visible={modal === "request"}
        selectedTests={selectedTests}
        toggleTest={toggleTest}
        onClose={() => setModal(null)}
      />
      <ManualModal visible={modal === "manual"} onClose={() => setModal(null)} />
      <DetailsModal visible={modal === "details"} onClose={() => setModal(null)} setModal={setModal} />
      <HistoryModal visible={modal === "history"} onClose={() => setModal(null)} />
      <ReportModal visible={modal === "report"} onClose={() => setModal(null)} />
      </SafeAreaView>
    </View>
  );
}

function RequestModal({
  visible,
  selectedTests,
  toggleTest,
  onClose,
}: {
  visible: boolean;
  selectedTests: string[];
  toggleTest: (test: string) => void;
  onClose: () => void;
}) {
  return (
    <LabModal
      visible={visible}
      title="Nouvelle demande d’analyse"
      subtitle="For tests done inside the clinic: doctor request → payment → sample → result."
      icon="add"
      onClose={onClose}
    >
      <View style={styles.formGrid}>
        <InputField label="Patient" value="Amina Bensalem" />
        <InputField label="Médecin" value="Dr. Karim Haddad" />
        <SelectBox label="Priorité" value="Normal" />
        <SelectBox label="Paiement" value="À payer à la réception" />
      </View>

      <View style={styles.modalSection}>
        <Text style={styles.fieldLabel}>Choisir les analyses</Text>
        <View style={styles.chipsWrap}>
          {commonTests.map((test) => {
            const selected = selectedTests.includes(test);
            return (
              <Pressable
                key={test}
                onPress={() => toggleTest(test)}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={selected ? styles.chipTextSelected : styles.chipText}>{test}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <InputField label="Note pour laboratoire" value="Patient à jeun. Vérifier CRP rapidement." multiline />

      <View style={styles.paymentSummary}>
        <Text style={styles.paymentTitle}>Résumé paiement</Text>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Analyses sélectionnées</Text>
          <Text style={styles.paymentValue}>{selectedTests.length}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Total estimé</Text>
          <Text style={styles.paymentValue}>3,200 DZD</Text>
        </View>
      </View>
      <View style={styles.modalFooter}>
        <ActionButton title="Créer la demande" variant="primary" containerStyle={styles.modalFooterButton} />
        <ActionButton title="Annuler" variant="light" onPress={onClose} containerStyle={styles.modalFooterButton} />
      </View>
    </LabModal>
  );
}

function ManualModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <LabModal
      visible={visible}
      title="Remplir les résultats"
      subtitle="Simple manual entry when the clinic enters lab values itself."
      icon="flask-outline"
      onClose={onClose}
    >
      <View style={styles.formGrid}>
        <InputField label="Patient" value="Amina Bensalem" />
        <InputField label="Demande" value="LAB-001 - FNS, Glycémie, CRP" />
      </View>

      <View style={styles.resultEditBox}>
        {resultPreview.map((row) => (
          <View key={row.name} style={styles.resultEditRow}>
            <Text style={styles.resultEditName}>{row.name}</Text>
            <View style={styles.resultEditInputs}>
              <TextInput defaultValue={row.value} style={[styles.smallInput, styles.valueInput]} />
              <TextInput defaultValue={row.unit} style={[styles.smallInput, styles.unitInput]} />
              <TextInput defaultValue={row.normal} style={[styles.smallInput, styles.normalInput]} />
            </View>
            <Badge type={row.note === "Normal" ? "green" : "red"}>{row.note}</Badge>
          </View>
        ))}
      </View>

      <InputField label="Conclusion / commentaire" value="CRP élevée. Glycémie légèrement supérieure à la norme." multiline />
      <View style={styles.modalFooter}>
        <ActionButton title="Sauvegarder brouillon" variant="light" onPress={onClose} containerStyle={styles.modalFooterButton} />
        <ActionButton title="Valider résultat" variant="primary" containerStyle={styles.modalFooterButton} />
      </View>
    </LabModal>
  );
}

function DetailsModal({
  visible,
  onClose,
  setModal,
}: {
  visible: boolean;
  onClose: () => void;
  setModal: (modal: ModalType) => void;
}) {
  const steps = [
    "Demande créée par Dr. Karim",
    "Patient payé à la réception",
    "Prélèvement sanguin fait",
    "Résultat rempli",
    "En attente validation médecin",
  ];

  return (
    <LabModal
      visible={visible}
      title="Détails analyse"
      subtitle="One clean page to review request, payment, result, and actions."
      icon="eye-outline"
      onClose={onClose}
    >
      <View style={styles.infoGrid}>
        <InfoBox label="Patient" value="Amina Bensalem" />
        <InfoBox label="Type" value="Interne" />
        <InfoBox label="Paiement" value="Payé" success />
      </View>

      <View style={styles.timelineBox}>
        <Text style={styles.timelineTitle}>Timeline</Text>
        {steps.map((step, index) => (
          <View key={step} style={styles.timelineRow}>
            <View style={[styles.timelineDot, index < 4 ? styles.timelineDotDone : styles.timelineDotPending]} />
            <View>
              <Text style={styles.timelineStep}>{step}</Text>
              <Text style={styles.timelineTime}>Aujourd’hui • {9 + index}:15</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.modalFooterThree}>
        <ActionButton title="Remplir résultat" variant="primary" onPress={() => setModal("manual")} containerStyle={styles.modalFooterThirdButton} />
        <ActionButton title="Voir rapport" variant="dark" onPress={() => setModal("report")} containerStyle={styles.modalFooterThirdButton} />
        <ActionButton title="Historique" variant="light" onPress={() => setModal("history")} containerStyle={styles.modalFooterThirdButton} />
      </View>
    </LabModal>
  );
}

function HistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <LabModal
      visible={visible}
      title="Historique des analyses"
      subtitle="Patient lab history with internal and external results."
      icon="time-outline"
      onClose={onClose}
    >
      <View style={styles.blueInfoBox}>
        <Text style={styles.blueInfoText}>
          <Text style={styles.bold}>Amina Bensalem</Text> has 3 lab records. This helps the doctor compare current and old results quickly.
        </Text>
      </View>

      <View style={styles.historyList}>
        {historyItems.map((item) => (
          <View key={item.date} style={styles.historyItem}>
            <View style={styles.historyTopRow}>
              <View style={styles.historyTextWrap}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyMeta}>{item.date} • {item.source}</Text>
              </View>
              <Pressable style={styles.openButton}>
                <Text style={styles.openButtonText}>Ouvrir</Text>
              </Pressable>
            </View>
            <Text style={styles.historySummary}>{item.summary}</Text>
          </View>
        ))}
      </View>
    </LabModal>
  );
}

function ReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <LabModal
      visible={visible}
      title="Rapport / résumé médecin"
      subtitle="A printable report with values, abnormal flags, and doctor summary."
      icon="document-text-outline"
      onClose={onClose}
    >
      <View style={styles.reportBox}>
        <View style={styles.reportHeader}>
          <View>
            <Text style={styles.reportClinic}>MedSync Clinic</Text>
            <Text style={styles.reportSubtitle}>Rapport d’analyses médicales</Text>
          </View>
          <MaterialCommunityIcons name="flask-outline" size={32} color="#2563EB" />
        </View>

        <View style={styles.reportInfoGrid}>
          <ReportInfo label="Patient" value="Amina Bensalem" />
          <ReportInfo label="Médecin" value="Dr. Karim Haddad" />
          <ReportInfo label="Date" value="26 Mai 2026" />
        </View>

        <View style={styles.reportResultsBox}>
          {resultPreview.map((row) => (
            <View key={row.name} style={styles.reportResultRow}>
              <Text style={styles.reportResultName}>{row.name}</Text>
              <Text style={styles.reportResultValue}>{row.value} {row.unit}</Text>
              <Text style={styles.reportResultNormal}>{row.normal}</Text>
              <Text style={row.note === "Normal" ? styles.resultNoteNormal : styles.resultNoteHigh}>{row.note}</Text>
            </View>
          ))}
        </View>

        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Résumé automatique proposé</Text>
          <Text style={styles.alertText}>
            CRP élevée et glycémie légèrement élevée. Résultat à interpréter selon les symptômes du patient et l’historique médical.
          </Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>Note médecin</Text>
          <Text style={styles.noteText}>Contrôle recommandé si symptômes inflammatoires persistent. Conseiller suivi glycémie.</Text>
        </View>
      </View>
      <View style={styles.modalFooterThree}>
        <ActionButton title="Imprimer" icon="print-outline" variant="dark" containerStyle={styles.modalFooterThirdButton} />
        <ActionButton title="PDF" icon="download-outline" variant="light" containerStyle={styles.modalFooterThirdButton} />
        <ActionButton title="Envoyer" icon="send-outline" variant="blueLight" containerStyle={styles.modalFooterThirdButton} />
      </View>
    </LabModal>
  );
}

function InfoBox({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, success && styles.successText]}>{value}</Text>
    </View>
  );
}

function ReportInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reportInfoItem}>
      <Text style={styles.reportInfoLabel}>{label}</Text>
      <Text style={styles.reportInfoValue}>{value}</Text>
    </View>
  );
}

const COLORS = {
  page: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  softBorder: "#F1F5F9",
  text: "#0F172A",
  muted: "#64748B",
  lightMuted: "#94A3B8",
  blue: "#2563EB",
  dark: "#0F172A",
};

const badgeStyles = StyleSheet.create({
  gray: { backgroundColor: "#F1F5F9", color: "#334155" },
  green: { backgroundColor: "#ECFDF5", color: "#047857" },
  blue: { backgroundColor: "#EFF6FF", color: "#1D4ED8" },
  orange: { backgroundColor: "#FFF7ED", color: "#C2410C" },
  red: { backgroundColor: "#FEF2F2", color: "#B91C1C" },
  purple: { backgroundColor: "#F5F3FF", color: "#6D28D9" },
});

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.page,
  },
  page: {
    padding: 18,
    gap: 18,
    paddingBottom: 40,
  },
  pageDesktop: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      },
    }),
  },
  heroCard: {
    gap: 10,
  },
  heroCardDesktop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  brandPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  brandText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 13,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  description: {
    color: COLORS.muted,
    lineHeight: 22,
    fontSize: 14,
  },
  heroButtons: {
    marginTop: 8,
    gap: 10,
  },
  heroButtonsDesktop: {
    width: "100%",
  },
  heroButtonsWideDesktop: {
    width: 560,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  heroActionButton: {
    width: "100%",
  },
  heroActionButtonInline: {
    flex: 1,
    minWidth: 230,
  },
  buttonBase: {
    minHeight: 46,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: COLORS.blue,
  },
  buttonDark: {
    backgroundColor: COLORS.dark,
  },
  buttonLight: {
    backgroundColor: "#F1F5F9",
  },
  buttonBlueLight: {
    backgroundColor: "#EFF6FF",
  },
  buttonTextWhite: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  buttonTextDark: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 14,
  },
  buttonTextBlue: {
    color: "#1D4ED8",
    fontWeight: "800",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  statsGrid: {
    gap: 12,
  },
  statsGridDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  statCardDesktop: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  statNumber: {
    marginTop: 18,
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  mainGrid: {
    gap: 16,
  },
  mainGridDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  requestsCard: {
    padding: 0,
    overflow: "hidden",
  },
  requestsCardDesktop: {
    flex: 1,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    gap: 14,
  },
  cardHeaderDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  searchWrap: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.page,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  searchInputDesktop: {
    minWidth: 210,
  },
  requestList: {
    gap: 0,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.blue,
  },
  filterChipText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  emptyStateWrap: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.softBorder,
    backgroundColor: COLORS.page,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  emptyStateText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  requestItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    gap: 14,
  },
  requestItemDesktop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requestLeft: {
    flexDirection: "row",
    gap: 12,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  requestInfo: {
    flex: 1,
    gap: 5,
  },
  requestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  requestName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  requestAge: {
    color: COLORS.lightMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginVertical: 2,
  },
  requestTests: {
    color: COLORS.muted,
    fontSize: 14,
  },
  requestMeta: {
    color: COLORS.lightMuted,
    fontSize: 12,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  requestActionsDesktop: {
    flexWrap: "nowrap",
    justifyContent: "flex-end",
  },
  openButton: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  openButtonText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 13,
  },
  sideColumn: {
    gap: 16,
  },
  sideColumnDesktop: {
    width: 390,
    maxWidth: 390,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  alertBox: {
    backgroundColor: "#FFFBEB",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  alertTitle: {
    color: "#92400E",
    fontWeight: "900",
    fontSize: 14,
  },
  alertText: {
    color: "#92400E",
    lineHeight: 20,
    fontSize: 13,
  },
  resultList: {
    gap: 10,
  },
  resultItem: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  resultNormal: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
  },
  resultRight: {
    alignItems: "flex-end",
  },
  resultValue: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
  },
  resultNoteNormal: {
    color: "#059669",
    fontWeight: "900",
    fontSize: 12,
    marginTop: 3,
  },
  resultNoteHigh: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 12,
    marginTop: 3,
  },
  twoButtons: {
    marginTop: 16,
    gap: 10,
  },
  actionsHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  simpleActionsList: {
    gap: 10,
  },
  simpleAction: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  simpleActionText: {
    flex: 1,
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    padding: 14,
    justifyContent: "center",
  },
  modalCard: {
    maxHeight: "84%",
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  modalTitleTextWrap: {
    flex: 1,
  },
  modalTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 18,
  },
  modalSubtitle: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    maxHeight: 520,
  },
  modalBody: {
    padding: 18,
    gap: 16,
  },
  formGrid: {
    gap: 14,
  },
  fieldWrap: {
    gap: 7,
  },
  fieldLabel: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 13,
  },
  input: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.page,
    paddingHorizontal: 14,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 86,
    paddingTop: 10,
  },
  selectBox: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.page,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  modalSection: {
    gap: 10,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.blue,
  },
  chipText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  paymentSummary: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  paymentTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  paymentValue: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalFooterThree: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalFooterButton: {
    flex: 1,
  },
  modalFooterThirdButton: {
    flex: 1,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: COLORS.page,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  uploadTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
  },
  uploadText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  chooseFileButton: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chooseFileText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 13,
  },
  resultEditBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  resultEditRow: {
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
  },
  resultEditName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
  },
  resultEditInputs: {
    flexDirection: "row",
    gap: 8,
  },
  smallInput: {
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  valueInput: { flex: 0.8 },
  unitInput: { flex: 0.9 },
  normalInput: { flex: 1.4 },
  infoGrid: {
    gap: 12,
  },
  infoBox: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  infoValue: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
    marginTop: 4,
  },
  successText: {
    color: "#059669",
  },
  timelineBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 14,
  },
  timelineTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 15,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    marginTop: 2,
  },
  timelineDotDone: {
    backgroundColor: "#10B981",
  },
  timelineDotPending: {
    backgroundColor: "#CBD5E1",
  },
  timelineStep: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 14,
  },
  timelineTime: {
    color: COLORS.muted,
    marginTop: 3,
    fontSize: 12,
  },
  blueInfoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 14,
  },
  blueInfoText: {
    color: "#1E40AF",
    lineHeight: 20,
    fontSize: 13,
  },
  bold: {
    fontWeight: "900",
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  historyTextWrap: {
    flex: 1,
  },
  historyTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
  },
  historyMeta: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 12,
  },
  historySummary: {
    color: COLORS.muted,
    lineHeight: 20,
    fontSize: 13,
  },
  reportBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 16,
  },
  reportHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  reportClinic: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  reportSubtitle: {
    color: COLORS.muted,
    marginTop: 3,
    fontSize: 13,
  },
  reportInfoGrid: {
    gap: 12,
  },
  reportInfoItem: {
    gap: 4,
  },
  reportInfoLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  reportInfoValue: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
  },
  reportResultsBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  reportResultRow: {
    padding: 12,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.softBorder,
  },
  reportResultName: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
  },
  reportResultValue: {
    color: COLORS.text,
    fontSize: 13,
  },
  reportResultNormal: {
    color: COLORS.muted,
    fontSize: 12,
  },
  noteBox: {
    backgroundColor: COLORS.page,
    borderRadius: 18,
    padding: 14,
  },
  noteTitle: {
    color: COLORS.text,
    fontWeight: "900",
    fontSize: 14,
  },
  noteText: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 20,
    fontSize: 13,
  },
});








