import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { StyleSheet, View } from "react-native";

import { Palette } from "@/constants/theme";

export type TimeWheelPickerProps = {
  value: Date;
  onValueChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
};

export function TimeWheelPicker({
  value,
  onValueChange,
  minimumDate,
  maximumDate,
  disabled,
}: TimeWheelPickerProps) {
  return (
    <View style={[s.wrap, disabled && s.disabled]}>
      <DateTimePicker
        value={value}
        mode="time"
        display="spinner"
        locale="en_US"
        themeVariant="dark"
        accentColor={Palette.gold}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        disabled={disabled}
        onValueChange={(_, date) => onValueChange(date)}
        style={s.picker}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  disabled: { opacity: 0.4 },
  picker: { width: "100%", height: 216 },
});
