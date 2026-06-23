import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import theme from '../styles/theme';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    id: 1,
    image: require('../assets/images/reference pages/png/page 1 image.png'),
    title: 'Interactive Modules',
    subtitle: 'Learn calculus with structured, bite-sized modules designed for students.',
  },
  {
    id: 2,
    image: require('../assets/images/reference pages/png/page 2 image.png'),
    title: 'Track Your Progress',
    subtitle: 'Monitor your learning journey with stats, streaks, and achievements.',
  },
  {
    id: 3,
    image: require('../assets/images/reference pages/png/page 3 image.png'),
    title: 'Master Calculus',
    subtitle: 'Practice with exercises and become confident in derivatives, integrals & more.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);

  const handleNext = () => {
    if (current < PAGES.length - 1) {
      const next = current + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrent(next);
    } else {
      navigation.replace('Dashboard');
    }
  };

  const handleScroll = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrent(page);
  };

  const isLast = current === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/reference pages/gradient.png')}
        style={styles.gradientBg}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.inner}>

      <View style={styles.skipRow}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scroll}
      >
        {PAGES.map((page) => (
          <View key={page.id} style={[styles.page, { width }]}>
            <Image
              source={page.image}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.subtitle}>{page.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === current && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleNext}>
          <Text style={styles.btnText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    opacity: 0.75,
  },
  inner: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  skipText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  bottom: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
