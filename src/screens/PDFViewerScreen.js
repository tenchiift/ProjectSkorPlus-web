import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Download } from 'lucide-react-native';
import theme from '../styles/theme';

export default function PDFViewerScreen({ navigation, route }) {
  const exam = route?.params?.exam ?? {};
  const pdfUrl = exam.pdf_url;
  const [downloading, setDownloading] = useState(false);

  if (!pdfUrl) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{exam.title ?? 'PDF Viewer'}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No PDF available for this exam paper.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const fileName = exam.title?.replace(/\s+/g, '_') ?? 'exam';
      const fileUri = `${FileSystem.documentDirectory}${fileName}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Exam Paper',
        });
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exam.title ?? 'PDF Viewer'}
        </Text>
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Download size={20} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' ? (
        <iframe
          src={googleDocsUrl}
          style={{ flex: 1, border: 'none' }}
          title="PDF Viewer"
        />
      ) : (
        <WebView
          source={{ uri: googleDocsUrl }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
