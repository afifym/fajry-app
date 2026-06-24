import { useMemo, useState } from 'react';
import {FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View, Text} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


import { HomeBg } from '@/components/HomeBg';
import { GlassModalBackdrop } from '@/components/GlassModalBackdrop';
import { Icon, X } from '@/components/Icon';
import { Palette, Radius } from '@/constants/theme';
import type { City } from '@/types';
import { searchCities } from '@/utils/location';

type CitySearchListProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (city: City) => void;
  autoFocus?: boolean;
  searchPlaceholder?: string;
};

export const CitySearchList = ({
  query,
  onQueryChange,
  onSelect,
  autoFocus = false,
  searchPlaceholder = 'Search city…',
}: CitySearchListProps) => {
  const cityResults = useMemo(
    () => (query.length >= 2 ? searchCities(query) : []),
    [query],
  );

  return (
    <>
      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={Palette.textMuted}
          value={query}
          onChangeText={onQueryChange}
          autoFocus={autoFocus}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="City search"
        />
      </View>

      <FlatList<City>
        data={cityResults}
        keyExtractor={(item) => `${item.lat}_${item.lng}`}
        renderItem={({ item }) => (
          <Pressable
            style={s.cityRow}
            onPress={() => onSelect(item)}
            accessibilityLabel={`${item.name}, ${item.country}`}
          >
            <Text style={s.cityName}>{item.name}</Text>
            <Text style={s.cityCountry}>{item.country}</Text>
          </Pressable>
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={s.searchHint}>
            {query.length >= 2
              ? 'No cities found.'
              : 'Type at least 2 characters to search.'}
          </Text>
        }
      />
    </>
  );
};

type CityPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City) => void;
  title: string;
  closeLabel?: string;
  presentationStyle?: 'fullScreen' | 'pageSheet';
};

export const CityPickerModal = ({
  visible,
  onClose,
  onSelect,
  title,
  closeLabel = 'close',
  presentationStyle = 'fullScreen',
}: CityPickerModalProps) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  function handleClose() {
    setQuery('');
    onClose();
  }

  function handleSelect(city: City) {
    setQuery('');
    onSelect(city);
  }

  const content = (
    <>
      <View style={s.header}>
        <Text style={s.title}>{title}</Text>
        <Pressable
          onPress={handleClose}
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

      <CitySearchList
        query={query}
        onQueryChange={setQuery}
        onSelect={handleSelect}
        autoFocus
      />
    </>
  );

  const blurOverlay = presentationStyle === 'fullScreen';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={blurOverlay}
      presentationStyle={blurOverlay ? 'overFullScreen' : presentationStyle}
      statusBarTranslucent={blurOverlay}
      onRequestClose={handleClose}
    >
      {blurOverlay ? (
        <View style={s.blurRoot}>
          <GlassModalBackdrop />
          <KeyboardAvoidingView
            style={[s.flex, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {content}
          </KeyboardAvoidingView>
        </View>
      ) : (
        <SafeAreaView style={s.root}>
          <HomeBg />
          <KeyboardAvoidingView
            style={s.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {content}
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </Modal>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  blurRoot: { flex: 1 },
  flex: { flex: 1 },

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

  searchWrap: { paddingHorizontal: 24, paddingVertical: 16 },
  searchInput: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.glassOutline,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: Palette.text,
    fontSize: 16,
  },

  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.bgInset,
  },
  cityName: { color: Palette.text, fontSize: 16 },
  cityCountry: { color: Palette.textMuted, fontSize: 13 },
  searchHint: {
    color: Palette.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
