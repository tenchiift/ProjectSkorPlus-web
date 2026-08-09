import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Flame, CheckCircle2, ArrowRight, MoreHorizontal, Settings, Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import theme from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---- DUMMY DATA (edit these to test different states) ----
const MOCK_USER = { name: 'Alia Zahra', total_exp: 1240, days_streak: 7, completed: 12 };

const MOCK_MODULES = [
  { id: 1, title: 'Algebra Basics', description: 'Master linear equations and graphs', color: 'purple' },
  { id: 2, title: 'Cell Biology', description: 'Explore how living cells work', color: 'amber' },
  { id: 3, title: 'World History', description: 'From ancient empires to today', color: 'purple' },
];

const MOCK_PROGRESS = {
  1: { progress: 0.65 },
  2: { progress: 0.3 },
  3: { progress: 0.9 },
};

const MOCK_COUNTDOWN = {
  title: 'SPM Add Maths Paper 1',
  exam_date: '2026-11-12T08:00:00',
};
// -----------------------------------------------------------

// Fake navigation object so this screen can run without @react-navigation installed.
// Swap this out for the real `navigation` prop once you drop this back into the app.
const mockNavigation = {
  navigate: (route, params) => console.log('[mock nav] navigate ->', route, params ?? ''),
  reset: (opts) => console.log('[mock nav] reset ->', opts),
};

