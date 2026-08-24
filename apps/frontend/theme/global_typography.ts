import { Text, TextInput } from "react-native";

type ComponentWithDefaults = {
  defaultProps?: Record<string, unknown>;
};

function applyDefaultFont(component: ComponentWithDefaults) {
  const defaults = component.defaultProps ?? {};
  const existingStyle = defaults.style;
  component.defaultProps = {
    ...defaults,
    style: [{ fontFamily: "Inter_400Regular" }, existingStyle],
  };
}

// React Native does not inherit font families through View containers. Applying
// the family at the base Text components keeps typography consistent across the
// native, web, and desktop builds; explicit component styles can still override it.
applyDefaultFont(Text as unknown as ComponentWithDefaults);
applyDefaultFont(TextInput as unknown as ComponentWithDefaults);
