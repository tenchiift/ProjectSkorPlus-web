import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../styles/theme';

const ACTION_CODE_SETTINGS = {
  handleCodeInApp: true,
  url: 'https://projectskorplus.firebaseapp.com/emailSignIn',
  iOS: {
    bundleId: 'com.projectskorplus',
  },
  android: {
    packageName: 'com.projectskorplus',
    installApp: false,
  },
};


export default function EmailLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendSignInLinkToEmail(auth, email.trim(), ACTION_CODE_SETTINGS);
      await AsyncStorage.setItem('emailForSignIn', email.trim());
      setSent(true);
    } catch (err) {
      console.error(err);
      setError('Failed to send link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkUserAndNavigate = async (user) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists() && userSnap.data().profileSetup) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('SetupProfile', { userId: user.uid, email: user.email });
      }
    } catch (err) {
      navigation.replace('SetupProfile', { userId: user.uid, email: user.email });
    }
  };

  // Handle incoming email link
  React.useEffect(() => {
    const handleDeepLink = async (url) => {
      if (isSignInWithEmailLink(auth, url)) {
        try {
          const savedEmail = await AsyncStorage.getItem('emailForSignIn');
          if (savedEmail) {
            setLoading(true);
            const result = await signInWithEmailLink(auth, savedEmail, url);
            await AsyncStorage.removeItem('emailForSignIn');
            checkUserAndNavigate(result.user);
          }
        } catch (err) {
          console.error(err);
          setError('Sign in failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    // Check if app opened from email link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Continue with Email</Text>
        </View>

        <View style={styles.content}>
          {!sent ? (
            <>
              <Text style={styles.title}>Enter your email</Text>
              <Text style={styles.subtitle}>
                We'll send you a magic link to sign in instantly — no password needed!
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.btn}
                onPress={handleSendLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.btnText}>Send Magic Link ✨</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.sentContainer}>
              <Text style={styles.sentEmoji}>📬</Text>
              <Text style={styles.sentTitle}>Check your email!</Text>
              <Text style={styles.sentSubtitle}>
                We sent a magic link to{'\n'}
                <Text style={styles.sentEmail}>{email}</Text>
              </Text>
              <Text style={styles.sentHint}>
                Tap the link in your email to sign in. You can close this screen.
              </Text>
              <TouchableOpacity onPress={() => setSent(false)}>
                <Text style={styles.resend}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    position: 'relative',
    height: 50,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    top: theme.spacing.md,
    padding: 4,
  },
  headerTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 26,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  btnText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  sentEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  sentTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 26,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  sentSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  sentEmail: {
    fontFamily: theme.fonts.headingBold,
    color: theme.colors.primary,
  },
  sentHint: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  resend: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 14,
    color: theme.colors.primary,
  },
});