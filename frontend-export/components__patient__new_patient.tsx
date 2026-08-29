import {
  DateField,
  Dropdown,
  NumberField,
  PhoneField,
  TextField,
} from "@/components/common/input_fields";
import { useAuth } from "@/contexts/auth_context";
import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { callRpc } from "@/services/backend";

// Database enum types
type SexEnum = 'male' | 'female';
type BloodTypeEnum = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
type MaritalStatusEnum = 'single' | 'married' | 'divorced';

const SEX_OPTIONS: SexEnum[] = ['male', 'female'];
const BLOOD_TYPE_OPTIONS: BloodTypeEnum[] = [
  'A+', 'A-', 
  'B+', 'B-', 
  'AB+', 'AB-', 
  'O+', 'O-'
];
const MARITAL_STATUS_OPTIONS: { value: MaritalStatusEnum; label: string }[] = [
  { value: 'single', label: 'Célibataire' },
  { value: 'married', label: 'Marié' },
  { value: 'divorced', label: 'Divorcé' }
];

interface PatientFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PatientFormWithMedical: React.FC<PatientFormProps> = ({ 
  visible, 
  onClose,
  onSuccess 
}) => {
  const { theme } = useTheme();
  const { session, user } = useAuth();

  const [activeTab, setActiveTab] = useState<"patient" | "address" | "medical">("patient");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Patient info
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    placeOfBirth: "",
    sex: "" as SexEnum | "",
    maritalStatus: "" as MaritalStatusEnum | "",
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
    bloodType: "" as BloodTypeEnum | "",
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
    if (!formData.placeOfBirth.trim())
      newErrors.placeOfBirth = "Le lieu de naissance est requis";
    if (!formData.sex) newErrors.sex = "Le sexe est requis";
    if (!formData.maritalStatus) newErrors.maritalStatus = "La situation familiale est requise";
    if (!formData.phone.trim())
      newErrors.phone = "Le téléphone est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      placeOfBirth: "",
      sex: "" as SexEnum | "",
      maritalStatus: "" as MaritalStatusEnum | "",
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
      height: "",
      weight: "",
      bloodType: "" as BloodTypeEnum | "",
      allergies: "",
      chronicDiseases: "",
      medications: "",
      disabilities: "",
    });
    setErrors({});
    setActiveTab("patient");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Switch to patient tab if there are validation errors
      setActiveTab("patient");
      Alert.alert(
        "Erreur de validation",
        "Veuillez remplir tous les champs obligatoires."
      );
      return;
    }

    if (!session?.access_token || !user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté pour ajouter un patient.");
      return;
    }

    setIsSubmitting(true);

    try {
      const toTextArrayOrNull = (raw: string): string[] | null => {
        const items = raw
          ? raw
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        return items.length > 0 ? items : null;
      };

      const asNumberOrNull = (raw: string): number | null => {
        const n = raw.trim() ? Number(raw) : NaN;
        return Number.isFinite(n) ? n : null;
      };

      // rpc_create_patient returns the new patient uuid.
      const patientId = await callRpc<string, Record<string, unknown>>("rpc_create_patient", {
        p_created_by: user!.id,
        p_first_name: formData.firstName.trim(),
        p_last_name: formData.lastName.trim(),
        p_date_of_birth: formData.dateOfBirth.trim(),
        p_place_of_birth: formData.placeOfBirth.trim(),
        p_sex: formData.sex as any,
        p_marital_status: formData.maritalStatus as any,
        p_phone: formData.phone.trim() || null,
        p_email: formData.email.trim() || null,
        p_address_street: formData.addressStreet.trim() || null,
        p_address_city: formData.addressCity.trim() || null,
        p_address_state: formData.addressState.trim() || null,
        p_emergency_contact_name: formData.emergencyContactName.trim() || null,
        p_emergency_contact_relationship: formData.emergencyContactRelationship.trim() || null,
        p_emergency_contact_phone: formData.emergencyContactPhone.trim() || null,
        p_insurance_provider: formData.insuranceProvider.trim() || null,
        p_insurance_policy_number: formData.insurancePolicyNumber.trim() || null,
        p_blood_type: (formData.bloodType || null) as any,
        p_allergies: toTextArrayOrNull(formData.allergies),
        p_chronic_diseases: toTextArrayOrNull(formData.chronicDiseases),
        p_medications: toTextArrayOrNull(formData.medications),
        p_disabilities: toTextArrayOrNull(formData.disabilities),
        p_height: asNumberOrNull(formData.height),
        p_weight: asNumberOrNull(formData.weight),
      });

      if (!patientId) throw new Error("Patient created but no id was returned.");

      // Success
      resetForm();
      onClose();
      onSuccess?.();
      
      Alert.alert(
        "Succès",
        "Le patient a été ajouté avec succès."
      );
    } catch (error) {
      console.error("Error adding patient:", error);

      const rawMessage =
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de l'ajout du patient. Veuillez reessayer.";

      let friendly = rawMessage;

      if (
        rawMessage.includes("patients_email_key") ||
        rawMessage.toLowerCase().includes("duplicate key")
      ) {
        friendly = "Cette adresse email est deja utilisee par un autre patient.";
        setErrors({ email: "Email deja utilise" });
        setActiveTab("patient");
      } else if (rawMessage.includes("patients_phone_key")) {
        friendly = "Ce numero de telephone est deja utilise par un autre patient.";
        setErrors({ phone: "Telephone deja utilise" });
        setActiveTab("patient");
      }

      Alert.alert("Erreur", friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
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
      height: 600,
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
      minHeight: 0,
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
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    primary: {
      backgroundColor: theme.colors.primary,
    },
    primaryDisabled: {
      backgroundColor: theme.colors.primary,
      opacity: 0.6,
    },
    secondary: {
      borderWidth: 2,
      borderColor: theme.colors.border,
    },
    secondaryDisabled: {
      borderWidth: 2,
      borderColor: theme.colors.border,
      opacity: 0.5,
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
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      zIndex: 999,
    },
    loadingContainer: {
      backgroundColor: theme.colors.background,
      padding: 24,
      borderRadius: 12,
      alignItems: "center",
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: "600",
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
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "patient" && styles.tabActive]}
              onPress={() => setActiveTab("patient")}
              disabled={isSubmitting}
            >
              <Text style={styles.tabText}>Identité</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "address" && styles.tabActive]}
              onPress={() => setActiveTab("address")}
              disabled={isSubmitting}
            >
              <Text style={styles.tabText}>Adresse & Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "medical" && styles.tabActive]}
              onPress={() => setActiveTab("medical")}
              disabled={isSubmitting}
            >
              <Text style={styles.tabText}>Informations Médicales</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formWrapper}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEnabled={!isSubmitting}
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
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Prénom"
                        value={formData.lastName}
                        onChangeText={(v) => handleChange("lastName", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.lastName}
                        editable={!isSubmitting}
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
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Lieu de naissance"
                        value={formData.placeOfBirth}
                        onChangeText={(v) => handleChange("placeOfBirth", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.placeOfBirth}
                        editable={!isSubmitting}
                      />
                    </View>

                    {/* Sex & Marital Status */}
                    <View style={styles.row}>
                      <Dropdown
                        label="Sexe"
                        value={formData.sex}
                        onChange={(v) => handleChange("sex", v)}
                        options={SEX_OPTIONS}
                        containerStyle={styles.field}
                        required
                        error={errors.sex}
                      />
                      <Dropdown
                        label="État civil"
                        value={formData.maritalStatus}
                        onChange={(v) => handleChange("maritalStatus", v)}
                        options={MARITAL_STATUS_OPTIONS.map(o => o.value)}
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
                        editable={!isSubmitting}
                      />
                    </View>
                  </>
                ) : activeTab === "address" ? (
                  <>
                    {/* Contact */}
                    <View style={styles.row}>
                      <PhoneField
                        label="Téléphone"
                        value={formData.phone}
                        onChangeText={(v) => handleChange("phone", v)}
                        containerStyle={styles.field}
                        required
                        error={errors.phone}
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Email"
                        value={formData.email}
                        onChangeText={(v) => handleChange("email", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                    </View>

                    {/* Address */}
                    <View style={styles.row}>
                      <TextField
                        label="Rue"
                        value={formData.addressStreet}
                        onChangeText={(v) => handleChange("addressStreet", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Ville"
                        value={formData.addressCity}
                        onChangeText={(v) => handleChange("addressCity", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="État"
                        value={formData.addressState}
                        onChangeText={(v) => handleChange("addressState", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
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
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Relation"
                        value={formData.emergencyContactRelationship}
                        onChangeText={(v) =>
                          handleChange("emergencyContactRelationship", v)
                        }
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                      <PhoneField
                        label="Téléphone contact"
                        value={formData.emergencyContactPhone}
                        onChangeText={(v) =>
                          handleChange("emergencyContactPhone", v)
                        }
                        containerStyle={styles.field}
                        editable={!isSubmitting}
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
                        editable={!isSubmitting}
                      />
                      <NumberField
                        label="Poids (kg)"
                        value={formData.weight}
                        onChangeText={(v) => handleChange("weight", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                      <Dropdown
                        label="Groupe sanguin"
                        value={formData.bloodType}
                        onChange={(v) => handleChange("bloodType", v)}
                        options={BLOOD_TYPE_OPTIONS}
                        containerStyle={styles.field}
                      />
                    </View>

                    <View style={styles.row}>
                      <TextField
                        label="Allergies (séparées par une virgule)"
                        value={formData.allergies}
                        onChangeText={(v) => handleChange("allergies", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Maladies chroniques"
                        value={formData.chronicDiseases}
                        onChangeText={(v) => handleChange("chronicDiseases", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                    </View>

                    <View style={styles.row}>
                      <TextField
                        label="Médications"
                        value={formData.medications}
                        onChangeText={(v) => handleChange("medications", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
                      />
                      <TextField
                        label="Handicaps / Disabilities"
                        value={formData.disabilities}
                        onChangeText={(v) => handleChange("disabilities", v)}
                        containerStyle={styles.field}
                        editable={!isSubmitting}
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
              style={[
                styles.button,
                isSubmitting ? styles.secondaryDisabled : styles.secondary,
              ]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Annuler
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                isSubmitting ? styles.primaryDisabled : styles.primary,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <ActivityIndicator size="small" color="#fff" />
              )}
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {isSubmitting && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>
                  Ajout du patient en cours...
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PatientFormWithMedical;
