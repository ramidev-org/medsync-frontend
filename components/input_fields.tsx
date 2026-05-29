import { useTheme } from "@/theme/theme_provider";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown as RNDropdown } from "react-native-element-dropdown";


// ============================================
// TextField Component
// ============================================
interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  suffixIcon?: keyof typeof Ionicons.glyphMap;
  onSuffixPress?: () => void;
  containerStyle?: object;
  inputStyle?: TextInputProps["style"];
  required?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  prefixIcon,
  suffixIcon,
  onSuffixPress,
  containerStyle,
  inputStyle,
  required = false,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    labelContainer: {
      flexDirection: "row",
      marginBottom: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.error || "#ef4444",
      marginLeft: 2,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderRadius: 8,
      backgroundColor: theme.colors.background,
      borderColor: error
        ? theme.colors.error || "#ef4444"
        : isFocused
        ? theme.colors.primary
        : theme.colors.border,
    },
    prefixIcon: {
      paddingLeft: 12,
    },
    input: {
      flex: 1,
      padding: 14,
      fontSize: 15,
      color: theme.colors.text,
      ...(Platform.OS === "web" && {
        outlineStyle: "solid",
        outlineWidth: 0,
        outlineColor: "transparent",
      }),
    },
    suffixIcon: {
      paddingRight: 12,
    },
    error: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.error || "#ef4444",
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      <View style={styles.inputWrapper}>
        {prefixIcon && (
          <View style={styles.prefixIcon}>
            <Ionicons
              name={prefixIcon}
              size={20}
              color={
                error
                  ? theme.colors.error || "#ef4444"
                  : isFocused
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
          </View>
        )}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {suffixIcon && (
          <TouchableOpacity
            style={styles.suffixIcon}
            onPress={onSuffixPress}
            disabled={!onSuffixPress}
          >
            <Ionicons
              name={suffixIcon}
              size={20}
              color={
                error
                  ? theme.colors.error || "#ef4444"
                  : isFocused
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

// ============================================
// NumberField Component (digits only)
// ============================================
interface NumberFieldProps extends Omit<TextFieldProps, "keyboardType"> {
  maxLength?: number;
  allowDecimal?: boolean;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  allowDecimal = false,
  value,
  onChangeText,
  ...props
}) => {
  const handleChange = (text: string) => {
    const regex = allowDecimal ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
    if (regex.test(text)) {
      onChangeText?.(text);
    }
  };

  return (
    <TextField
      {...props}
      value={value}
      onChangeText={handleChange}
      keyboardType="numeric"
    />
  );
};

// ============================================
// PhoneField Component
// ============================================
interface PhoneFieldProps extends Omit<TextFieldProps, "keyboardType"> {
  countryCode?: string;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  countryCode = "+213",
  value,
  onChangeText,
  ...props
}) => {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    onChangeText?.(cleaned);
  };

  return (
    <NumberField
      {...props}
      prefixIcon="call-outline"
      value={value}
      onChangeText={handleChange}
      placeholder={`${countryCode} 555 123 456`}
      maxLength={10}
    />
  );
};

// ============================================
// PasswordField Component
// ============================================
interface PasswordFieldProps extends Omit<TextFieldProps, "secureTextEntry"> {}

export const PasswordField: React.FC<PasswordFieldProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...props}
      prefixIcon="lock-closed-outline"
      suffixIcon={showPassword ? "eye-off-outline" : "eye-outline"}
      onSuffixPress={() => setShowPassword(!showPassword)}
      secureTextEntry={!showPassword}
    />
  );
};

// ============================================
// EmailField Component
// ============================================
interface EmailFieldProps extends Omit<TextFieldProps, "keyboardType"> {}

export const EmailField: React.FC<EmailFieldProps> = (props) => {
  return (
    <TextField
      {...props}
      prefixIcon="mail-outline"
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
};

// ============================================
// SearchField Component
// ============================================
interface SearchFieldProps extends Omit<TextFieldProps, "keyboardType"> {
  onClear?: () => void;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onClear,
  ...props
}) => {
  return (
    <TextField
      {...props}
      value={value}
      prefixIcon="search-outline"
      suffixIcon={value ? "close-circle" : undefined}
      onSuffixPress={onClear}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
};

// ============================================
// TextArea Component
// ============================================
interface TextAreaProps extends Omit<TextFieldProps, "multiline"> {
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({ rows = 4, ...props }) => {
  return (
    <TextField
      {...props}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      inputStyle={{
        minHeight: rows * 24,
        paddingTop: 12,
      }}
    />
  );
};

// ============================================
// Dropdown Component
// ============================================

interface DropdownProps {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  prefixIcon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: object;
  required?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Sélectionner...",
  error,
  prefixIcon,
  containerStyle,
  required = false,
}) => {
  const { theme } = useTheme();
  const [isFocus, setIsFocus] = useState(false);

  const data = options.map((opt) => ({
    label: opt,
    value: opt,
  }));

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      position: "relative",
    },
    labelContainer: {
      flexDirection: "row",
      marginBottom: 6,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
    },
    required: {
      color: theme.colors.error || "#ef4444",
      marginLeft: 2,
    },
    dropdown: {
      height: 52,
      borderWidth: 1.5,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.background,
      borderColor: error
        ? theme.colors.error || "#ef4444"
        : isFocus
        ? theme.colors.primary
        : theme.colors.border,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    placeholderStyle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    selectedTextStyle: {
      fontSize: 15,
      color: theme.colors.text,
    },
    error: {
      marginTop: 4,
      fontSize: 12,
      color: theme.colors.error || "#ef4444",
    },
    leftIcon: {
      marginRight: 8,
    },
  });

  return (
    <View
      style={[
        styles.container,
        isFocus
          ? {
              zIndex: 9999,
              elevation: 20,
            }
          : null,
        containerStyle,
      ]}
    >
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      <RNDropdown
        style={styles.dropdown}
        data={data}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value || null}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          onChange(item.value);
          setIsFocus(false);
        }}
        renderLeftIcon={() =>
          prefixIcon ? (
            <Ionicons
              name={prefixIcon}
              size={20}
              color={
                error
                  ? theme.colors.error || "#ef4444"
                  : isFocus
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
              style={styles.leftIcon}
            />
          ) : null
        }
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        iconColor={
          error
            ? theme.colors.error || "#ef4444"
            : isFocus
            ? theme.colors.primary
            : theme.colors.textSecondary
        }
        containerStyle={{
          borderRadius: 8,
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
          zIndex: 9999,
          elevation: 24,
        }}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

// ============================================
// DateField Component (basic text input for dates)
// ============================================
interface DateFieldProps extends Omit<TextFieldProps, "keyboardType"> {
  format?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
}

export const DateField: React.FC<DateFieldProps> = ({
  format = "DD/MM/YYYY",
  value,
  onChangeText,
  ...props
}) => {
  const handleChange = (text: string) => {
    // Remove non-numeric characters except /
    const cleaned = text.replace(/[^0-9/]/g, "");
    onChangeText?.(cleaned);
  };

  return (
    <TextField
      {...props}
      value={value}
      onChangeText={handleChange}
      prefixIcon="calendar-outline"
      placeholder={format}
      keyboardType="numeric"
      maxLength={10}
    />
  );
};


