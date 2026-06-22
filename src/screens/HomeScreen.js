import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import theme from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.badge}>Where learning begins</Text>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.symbol}>∫</Text>
        <Text style={styles.title}>ProjectSkor+</Text>
        <Text style={styles.tagline}>Learn Smarter, Score Better</Text>
      </View>

      {/* Cards */}
      <View style={styles.cards}>
        <View style={styles.card}>
          <Text style={styles.cardSymbol}>∑</Text>
          <Text style={styles.cardText}>Limits</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardSymbol}>∂</Text>
          <Text style={styles.cardText}>Derivatives</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardSymbol}>∫</Text>
          <Text style={styles.cardText}>Integrals</Text>
        </View>
      </View>

      {/* Buttons */}
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

    
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnSecondaryText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
  },
  badge: {
    fontFamily: theme.fonts.body,
    color: theme.colors.secondary,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 80,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 42,
    color: theme.colors.chalk,
    letterSpacing: 1,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardSymbol: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 28,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  cardText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  buttons: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.chalk,
    fontSize: 16,
    letterSpacing: 1,
  },
  btnSecondary: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});