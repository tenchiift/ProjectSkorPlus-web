import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getModules, getUserModuleProgress } from '../services/moduleService';
import { supabase } from '../config/supabase';
import theme from '../styles/theme';

export default function AllModulesScreen({ navigation }) {
  const { theme: t } = useTheme();
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const MODULE_COLORS = {
    purple: [t.colors.gradientVectorStart, t.colors.gradientVectorEnd],
    amber: [t.colors.gradientDiffStart, t.colors.gradientDiffEnd],
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const modulesData = await getModules();
      setModules(modulesData);

      if (user) {
        const progress = await getUserModuleProgress(user.id);
        setModuleProgress(progress);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={t.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>All Modules</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {modules.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: t.colors.textSecondary }]}>No modules available yet.</Text>
          </View>
        ) : (
          modules.map((mod) => {
            const progress = moduleProgress[mod.id]?.progress ?? 0;
            const colors = MODULE_COLORS[mod.color] ?? MODULE_COLORS.purple;
            return (
              <LinearGradient
                key={mod.id}
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.moduleCard}
              >
                <View style={styles.moduleTopPill} />
                <Text style={styles.moduleTitle}>{mod.title}</Text>
                <Text style={styles.moduleDesc}>{mod.description}</Text>
                <View style={styles.moduleProgressBarBg}>
                  <View style={[styles.moduleProgressBarFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.modulePercent}>{Math.round(progress * 100)}% Complete</Text>
                <View style={styles.moduleFooter}>
                  <Text style={styles.continueText}>Continue Learning</Text>
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => navigation.navigate('Module', { module: mod })}
                  >
                    <ArrowRight size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md,
  },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: theme.fonts.headingBold, fontSize: 18 },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  moduleCard: {
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg,
    marginBottom: theme.spacing.md, minHeight: 200,
  },
  moduleTopPill: {
    width: 60, height: 24, borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', marginBottom: theme.spacing.lg,
  },
  moduleTitle: { fontFamily: theme.fonts.headingBold, fontSize: 24, color: '#FFFFFF', marginBottom: theme.spacing.sm },
  moduleDesc: { fontFamily: theme.fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: theme.spacing.md },
  moduleProgressBarBg: {
    height: 8, borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginBottom: theme.spacing.xs,
  },
  moduleProgressBarFill: { height: '100%', borderRadius: theme.borderRadius.full, backgroundColor: '#FFFFFF' },
  modulePercent: { fontFamily: theme.fonts.body, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: theme.spacing.md },
  moduleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  continueText: { fontFamily: theme.fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  continueBtn: {
    width: 40, height: 40, borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  empty: { paddingTop: 100, alignItems: 'center' },
  emptyText: { fontFamily: theme.fonts.body, fontSize: 14 },
});
