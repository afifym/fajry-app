import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { Platform, StyleSheet, View } from "react-native";

type Props = {
  value: Date;
  onValueChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
};

/** Inline iOS wheel / Material time picker — dark theme, gold accent. */
export function TimeWheelPicker({
  value,
  onValueChange,
  minimumDate,
  maximumDate,
  disabled,
}: Props) {
  return (
    <View style={s.wrap}>
      <DateTimePicker
        value={value}
        mode="time"
        display="spinner"
        themeVariant="dark"
        accentColor="#C9A84C"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        disabled={disabled}
        presentation={Platform.OS === "android" ? "inline" : undefined}
        onValueChange={(_, date) => onValueChange(date)}
        style={s.picker}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  picker: { width: "100%", height: 216 },
});
