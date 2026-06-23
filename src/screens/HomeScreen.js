import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import theme from '../styles/theme';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.heroContainer}>
        <Text style={styles.title}>ProjectSkor+</Text>
        <Text style={styles.tagline}>Learn Smarter, Score Better</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.dividerText}>or</Text>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.btnOutlineText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.lg,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
  },
  welcomeTitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: '#333333',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 300,
    height: 300,
    marginTop: -65,
    marginBottom: -65,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 32,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  btnPrimary: {
    backgroundColor: '#5A4FE0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#5A4FE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: theme.fonts.bodyBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  dividerText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: '#8E8E93',
    marginVertical: 14,
  },
  btnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  btnOutlineText: {
    fontFamily: theme.fonts.bodyBold,
    color: '#1A1A1A',
    fontSize: 16,
  },
});
