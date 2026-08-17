import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeBg } from '@/components/HomeBg';
import { Check, Icon, X } from '@/components/Icon';
import { Palette } from '@/constants/theme';

type OptionPickerModalProps<T extends string> = {
  visible: boolean;
  title: string;
  options: { key: T; label: string }[];
  selectedKey: T;
  onClose: () => void;
  onSelect: (key: T) => void;
  closeLabel?: string;
  presentationStyle?: 'fullScreen' | 'pageSheet';
};

export function OptionPickerModal<T extends string>({
  visible,
  title,
  options,
  selectedKey,
  onClose,
  onSelect,
  closeLabel = 'Done',
  presentationStyle = 'pageSheet',
}: OptionPickerModalProps<T>) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.root}>
        <HomeBg />
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={s.closeBtn}
            accessibilityLabel="Close"
          >
            {closeLabel === 'Done' ? (
              <Text style={s.closeTextDone}>{closeLabel}</Text>
            ) : (
              <Icon icon={X} size={24} color={Palette.text} />
            )}
          </Pressable>
        </View>

        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const selected = item.key === selectedKey;
            return (
              <Pressable
                style={s.optionRow}
                onPress={() => onSelect(item.key)}
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
              >
                <Text style={[s.optionLabel, selected && s.optionLabelSelected]}>
                  {item.label}
                </Text>
                {selected ? (
                  <Icon icon={Check} size={18} color={Palette.gold} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.borderSubtle,
  },
  title: { color: Palette.text, fontSize: 20, fontWeight: '600' },
  closeBtn: { padding: 6 },
  closeTextDone: { color: Palette.gold, fontSize: 16 },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.bgInset,
  },
  optionLabel: { color: Palette.text, fontSize: 16, flex: 1, paddingRight: 12 },
  optionLabelSelected: { color: Palette.gold, fontWeight: '500' },
});
