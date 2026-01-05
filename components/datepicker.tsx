import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DatePickerFieldProps = {
  label: string;
  date: Date;
  setDate: (date: Date) => void;
};

export default function DatePickerField({ label, date, setDate }: DatePickerFieldProps) {
  const { theme } = useTheme(); // <-- use theme directly
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <>
      <TouchableOpacity
        style={[styles.dateInputWrapper, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
        <Text style={{ color: theme.colors.text }}>{formatDate(date)}</Text>
      </TouchableOpacity>

      <Modal transparent visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.datePickerContainer,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.datePickerHeader}>
                <Text style={[styles.datePickerTitle, { color: theme.colors.text }]}>{label}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <DayPicker
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d);
                    setShowPicker(false);
                  }
                }}
                defaultMonth={date}
                // Optionally style the selected day with your theme
                styles={{
                  caption: { color: theme.colors.text },
                  day: { color: theme.colors.text },
                  day_selected: { backgroundColor: theme.colors.primary, color: "#fff" },
                }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  datePickerContainer: {
    borderRadius: 16,
    padding: 24,
    minWidth: 350,
    maxWidth: 450,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
