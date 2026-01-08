import {
  DateField,
  Dropdown,
  NumberField,
  PhoneField,
  TextField,
} from "@/components/input_fields";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!formData.dateNaissance.trim())
      newErrors.dateNaissance = "La date de naissance est requise";
    if (!formData.sexe) newErrors.sexe = "Le sexe est requis";
    if (!formData.telephone.trim())
      newErrors.telephone = "Le téléphone est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Form submitted:", formData);
      // Add your submit logic here
      onClose();
    }
  };

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
      overflow: "visible",
    },
    header: {
      backgroundColor: theme.colors.primary,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      borderTopRightRadius: 12,
      borderTopLeftRadius: 12,
    },
    title: {
      flex: 1,
      textAlign: "center",
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
    },
    formWrapper: {
      maxHeight: 520,
      overflow: "visible",
    },
    form: {
      padding: 24,
      overflow: "visible",
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 0,
      position: "relative",
    },
    field: {
      flex: 1,
      minWidth: 250,
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
    buttonText: {
      fontSize: 15,
      fontWeight: "600",
    },
    buttonTextPrimary: {
      color: "#fff",
    },
    buttonTextSecondary: {
      color: theme.colors.text,
    },
  });

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
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.form}>
                {/* Names */}
                <View style={styles.row}>
                  <TextField
                    label="Nom"
                    value={formData.nom}
                    onChangeText={(value) => handleChange("nom", value)}
                    placeholder="Entrez le nom"
                    prefixIcon="person-outline"
                    error={errors.nom}
                    required
                    containerStyle={styles.field}
                  />
                  <TextField
                    label="Prénom"
                    value={formData.prenom}
                    onChangeText={(value) => handleChange("prenom", value)}
                    placeholder="Entrez le prénom"
                    prefixIcon="person-outline"
                    error={errors.prenom}
                    required
                    containerStyle={styles.field}
                  />
                </View>


                {/* Birth */}
                <View style={styles.row}>
                  <DateField
                    label="Date de naissance"
                    value={formData.dateNaissance}
                    onChangeText={(value) =>
                      handleChange("dateNaissance", value)
                    }
                    format="DD/MM/YYYY"
                    error={errors.dateNaissance}
                    required
                    containerStyle={styles.field}
                  />
                  <TextField
                    label="Lieu de naissance"
                    value={formData.lieuNaissance}
                    onChangeText={(value) =>
                      handleChange("lieuNaissance", value)
                    }
                    placeholder="Entrez le lieu de naissance"
                    prefixIcon="location-outline"
                    containerStyle={styles.field}
                  />
                </View>

                {/* Dropdown row */}
                <View style={styles.row}>
                  <Dropdown
                    label="Sexe"
                    value={formData.sexe}
                    onChange={(value) => {
                      handleChange("sexe", value);
                    }}
                    options={["Masculin", "Féminin"]}
                    error={errors.sexe}
                    required
                    containerStyle={styles.field}
                  />
                  <Dropdown
                    label="Situation familiale"
                    value={formData.situation}
                    onChange={(value) => {
                      handleChange("situation", value);
                    }}
                    options={[
                      "Célibataire",
                      "Marié(e)",
                      "Divorcé(e)",
                      "Veuf(ve)",
                    ]}
                    containerStyle={styles.field}
                  />
                </View>

                {/* Assurance */}
                <View style={styles.row}>
                  <Dropdown
                    label="Assurance"
                    value={formData.assurance}
                    onChange={(value) => {
                      handleChange("assurance", value);
                    }}
                    options={["CNAS", "CASNOS", "Privée", "Aucune"]}
                    prefixIcon="shield-checkmark-outline"
                    containerStyle={styles.field}
                  />
                  <NumberField
                    label="N° Assurance"
                    value={formData.numeroAssurance}
                    onChangeText={(value) =>
                      handleChange("numeroAssurance", value)
                    }
                    placeholder="Entrez le numéro d'assurance"
                    prefixIcon="card-outline"
                    containerStyle={styles.field}
                    maxLength={15}
                  />
                </View>

                {/* Contact */}
                <View style={styles.row}>
                  <PhoneField
                    label="Téléphone"
                    value={formData.telephone}
                    onChangeText={(value) => handleChange("telephone", value)}
                    error={errors.telephone}
                    required
                    containerStyle={styles.field}
                  />
                  <TextField
                    label="Adresse"
                    value={formData.adresse}
                    onChangeText={(value) => handleChange("adresse", value)}
                    placeholder="Entrez l'adresse"
                    prefixIcon="home-outline"
                    containerStyle={styles.field}
                  />
                </View>
              </View>
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.secondary]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primary]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                Enregistrer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PatientForm;