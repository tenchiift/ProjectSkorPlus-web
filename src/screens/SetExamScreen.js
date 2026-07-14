import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, Clock, Trash2 } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';
import theme from '../styles/theme';

export default function SetExamScreen({ navigation, route }) {
  const { theme: t } = useTheme();
  const existing = route?.params?.countdown;

  const [examTitle, setExamTitle] = useState(existing?.title ?? '');
  const [examDate, setExamDate] = useState(existing ? new Date(existing.exam_date) : new Date());
  const [examTime, setExamTime] = useState(existing ? new Date(existing.exam_date) : (() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; })());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!examTitle.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const d = examDate;
      const t = examTime;
      const datetime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes());
      const dateStr = datetime.toISOString();

      if (existing?.id) {
        await supabase.from('exam_countdowns').update({ title: examTitle.trim(), exam_date: dateStr }).eq('id', existing.id);
      } else {
        await supabase.from('exam_countdowns').insert({ user_id: user.id, title: examTitle.trim(), exam_date: dateStr });
      }

      navigation.goBack();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Exam', 'Are you sure you want to remove this exam countdown?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('exam_countdowns').delete().eq('id', existing.id);
          navigation.goBack();
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={t.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>
          {existing ? 'Edit Exam' : 'Set Exam'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.label, { color: t.colors.textSecondary }]}>EXAM TITLE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: t.colors.surface, borderColor: t.colors.border, color: t.colors.textPrimary }]}
          value={examTitle}
          onChangeText={setExamTitle}
          placeholder="e.g. Calculus I Final Exam"
          placeholderTextColor={t.colors.textSecondary}
        />

        <Text style={[styles.label, { color: t.colors.textSecondary }]}>DATE & TIME</Text>

        <TouchableOpacity
          style={[styles.pickerBtn, { backgroundColor: t.colors.surface }]}
          onPress={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); }}
        >
          <Calendar size={18} color={t.colors.primary} />
          <Text style={[styles.pickerBtnText, { color: t.colors.textPrimary }]}>
            {examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={examDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(e, d) => { if (e.type !== 'dismissed' && d) setExamDate(d); if (Platform.OS === 'android') setShowDatePicker(false); }}
            minimumDate={new Date()}
          />
        )}

        <TouchableOpacity
          style={[styles.pickerBtn, { backgroundColor: t.colors.surface }]}
          onPress={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); }}
        >
          <Clock size={18} color={t.colors.primary} />
          <Text style={[styles.pickerBtnText, { color: t.colors.textPrimary }]}>
            {examTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={examTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => { if (e.type !== 'dismissed' && d) setExamTime(d); if (Platform.OS === 'android') setShowTimePicker(false); }}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: t.colors.primary }]} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {existing && (
          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: t.colors.error }]}
            onPress={handleDelete}
          >
            <Trash2 size={16} color={t.colors.error} />
            <Text style={[styles.deleteBtnText, { color: t.colors.error }]}>Delete Exam</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: t.colors.primary }, (!examTitle.trim() || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!examTitle.trim() || saving}
        >
          <Text style={styles.saveBtnText}>{existing ? 'Save Changes' : 'Set Exam Date'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  label: { fontFamily: theme.fonts.bodyBold, fontSize: 11, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm, letterSpacing: 1 },
  input: {
    borderWidth: 1, borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontFamily: theme.fonts.body, fontSize: 15,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm,
  },
  pickerBtnText: { fontFamily: theme.fonts.body, fontSize: 15 },
  saveBtn: {
    marginTop: theme.spacing.xl, paddingVertical: 16,
    borderRadius: theme.borderRadius.full, alignItems: 'center',
  },
  saveBtnText: { fontFamily: theme.fonts.headingBold, fontSize: 16, color: '#FFFFFF' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md, paddingVertical: 14, borderRadius: theme.borderRadius.full, borderWidth: 1.5 },
  deleteBtnText: { fontFamily: theme.fonts.headingBold, fontSize: 14 },
  pickerWrap: { marginBottom: theme.spacing.sm },
  doneBtn: { paddingVertical: 10, borderRadius: theme.borderRadius.full, alignItems: 'center', marginTop: theme.spacing.sm },
  doneBtnText: { fontFamily: theme.fonts.headingBold, fontSize: 14, color: '#FFFFFF' },
});
