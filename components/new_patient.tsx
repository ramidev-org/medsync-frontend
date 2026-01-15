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

const PatientFormWithMedical: React.FC<PatientFormProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();

  const [activeTab, setActiveTab] = useState<"patient" | "medical">("patient");

  const [formData, setFormData] = useState({
    // Patient info
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    placeOfBirth: "",
    sex: "",
    phone: "",
    email: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",

    // Medical info
    height: "",
    weight: "",
    bloodType: "",
    allergies: "",
    chronicDiseases: "",
    medications: "",
    disabilities: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
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
    if (!formData.firstName.trim()) newErrors.firstName = "Le nom est requis";
    if (!formData.lastName.trim()) newErrors.lastName = "Le prénom est requis";
    if (!formData.dateOfBirth.trim())
      newErrors.dateOfBirth = "La date de naissance est requise";
    if (!formData.sex) newErrors.sex = "Le sexe est requis";
    if (!formData.phone.trim())
      newErrors.phone = "Le téléphone est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log("Patient data:", formData);
      // TODO:
      // 1️⃣ Insert patient info into `patients` table
      // 2️⃣ Insert medical info into `patient_medical_info` table
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
      height: 800, // FIXED height
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      overflow: "hidden",
    },
    formWrapper: {
      flex: 1,
      overflow: "visible",
    },
    form: {
      padding: 24,
      minHeight: 0, // prevents ScrollView from collapsing
    },

    header: {
      backgroundColor: theme.colors.primary,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      flex: 1,
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabButton: {
      flex: 1,
      padding: 14,
      alignItems: "center",
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: "600",
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
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <Text style={styles.title}>Ajouter un patient</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "patient" && styles.tabActive]}
              onPress={() => setActiveTab("patient")}
            >
              <Text style={styles.tabText}>Patient Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "medical" && styles.tabActive]}
              onPress={() => setActiveTab("medical")}
            >
              <Text style={styles.tabText}>Medical Info</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formWrapper}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.form}>
                {activeTab === "patient" ? (
                  <>
                    {/* Names */}
                    <View style={styles.row}>
                      <TextField
                        label="Nom"
                        value={formData.firstName}
                        onChangeText={(v) => handleChange("firstName", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.firstName}
                      />
                      <TextField
                        label="Prénom"
                        value={formData.lastName}
                        onChangeText={(v) => handleChange("lastName", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.lastName}
                      />
                    </View>

                    {/* Birth */}
                    <View style={styles.row}>
                      <DateField
                        label="Date de naissance"
                        value={formData.dateOfBirth}
                        onChangeText={(v) => handleChange("dateOfBirth", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.dateOfBirth}
                      />
                      <TextField
                        label="Lieu de naissance"
                        value={formData.placeOfBirth}
                        onChangeText={(v) => handleChange("placeOfBirth", v)}
                        containerStyle={styles.field}
                      />
                    </View>

                    {/* Sex */}
                    <View style={styles.row}>
                      <Dropdown
                        label="Sexe"
                        value={formData.sex}
                        onChange={(v) => handleChange("sex", v)}
                        options={["male", "female"]}
                        containerStyle={styles.field}
                        required
                        error={errors.sex}
                      />
                    </View>

                    {/* Contact */}
                    <View style={styles.row}>
                      <PhoneField
                        label="Téléphone"
                        value={formData.phone}
                        onChangeText={(v) => handleChange("phone", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.phone}
                      />
                      <TextField
                        label="Email"
                        value={formData.email}
                        onChangeText={(v) => handleChange("email", v)}
                        containerStyle={styles.field}
                      />
                    </View>

                    {/* Address */}
                    <View style={styles.row}>
                      <TextField
                        label="Rue"
                        value={formData.addressStreet}
                        onChangeText={(v) => handleChange("addressStreet", v)}
                        containerStyle={styles.field}
                      />
                      <TextField
                        label="Ville"
                        value={formData.addressCity}
                        onChangeText={(v) => handleChange("addressCity", v)}
                        containerStyle={styles.field}
                      />
                      <TextField
                        label="État"
                        value={formData.addressState}
                        onChangeText={(v) => handleChange("addressState", v)}
                        containerStyle={styles.field}
                      />
                    </View>

                    {/* Emergency Contact */}
                    <View style={styles.row}>
                      <TextField
                        label="Nom contact urgence"
                        value={formData.emergencyContactName}
                        onChangeText={(v) =>
                          handleChange("emergencyContactName", v)
                        }
                        containerStyle={styles.field}
                      />
                      <TextField
                        label="Relation"
                        value={formData.emergencyContactRelationship}
                        onChangeText={(v) =>
                          handleChange("emergencyContactRelationship", v)
                        }
                        containerStyle={styles.field}
                      />
                      <PhoneField
                        label="Téléphone contact"
                        value={formData.emergencyContactPhone}
                        onChangeText={(v) =>
                          handleChange("emergencyContactPhone", v)
                        }
                        containerStyle={styles.field}
                      />
                    </View>

                    {/* Insurance */}
                    <View style={styles.row}>
                      <Dropdown
                        label="Assurance"
                        value={formData.insuranceProvider}
                        onChange={(v) => handleChange("insuranceProvider", v)}
                        options={["CNAS", "CASNOS", "Privée", "Aucune"]}
                        containerStyle={styles.field}
                      />
                      <NumberField
                        label="N° Assurance"
                        value={formData.insurancePolicyNumber}
                        onChangeText={(v) =>
                          handleChange("insurancePolicyNumber", v)
                        }
                        containerStyle={styles.field}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    {/* Medical Info */}
                    <View style={styles.row}>
                      <NumberField
                        label="Taille (cm)"
                        value={formData.height}
                        onChangeText={(v) => handleChange("height", v)}
                        containerStyle={styles.field}
                      />
                      <NumberField
                        label="Poids (kg)"
                        value={formData.weight}
                        onChangeText={(v) => handleChange("weight", v)}
                        containerStyle={styles.field}
                      />
                      <Dropdown
                        label="Groupe sanguin"
                        value={formData.bloodType}
                        onChange={(v) => handleChange("bloodType", v)}
                        options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                        containerStyle={styles.field}
                      />
                    </View>

                    <View style={styles.row}>
                      <TextField
                        label="Allergies (séparées par une virgule)"
                        value={formData.allergies}
                        onChangeText={(v) => handleChange("allergies", v)}
                        containerStyle={styles.field}
                      />
                      <TextField
                        label="Maladies chroniques"
                        value={formData.chronicDiseases}
                        onChangeText={(v) => handleChange("chronicDiseases", v)}
                        containerStyle={styles.field}
                      />
                    </View>

                    <View style={styles.row}>
                      <TextField
                        label="Médications"
                        value={formData.medications}
                        onChangeText={(v) => handleChange("medications", v)}
                        containerStyle={styles.field}
                      />
                      <TextField
                        label="Handicaps / Disabilities"
                        value={formData.disabilities}
                        onChangeText={(v) => handleChange("disabilities", v)}
                        containerStyle={styles.field}
                      />
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>

          {/* Actions */}
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

export default PatientFormWithMedical;
