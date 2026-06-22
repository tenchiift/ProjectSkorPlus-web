import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import theme from '../styles/theme';

WebBrowser.maybeCompleteAuthSession();

const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h3.97c2.32-2.13 3.66-5.28 3.66-8.75z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.97-3.13c-1.1.74-2.5 1.18-3.99 1.18-3.07 0-5.67-2.08-6.6-4.88H1.36v3.23A11.99 11.99 0 0 0 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.4 14.26a7.15 7.15 0 0 1 0-4.52V6.51H1.36a11.97 11.97 0 0 0 0 10.98l4.04-3.23z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.93 11.93 0 0 0 12 0 11.99 11.99 0 0 0 1.36 6.51l4.04 3.23c.93-2.8 3.53-4.88 6.6-4.88z"
    />
  </Svg>
);

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      iosClientId: '916682872075-nai3bhja1dprl9eqs55rbqbajkcovnhm.apps.googleusercontent.com',
      androidClientId: '916682872075-qn97drogi8mvgfqoqnomks7d1emfkigg.apps.googleusercontent.com',
      webClientId: '916682872075-b4vqje8aev4e0agd9ghnmmioqdhq4t8j.apps.googleusercontent.com',
    },
    { preferLocalhost: true }
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (!id_token) {
        console.error('No id_token in response', response.params);
        return;
      }
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .then(() => navigation.replace('Dashboard'))
        .catch((err) => console.error('Google Sign-In error:', err))
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
    }
  }, [response]);

  const handleLogin = () => {
    navigation.replace('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log into account</Text>
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome back !</Text>
        <Text style={styles.welcomeSubtitle}>Knowledge Awaits You !</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeSubtitle}>Sign In to continue your Adventure ! </Text>
        <Text style={styles.welcomeSubtitle}></Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.emailButtonText}>Continue with email</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.dividerText}>or</Text>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => promptAsync()}
          disabled={!request || loading}
        >
          <GoogleIcon />
          <Text style={styles.outlineButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.termsText}>
          By using ProjectSkor+, you agree to the{'\n'}
          <Text style={styles.boldText}>Terms</Text> and <Text style={styles.boldText}>Privacy Policy</Text>.
        </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing.md,
    position: 'relative',
    height: 50,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: theme.spacing.md,
    padding: 4,
  },
  headerTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  welcomeTitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: '#333333',
  },
  welcomeSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 16,
    color: '#333333',
    marginTop: 4,
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  emailButton: {
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
  emailButtonText: {
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
  outlineButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: theme.spacing.md,
  },
  outlineButtonText: {
    fontFamily: theme.fonts.bodyBold,
    color: '#1A1A1A',
    fontSize: 16,
  },
  footer: {
    marginBottom: theme.spacing.lg,
  },
  termsText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  boldText: {
    fontFamily: theme.fonts.bodyBold,
    color: '#1A1A1A',
  },
});
  