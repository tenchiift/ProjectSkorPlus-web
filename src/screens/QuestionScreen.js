import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import theme from '../styles/theme';
import { vectorQuestions } from '../data/vectorQuestions';
import { supabase } from '../config/supabase';
import { updateModuleProgress } from '../services/moduleService';

export default function QuestionScreen({ navigation, route }) {
  const { theme: t } = useTheme();
  const moduleData = route?.params?.module ?? {};
  const questions = route?.params?.questions ?? vectorQuestions;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const total = questions.length;

  const persist = async (finalScore) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && moduleData.id) {
        await updateModuleProgress(user.id, moduleData.id, finalScore);
      }
    } catch (e) {
      // best-effort
    }
  };

  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const isRight = i === q.correctIndex;
    const nextCorrect = correct + (isRight ? 1 : 0);
    if (isRight) setCorrect(nextCorrect);
    setTimeout(() => {
      if (index + 1 >= total) {
        persist(nextCorrect * 100);
        setDone(true);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 750);
  };

  const optionBg = (i) => {
    if (selected === null) return t.colors.surface;
    if (i === q.correctIndex) return t.colors.success;
    if (i === selected) return t.colors.error;
    return t.colors.surface;
  };
  const optionColor = (i) => {
    if (selected !== null && (i === q.correctIndex || i === selected)) return '#FFFFFF';
    return t.colors.textPrimary;
  };

  if (done) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />
        <View style={styles.doneWrap}>
          <Text style={[styles.doneEmoji]}>🎉</Text>
          <Text style={[styles.doneTitle, { color: t.colors.textPrimary }]}>Quiz Complete!</Text>
          <Text style={[styles.doneScore, { color: t.colors.textSecondary }]}>
            You got {correct} / {total} correct
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: t.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Back to Module</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={t.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>
          Question {index + 1}/{total}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: t.colors.border }]}>
        <View style={[styles.progressFill, { width: `${((index) / total) * 100}%`, backgroundColor: t.colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.questionCard, { backgroundColor: t.colors.surface }]}>
          {q.questionImage ? (
            <Image source={q.questionImage} style={styles.questionImage} resizeMode="contain" />
          ) : (
            <Text style={[styles.questionText, { color: t.colors.textPrimary }]}>{q.prompt}</Text>
          )}
        </View>

        <View style={styles.grid}>
          {q.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => choose(i)}
              style={[styles.option, { backgroundColor: optionBg(i), borderColor: t.colors.border }]}
            >
              {opt.image ? (
                <Image source={opt.image} style={styles.optionImage} resizeMode="contain" />
              ) : (
                <Text style={[styles.optionText, { color: optionColor(i) }]}>{opt.text}</Text>
              )}
              {selected !== null && i === q.correctIndex && (
                <Check size={20} color="#FFFFFF" style={styles.optionMark} />
              )}
              {selected !== null && i === selected && i !== q.correctIndex && (
                <X size={20} color="#FFFFFF" style={styles.optionMark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: theme.fonts.headingBold, fontSize: 18 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: theme.spacing.lg,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  body: { padding: theme.spacing.lg },
  questionCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  questionImage: { width: '100%', height: 180 },
  questionText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    width: '48%',
    minHeight: 90,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionImage: { width: '100%', height: 70 },
  optionText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18,
    textAlign: 'center',
  },
  optionMark: { position: 'absolute', top: 8, right: 8 },
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  doneEmoji: { fontSize: 64, marginBottom: theme.spacing.md },
  doneTitle: { fontFamily: theme.fonts.headingBold, fontSize: 26, marginBottom: theme.spacing.sm },
  doneScore: { fontFamily: theme.fonts.body, fontSize: 16, marginBottom: theme.spacing.xl },
  doneBtn: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
  },
  doneBtnText: { fontFamily: theme.fonts.headingBold, fontSize: 16, color: '#FFFFFF' },
});
