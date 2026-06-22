import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Flame, CheckCircle2, MoreHorizontal, User, ArrowRight } from 'lucide-react-native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import theme from '../styles/theme';

const MODULE_COLORS = {
  purple: [theme.colors.gradientVectorStart, theme.colors.gradientVectorEnd],
  amber: [theme.colors.gradientDiffStart, theme.colors.gradientDiffEnd],
};

// temp userId — later replace with real auth user
const USER_ID = 'testUser';

export default function DashboardScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // fetch user profile
      const userSnap = await getDoc(doc(db, 'users', USER_ID));
      if (userSnap.exists()) setUserData(userSnap.data());

      // fetch modules
      const modulesSnap = await getDocs(collection(db, 'modules'));
      const modulesData = modulesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.order - b.order);
        console.log('Modules fetched:', modulesData);
      setModules(modulesData);

      // fetch module progress
      const progressSnap = await getDocs(
        collection(db, 'users', USER_ID, 'moduleProgress')
      );
      const progress = {};
      progressSnap.docs.forEach((d) => {
        progress[d.id] = d.data();
      });
      setModuleProgress(progress);
    } catch (err) {
      console.error('Firestore error:', err);
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

  const stats = [
    { icon: Zap, color: theme.colors.expBlue, value: String(userData?.totalExp ?? 0), label: 'Totals Exp' },
    { icon: Flame, color: theme.colors.streakOrange, value: String(userData?.daysStreak ?? 0), label: 'Days Streak' },
    { icon: CheckCircle2, color: theme.colors.completedRed, value: String(userData?.completed ?? 0), label: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.avatarCircle}>
            <User size={22} color={theme.colors.textSecondary} />
          </View>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <TouchableOpacity>
            <MoreHorizontal size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <Text style={styles.welcome}>
          Welcome Back, <Text style={styles.welcomeBold}>{userData?.name ?? 'Student'} !!</Text>
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <View key={i} style={styles.statCard}>
                <Icon size={28} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Modules header */}
        <View style={styles.modulesHeader}>
          <Text style={styles.modulesTitle}>Continue Learning..</Text>

        </View>

        {/* Module cards — real data from Firestore */}
        {modules.map((mod) => {
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
              <Text style={styles.moduleProgressLabel}>Progress</Text>
              <View style={styles.moduleProgressBarBg}>
                <View
                  style={[
                    styles.moduleProgressBarFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.moduleFooter}>
                <Text style={styles.continueText}>Continue Learning</Text>
                <TouchableOpacity style={styles.continueBtn}>
                  <ArrowRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          );
        })}

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
  logoImage: {
    width: 150,
    height: 150,
    marginTop: -50,
    marginBottom: -50,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  welcomeBold: {
    fontFamily: theme.fonts.headingBold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statValue: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  modulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modulesTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 22,
    color: theme.colors.textPrimary,
  },
  seeAll: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  moduleCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    minHeight: 220,
  },
  moduleTopPill: {
    width: 60,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  moduleTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  moduleDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: theme.spacing.lg,
  },
  moduleProgressLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: theme.spacing.xs,
  },
  moduleProgressBarBg: {
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  moduleProgressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  continueBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});