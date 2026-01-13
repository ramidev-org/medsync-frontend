import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DatePickerFieldProps = {
  label: string;
  date: Date;
  setDate: (date: Date) => void;
};

export default function DatePickerField({
  label,
  date,
  setDate,
}: DatePickerFieldProps) {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <View>
      {/* Visible button */}
      <TouchableOpacity
        style={[
          styles.dateInputWrapper,
          {
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => inputRef.current?.showPicker()}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={theme.colors.textSecondary}
        />
        <Text style={{ color: theme.colors.text }}>{formatDate(date)}</Text>
      </TouchableOpacity>

      {/* Hidden native web input */}
      <input
        ref={inputRef}
        type="date"
        value={date.toISOString().split("T")[0]}
        onChange={(e) => setDate(new Date(e.target.value))}
        onWheel={(e) => {
          e.currentTarget.blur(); // 🔥 stops scroll changing date
        }}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </View>
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
    padding: 20,
    minWidth: 320,
    borderWidth: 1,
  },

  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
