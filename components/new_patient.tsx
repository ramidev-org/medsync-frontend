import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface PatientFormProps {
  visible: boolean;
  onClose: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    deuxiemeNom: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "",
    situation: "",
    telephone: "",
    adresse: "",
    assurance: "",
    numeroAssurance: "",
  });

  const [openDropdown, setOpenDropdown] = useState<
    "sexe" | "situation" | "assurance" | null
  >(null);

  const handleChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      maxWidth: 900,
      maxHeight: "90%",
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      overflow: "visible", // ✅ critical
    },

    header: {
      backgroundColor: theme.colors.primary,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    title: {
      flex: 1,
      textAlign: "center",
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
    },

    formWrapper: {
      maxHeight: Platform.OS === "web" ? 520 : 420,
      overflow: "visible",
    },
    form: {
      padding: 24,
      overflow: "visible",
    },

    /* 🔑 ROW FIX */
    row: {
      flexDirection: Platform.OS === "web" ? "row" : "column",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 20,
      position: "relative",
      zIndex: 1,
    },
    rowActive: {
      zIndex: 1000, // ✅ lifts entire row
    },

    field: {
      flex: 1,
      minWidth: Platform.OS === "web" ? 250 : "100%",
    },
    label: {
      marginBottom: 6,
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    input: {
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
    },

    /* -------- DROPDOWN -------- */
    dropdownContainer: {
      position: "relative",
    },
    dropdown: {
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dropdownText: {
      color: theme.colors.text,
    },
    placeholder: {
      color: theme.colors.textSecondary,
    },
    dropdownMenu: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: theme.colors.background, // ✅ solid bg
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      zIndex: 9999,
      elevation: 999,
      pointerEvents: "auto",
    },
    dropdownItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      cursor: Platform.OS === "web" ? "pointer" : "default",
    },
    dropdownItemLast: {
      borderBottomWidth: 0,
    },

    actions: {
      flexDirection: "row",
      gap: 12,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    button: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    primary: {
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
  });

  const Dropdown = ({
    label,
    value,
    options,
    name,
  }: {
    label: string;
    value: string;
    options: string[];
    name: "sexe" | "situation" | "assurance";
  }) => {
    const open = openDropdown === name;

    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setOpenDropdown(open ? null : name)}
          >
            <Text
              style={[
                styles.dropdownText,
                !value && styles.placeholder,
              ]}
            >
              {value || "Sélectionner..."}
            </Text>
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          {open && (
            <View style={styles.dropdownMenu}>
              {options.map((o, i) => (
                <TouchableOpacity
                  key={o}
                  style={[
                    styles.dropdownItem,
                    i === options.length - 1 &&
                      styles.dropdownItemLast,
                  ]}
                  onPress={() => {
                    handleChange(name, o);
                    setOpenDropdown(null);
                  }}
                >
                  <Text>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <Text style={styles.title}>Ajouter un patient</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formWrapper}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.form}>

                {/* Names */}
                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput style={styles.input} />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Prénom</Text>
                    <TextInput style={styles.input} />
                  </View>
                </View>
  
                {/* Birth */}
                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Date de naissance</Text>
                    <TextInput style={styles.input} />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Lieu de naissance</Text>
                    <TextInput style={styles.input} />
                  </View>
                </View>

                {/* Dropdown row */}
                <View
                  style={[
                    styles.row,
                    openDropdown && styles.rowActive,
                  ]}
                >
                  <Dropdown
                    label="Sexe"
                    name="sexe"
                    value={formData.sexe}
                    options={["Masculin", "Féminin"]}
                  />
                  <Dropdown
                    label="Situation"
                    name="situation"
                    value={formData.situation}
                    options={[
                      "Célibataire",
                      "Marié(e)",
                      "Divorcé(e)",
                      "Veuf(ve)",
                    ]}
                  />
                </View>

                {/* Assurance */}
                <View style={[styles.row, openDropdown === "assurance" && styles.rowActive,]} >
                  <Dropdown
                    label="Assurance"
                    name="assurance"
                    value={formData.assurance}
                    options={["CNAS", "CASNOS", "Privée"]}
                  />
                  <View style={styles.field}>
                    <Text style={styles.label}>N° Assurance</Text>
                    <TextInput style={styles.input} />
                  </View>
                </View>
               
                {/* Contact */}
                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput style={styles.input} />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Adresse</Text>
                    <TextInput style={styles.input} />
                  </View>
                </View>

              </View>
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.secondary]}
              onPress={onClose}
            >
              <Text>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primary]}
            >
              <Text style={{ color: "#fff" }}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PatientForm;
