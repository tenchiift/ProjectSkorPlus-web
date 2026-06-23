import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BookOpen, Dumbbell, ArrowRight } from 'lucide-react-native';
import theme from '../styles/theme';

const MODULE_COLORS = {
  purple: [theme.colors.gradientVectorStart, theme.colors.gradientVectorEnd],
  amber: [theme.colors.gradientDiffStart, theme.colors.gradientDiffEnd],
};

export default function ModuleScreen({ navigation, route }) {
  const moduleData = route?.params?.module ?? {};
  const colors = MODULE_COLORS[moduleData.color] ?? MODULE_COLORS.purple;

  const items = [
    {
      id: 'introduction',
      title: 'Introduction',
      subtitle: 'Learn the fundamentals and theory',
      icon: BookOpen,
    },
    {
      id: 'exercise',
      title: 'Exercise',
      subtitle: 'Practice problems to test your skills',
      icon: Dumbbell,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>

        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.bannerContent}>
            <View style={styles.bannerPill} />
            <Text style={styles.bannerTitle}>{moduleData.title ?? 'Module'}</Text>
            <Text style={styles.bannerDesc}>{moduleData.description ?? ''}</Text>

            <View style={styles.bannerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Lessons</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>45min</Text>
                <Text style={styles.statLabel}>Est. Time</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>20</Text>
                <Text style={styles.statLabel}>Problems</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIcon, { backgroundColor: colors[0] + '20' }]}>
                  <Icon size={24} color={colors[0]} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>
                <ArrowRight size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    marginBottom: theme.spacing.lg,
    padding: 4,
    alignSelf: 'flex-start',
  },
  bannerContent: {
    alignItems: 'center',
  },
  bannerPill: {
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: theme.spacing.lg,
  },
  bannerTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 30,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
  },
  bannerDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  bannerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
