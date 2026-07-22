import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, FileText, Search } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import theme from '../styles/theme';

export default function FinalExamScreen({ navigation }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error('Fetch exams error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Papers</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exams.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No exam papers yet</Text>
            <Text style={styles.emptySubtitle}>
              Exam papers will appear here once added.
            </Text>
          </View>
        ) : (
          exams.map((exam) => (
            <TouchableOpacity
              key={exam.id}
              style={styles.examCard}
              onPress={() => navigation.navigate('PDFViewer', { exam })}
              activeOpacity={0.7}
            >
              <View style={styles.examIcon}>
                <FileText size={28} color="#FFFFFF" />
              </View>
              <View style={styles.examInfo}>
                <Text style={styles.examTitle}>{exam.title}</Text>
                {exam.subject ? (
                  <Text style={styles.examMeta}>
                    {exam.subject}{exam.semester ? ` — ${exam.semester}` : ''}
                  </Text>
                ) : null}
                {exam.year ? (
                  <Text style={styles.examYear}>Year {exam.year}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  examCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  examIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  examMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  examYear: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