export default function DashboardScreen({ navigation = mockNavigation }) {
  const { theme: t } = useTheme();
  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);

  const MODULE_COLORS = {
    purple: [t.colors.gradientVectorStart, t.colors.gradientVectorEnd],
    amber: [t.colors.gradientDiffStart, t.colors.gradientDiffEnd],
  };

  const handleLogout = () => {
    setSidebarVisible(false);
    console.log('[mock] logout pressed');
  };

  const handleSidebarNavigate = (route) => {
    if (route === 'logout') {
      handleLogout();
    } else {
      navigation.navigate(route);
    }
  };

  const fetchData = useCallback((isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    // Simulate a network delay so you can see loading / pull-to-refresh states.
    setTimeout(() => {
      setUserData(MOCK_USER);
      setModules(MOCK_MODULES);
      setModuleProgress(MOCK_PROGRESS);

      if (MOCK_COUNTDOWN) {
        setCountdown(MOCK_COUNTDOWN);
        const examDate = new Date(MOCK_COUNTDOWN.exam_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(diff);
      }

      setLoading(false);
      setRefreshing(false);
    }, 600);
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const onCarouselScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - theme.spacing.lg * 2 + theme.spacing.md));
    setCarouselIndex(idx);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  const stats = [
    { icon: Zap, color: t.colors.expBlue, value: String(userData?.total_exp ?? 0), label: 'Totals Exp' },
    { icon: Flame, color: t.colors.streakOrange, value: String(userData?.days_streak ?? 0), label: 'Days Streak' },
    { icon: CheckCircle2, color: t.colors.completedRed, value: String(userData?.completed ?? 0), label: 'Completed' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[t.colors.primary]} tintColor={t.colors.primary} />}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSidebarVisible(true)}>
            <MoreHorizontal size={24} color={t.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.logoWrap}>
            {/* Swap this Text for your real <Image source={require('../assets/images/logo.png')} .../> later */}
            <Text style={{ fontWeight: '800', fontSize: 18, color: t.colors.primary }}>SkorPlus</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
            <Settings size={22} color={t.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <View key={i} style={[styles.statCard, { backgroundColor: t.colors.surface }]}>
                <Icon size={28} color={stat.color} />
                <Text style={[styles.statValue, { color: t.colors.textPrimary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: t.colors.textSecondary }]}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.countdownCompact, { backgroundColor: t.colors.surface }]}>
          {countdown ? (
            <View>
              <View style={styles.countdownDaysRow}>
                <Text style={[styles.countdownDays, { color: t.colors.primary }]}>
                  {daysLeft !== null ? daysLeft : '0'}
                </Text>
                <Text style={[styles.countdownDaysLabel, { color: t.colors.textSecondary }]}>days left</Text>
              </View>
              <Text style={[styles.countdownCompactTitle, { color: t.colors.textPrimary }]} numberOfLines={1}>{countdown.title}</Text>
              <View style={styles.countdownBottomRow}>
                <View style={styles.countdownDateRow}>
                  <Calendar size={13} color={t.colors.textSecondary} />
                  <Text style={[styles.countdownDate, { color: t.colors.textSecondary }]}>
                    {new Date(countdown.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.countdownEditBtn, { borderColor: t.colors.primary }]}
                  onPress={() => navigation.navigate('SetExam', { countdown })}
                >
                  <Text style={[styles.countdownEditText, { color: t.colors.primary }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.countdownEmpty}>
              <Calendar size={28} color={t.colors.textSecondary} />
              <Text style={[styles.countdownEmptyText, { color: t.colors.textSecondary }]}>Set your final exam</Text>
              <TouchableOpacity
                style={[styles.countdownSetBtn, { backgroundColor: t.colors.primary }]}
                onPress={() => navigation.navigate('SetExam', {})}
              >
                <Text style={styles.countdownSetBtnText}>Set Date & Time</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.worldCardWrap}>
          <LinearGradient
            colors={[t.colors.gradientVectorStart, t.colors.gradientVectorEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.worldCard, styles.worldCardDisabled]}
          >
            <View style={styles.worldInfo}>
              <Text style={styles.worldKicker}>ADVENTURE MODE</Text>
              <Text style={styles.worldTitle}>Open World</Text>
              <Text style={styles.worldDesc}>Pick a hero and explore the map</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon!</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: t.colors.textPrimary }]}>Continue Learning..</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllModules')}>
            <Text style={[styles.showAllLink, { color: t.colors.primary }]}>Show All →</Text>
          </TouchableOpacity>
        </View>

        {modules.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onCarouselScroll}
              snapToInterval={SCREEN_WIDTH - theme.spacing.lg * 2 + theme.spacing.md}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselInner}
            >
              {modules.map((mod) => {
                const progress = moduleProgress[mod.id]?.progress ?? 0;
                const colors = MODULE_COLORS[mod.color] ?? MODULE_COLORS.purple;
                return (
                  <TouchableOpacity
                    key={mod.id}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Module', { module: mod })}
                  >
                    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.moduleCard}>
                      <View style={styles.moduleTopPill} />
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleDesc}>{mod.description}</Text>
                      <View style={styles.moduleProgressBarBg}>
                        <View style={[styles.moduleProgressBarFill, { width: `${progress * 100}%` }]} />
                      </View>
                      <View style={styles.moduleFooter}>
                        <Text style={styles.modulePercent}>{Math.round(progress * 100)}%</Text>
                        <View style={styles.continueBtn}>
                          <ArrowRight size={20} color="#FFFFFF" />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.dotsRow}>
              {modules.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i === carouselIndex ? t.colors.primary : t.colors.border }, i === carouselIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: t.colors.surface }]}>
            <Text style={[styles.emptyText, { color: t.colors.textSecondary }]}>No modules available</Text>
          </View>
        )}
      </ScrollView>

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={handleSidebarNavigate} userData={userData} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  iconBtn: { padding: 8 },
  logoWrap: { alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statCard: { flex: 1, borderRadius: theme.borderRadius.lg, paddingVertical: theme.spacing.lg, alignItems: 'center', gap: theme.spacing.xs },
  statValue: { fontFamily: theme.fonts.headingBold, fontSize: 22 },
  statLabel: { fontFamily: theme.fonts.body, fontSize: 11 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  worldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  worldInfo: { flex: 1 },
  worldKicker: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  worldTitle: { fontFamily: theme.fonts.headingBold, fontSize: 24, color: '#FFFFFF' },
  worldDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  worldCardWrap: { position: 'relative' },
  worldCardDisabled: { opacity: 0.6 },
  comingSoonBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginLeft: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  comingSoonText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  sectionTitle: { fontFamily: theme.fonts.headingBold, fontSize: 18 },
  carouselInner: { paddingRight: theme.spacing.md },
  moduleCard: {
    width: SCREEN_WIDTH - theme.spacing.lg * 2,
    borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, minHeight: 200, marginRight: theme.spacing.md,
  },
  moduleTopPill: { width: 60, height: 24, borderRadius: theme.borderRadius.full, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end', marginBottom: theme.spacing.lg },
  moduleTitle: { fontFamily: theme.fonts.headingBold, fontSize: 24, color: '#FFFFFF', marginBottom: theme.spacing.sm },
  moduleDesc: { fontFamily: theme.fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: theme.spacing.md },
  moduleProgressBarBg: { height: 8, borderRadius: theme.borderRadius.full, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginBottom: theme.spacing.sm },
  moduleProgressBarFill: { height: '100%', borderRadius: theme.borderRadius.full, backgroundColor: '#FFFFFF' },
  moduleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modulePercent: { fontFamily: theme.fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  continueBtn: { width: 40, height: 40, borderRadius: theme.borderRadius.full, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 20, borderRadius: 4 },
  showAllLink: { fontFamily: theme.fonts.body, fontSize: 13, textAlign: 'right', marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
  emptyCard: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.xxl, alignItems: 'center' },
  emptyText: { fontFamily: theme.fonts.body, fontSize: 14 },
  countdownCompact: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  countdownDaysRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  countdownDays: { fontFamily: theme.fonts.headingBold, fontSize: 34, lineHeight: 38 },
  countdownDaysLabel: { fontFamily: theme.fonts.body, fontSize: 14 },
  countdownCompactTitle: { fontFamily: theme.fonts.headingBold, fontSize: 14, marginBottom: theme.spacing.sm },
  countdownBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdownDateRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  countdownDate: { fontFamily: theme.fonts.body, fontSize: 13 },
  countdownEditBtn: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: theme.borderRadius.full, borderWidth: 1 },
  countdownEditText: { fontFamily: theme.fonts.bodyBold, fontSize: 12 },
  countdownEmpty: { alignItems: 'center', paddingVertical: theme.spacing.md, gap: theme.spacing.sm },
  countdownEmptyText: { fontFamily: theme.fonts.body, fontSize: 13 },
  countdownSetBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: theme.borderRadius.full, marginTop: theme.spacing.xs },
  countdownSetBtnText: { fontFamily: theme.fonts.headingBold, fontSize: 14, color: '#FFFFFF' },
});
