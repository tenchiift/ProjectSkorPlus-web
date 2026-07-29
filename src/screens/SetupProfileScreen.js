import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../config/supabase';
import theme from '../styles/theme';

export default function SetupProfileScreen({ navigation, route }) {
  const [username, setUsername] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = route?.params?.userId;

  const handleSave = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setLoading(true);
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: username.trim(),
          semester: semester.trim(),
          email: route?.params?.email ?? '',
          total_exp: 0,
          days_streak: 0,
          completed: 0,
          exercise_progress: 0,
          created_at: new Date().toISOString(),
          profile_setup: true,
        });

      if (upsertError) throw upsertError;
      navigation.replace('Onboarding');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>

          <View style={styles.header}>
            <Text style={styles.title}>Setup your profile</Text>
            <Text style={styles.subtitle}>Let us know who you are before we begin!</Text>
          </View>

          <TouchableOpacity style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>+</Text>
            </View>
            <Text style={styles.avatarLabel}>Add photo (optional)</Text>
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. ahmad123"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapi  talize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Semester / Year</Text>
              <TextInput
                style={styles.input}
                value={semester}
                onChangeText={setSemester}
                placeholder="e.g. Semester 2, 2025"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.btn}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.btnText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0EFFE',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    color: theme.colors.primary,
  },
  avatarLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
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
    textAlign: 'center',
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
});
