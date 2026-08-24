import { FontAwesome5 } from "@expo/vector-icons";
import { View } from "react-native";

export function PrescriptionBottlePillIcon({
  size = 72,
  color = "#AAB9D2",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FontAwesome5
        name="prescription-bottle-alt"
        solid
        size={size * 0.78}
        color={color}
        style={{ transform: [{ translateX: -size * 0.06 }] }}
      />
      <FontAwesome5
        name="capsules"
        solid
        size={size * 0.34}
        color={color}
        style={{
          position: "absolute",
          right: 0,
          bottom: size * 0.04,
          textShadowColor: "#F8FAFE",
          textShadowOffset: { width: -2, height: -2 },
          textShadowRadius: 1,
        }}
      />
    </View>
  );
}
