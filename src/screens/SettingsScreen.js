import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, User, Palette, ChevronRight, Sun, Moon, Heart, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import theme from '../styles/theme';

const THEME_OPTIONS = [
  { mode: 'light', icon: Sun, label: 'Light', color: '#F2F2F0', accent: '#7C7BF0', hint: 'Bright & clean' },
  { mode: 'dark', icon: Moon, label: 'Dark', color: '#1A1A2E', accent: '#8B8AF5', hint: 'Easy on the eyes' },
  { mode: 'pink', icon: Heart, label: 'Soft Pink', color: '#FFF0F5', accent: '#E8879B', hint: 'Warm & cozy' },
];

export default function SettingsScreen({ navigation }) {
  const { theme: t, themeMode, setThemeMode } = useTheme();
  const [themeModal, setThemeModal] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={t.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: t.colors.surface }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.rowIcon, { backgroundColor: t.colors.primary }]}>
              <User size={20} color="#FFFFFF" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: t.colors.textPrimary }]}>Profile</Text>
              <Text style={[styles.rowHint, { color: t.colors.textSecondary }]}>Manage your account details</Text>
            </View>
            <ChevronRight size={18} color={t.colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: t.colors.border }]} />

          <TouchableOpacity
            style={styles.row}
            onPress={() => setThemeModal(true)}
          >
            <View style={[styles.rowIcon, { backgroundColor: t.colors.secondary }]}>
              <Palette size={20} color="#FFFFFF" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: t.colors.textPrimary }]}>App Theme</Text>
              <Text style={[styles.rowHint, { color: t.colors.textSecondary }]}>
                {themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'Soft Pink'}
              </Text>
            </View>
            <ChevronRight size={18} color={t.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Theme Modal */}
      <Modal visible={themeModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setThemeModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: t.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.colors.textPrimary }]}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setThemeModal(false)}>
                <X size={20} color={t.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = themeMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={styles.themeRow}
                  onPress={() => { setThemeMode(opt.mode); setThemeModal(false); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.themePreview, { backgroundColor: opt.color, borderColor: opt.accent }]}>
                    <Icon size={18} color={opt.accent} />
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeLabel, { color: t.colors.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.themeHint, { color: t.colors.textSecondary }]}>{opt.hint}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: active ? t.colors.primary : t.colors.border }]}>
                    {active && <View style={[styles.radioFill, { backgroundColor: t.colors.primary }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md,
  },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: theme.fonts.headingBold, fontSize: 18 },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, paddingTop: theme.spacing.sm },
  card: { borderRadius: theme.borderRadius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: theme.spacing.lg, gap: theme.spacing.md,
  },
  rowIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontFamily: theme.fonts.headingBold, fontSize: 15, marginBottom: 2 },
  rowHint: { fontFamily: theme.fonts.body, fontSize: 12 },
  divider: { height: 1, marginHorizontal: theme.spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: theme.spacing.lg },
  modalContent: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg,
  },
  modalTitle: { fontFamily: theme.fonts.headingBold, fontSize: 18 },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.sm,
  },
  themePreview: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  themeInfo: { flex: 1 },
  themeLabel: { fontFamily: theme.fonts.headingBold, fontSize: 15 },
  themeHint: { fontFamily: theme.fonts.body, fontSize: 12, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { width: 12, height: 12, borderRadius: 6 },
});
