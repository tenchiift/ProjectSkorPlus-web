import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ArrowLeft, Camera, ImageIcon, ChevronDown, Sparkles, X } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { solveWithDeepSeek } from '../services/aiService';
import theme from '../styles/theme';

export default function ScanSolveScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data } = await supabase
        .from('exams')
        .select('id, title, subject, semester')
        .order('created_at', { ascending: false });

      if (data) setPapers(data);
    } catch (err) {
      console.error('Fetch papers error:', err);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      processImage(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri) => {
    setResult(null);
    try {
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: 'jpeg' }
      );
      setImage(resized.uri);
    } catch (err) {
      setImage(uri);
    }
  };

  const handleSolve = async () => {
    if (!image) return;
    setLoading(true);
    setResult('loading');
    try {
      const paperContext = selectedPaper
        ? `${selectedPaper.title}${selectedPaper.subject ? ` - ${selectedPaper.subject}` : ''}${selectedPaper.semester ? ` (${selectedPaper.semester})` : ''}`
        : '';

      const aiResponse = await solveWithDeepSeek(image, paperContext || undefined);
      setResult(aiResponse);
    } catch (err) {
      setResult('Error: ' + (err.message || 'Failed to solve. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const getPaperLabel = () => {
    if (!selectedPaper) return 'Pick a paper (optional)';
    return selectedPaper.title.substring(0, 28) + (selectedPaper.title.length > 28 ? '...' : '');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan & Solve</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dropdown */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownVisible(true)}
        >
          <Text style={[styles.dropdownText, !selectedPaper && styles.dropdownPlaceholder]}>
            {getPaperLabel()}
          </Text>
          <ChevronDown size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Modal visible={dropdownVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownModal}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>Select Exam Paper</Text>
                <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                  <X size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setSelectedPaper(null); setDropdownVisible(false); }}
              >
                <Text style={[styles.dropdownItemText, { color: theme.colors.textSecondary }]}>
                  None (general solve)
                </Text>
              </TouchableOpacity>

              <FlatList
                data={papers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setSelectedPaper(item); setDropdownVisible(false); }}
                  >
                    <Text style={styles.dropdownItemText}>{item.title}</Text>
                    {item.subject ? (
                      <Text style={styles.dropdownItemSub}>{item.subject}{item.semester ? ` — ${item.semester}` : ''}</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Image Preview */}
        <View style={styles.imageArea}>
          {image ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image }} style={styles.imagePreviewImg} resizeMode="contain" />
              <TouchableOpacity style={styles.clearImage} onPress={() => { setImage(null); setResult(null); }}>
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={48} color={theme.colors.textSecondary} />
              <Text style={styles.imagePlaceholderText}>Snap a photo of your question</Text>
              <Text style={styles.imagePlaceholderHint}>or choose from gallery</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCamera}>
            <Camera size={20} color={theme.colors.primary} />
            <Text style={styles.actionBtnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleGallery}>
            <ImageIcon size={20} color={theme.colors.primary} />
            <Text style={styles.actionBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Solve Button */}
        <TouchableOpacity
          style={[styles.solveBtn, !image && styles.solveBtnDisabled]}
          onPress={handleSolve}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.solveBtnText}>Solve</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && result !== 'loading' && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>AI Solution</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdownText: {
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  dropdownPlaceholder: {
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  dropdownModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    maxHeight: 400,
    padding: theme.spacing.lg,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dropdownTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 17,
    color: theme.colors.textPrimary,
  },
  dropdownItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  dropdownItemSub: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  imageArea: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  imagePlaceholderText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  imagePlaceholderHint: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  imagePreview: {
    width: '100%',
    position: 'relative',
  },
  imagePreviewImg: {
    width: '100%',
    height: 280,
  },
  clearImage: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionBtnText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 14,
    color: theme.colors.primary,
  },
  solveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 16,
    marginBottom: theme.spacing.lg,
  },
  solveBtnDisabled: {
    opacity: 0.5,
  },
  solveBtnText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  resultTitle: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  resultText: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
});
