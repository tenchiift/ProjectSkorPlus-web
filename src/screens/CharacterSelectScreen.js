import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Pencil } from 'lucide-react-native';
import theme from '../styles/theme';
import { resolveAllCharacters } from '../game/characterAssets';
import { supabase } from '../config/supabase';

// Small helper: cycles through a list of frame URIs at a given fps.
function useFrameCycle(length, fps = 8) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!length) return undefined;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % length);
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [length, fps]);
  return length ? frame % length : 0;
}

// Renders a sprite so its VISIBLE body (the opaque content box, described by
// `content` as fractions of the frame) fills a consistent target height and
// sits on the bottom of the box. This makes every character — despite very
// different frame padding — appear the same size in the picker.
function AnimatedSprite({ frames, content, size = 120 }) {
  const frame = useFrameCycle(frames?.length ?? 0, 8);
  const uri = frames?.[frame];
  if (!uri) return <View style={{ width: size, height: size }} />;

  const c = content || { left: 0, top: 0, w: 1, h: 1 };
  // Fraction of the box height the body should occupy. Feet get a little
  // breathing room at the bottom.
  const TARGET_H_FRAC = 0.82;
  const BOTTOM_PAD_FRAC = 0.06;

  // Scale the full frame up so its content height == TARGET_H_FRAC * size.
  const contentPx = size * TARGET_H_FRAC;
  const frameDrawH = contentPx / (c.h || 1);
  const frameDrawW = frameDrawH; // frames are square

  // Position the enlarged frame so the content is centered horizontally and
  // its bottom sits at (size - bottom padding).
  const contentCenterXFrac = c.left + c.w / 2;
  const left = size / 2 - contentCenterXFrac * frameDrawW;
  const contentBottomFrac = c.top + c.h;
  const top = size - BOTTOM_PAD_FRAC * size - contentBottomFrac * frameDrawH;

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image
        source={{ uri }}
        style={{
          position: 'absolute',
          width: frameDrawW,
          height: frameDrawH,
          left,
          top,
        }}
        resizeMode="stretch"
        fadeDuration={0}
      />
    </View>
  );
}

export default function CharacterSelectScreen({ navigation, route }) {
  const characters = useMemo(() => resolveAllCharacters(), []);
  const [selected, setSelected] = useState(0);
  const active = characters[selected];

  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const count = characters.length;
  const go = (dir) => setSelected((i) => (i + dir + count) % count);

  // Editable display name — defaults to the app username, but the player can
  // change what shows above their character in the open world.
  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        if (alive && profile) {
          setUsername(profile.username || profile.full_name || 'Player');
        }
      } catch (e) {
        // best-effort; keep whatever default is set
      }
    })();
    return () => { alive = false; };
  }, []);

  // Show idle for the big preview; walk on the row thumbnails for life.
  const previewFrames = active?.idle?.length ? active.idle : active?.walk;

  const handleConfirm = () => {
    const finalName = (username || '').trim() || 'Player';
    navigation.navigate('OpenWorld', {
      character: active.key,
      playerName: finalName,
      module: route?.params?.module ?? null,
    });
  };

  const nameField = (
    <View style={styles.nameField}>
      {editing ? (
        <TextInput
          style={styles.nameInput}
          value={username}
          onChangeText={setUsername}
          onBlur={() => setEditing(false)}
          onSubmitEditing={() => setEditing(false)}
          autoFocus
          maxLength={16}
          returnKeyType="done"
          placeholder="Your name"
          placeholderTextColor={theme.colors.textSecondary}
          selectionColor={theme.colors.primary}
        />
      ) : (
        <TouchableOpacity
          style={styles.namePill}
          activeOpacity={0.7}
          onPress={() => setEditing(true)}
        >
          <Text style={styles.nameText} numberOfLines={1}>
            {username || 'Player'}
          </Text>
          <Pencil size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // PORTRAIT: single hero preview flanked by left/right arrows to cycle.
  const portraitPicker = (
    <View style={styles.portraitBody}>
      {nameField}
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={styles.arrowBtn}
          activeOpacity={0.7}
          onPress={() => go(-1)}
          accessibilityLabel="Previous character"
        >
          <ChevronLeft size={30} color={theme.colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.stage}>
          <View style={styles.stageShadow} />
          <AnimatedSprite frames={previewFrames} content={active?.content} size={190} />
        </View>

        <TouchableOpacity
          style={styles.arrowBtn}
          activeOpacity={0.7}
          onPress={() => go(1)}
          accessibilityLabel="Next character"
        >
          <ChevronRight size={30} color={theme.colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <Text style={styles.charName} numberOfLines={1}>{active?.name}</Text>

      <View style={styles.dots}>
        {characters.map((c, i) => (
          <View
            key={c.key}
            style={[styles.dot, i === selected && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );

  // LANDSCAPE: compact preview on the left, tappable cards on the right.
  const landscapeBody = (
    <View style={styles.bodyLandscape}>
      <View style={styles.previewWrapLandscape}>
        {nameField}
        <View style={styles.stageLandscape}>
          <View style={styles.stageShadow} />
          <AnimatedSprite frames={previewFrames} content={active?.content} size={130} />
        </View>
        <Text style={styles.charName} numberOfLines={1}>{active?.name}</Text>
      </View>

      <View style={styles.row}>
        {characters.map((c, i) => {
          const isSel = i === selected;
          const thumb = c.walk?.length ? c.walk : c.idle;
          return (
            <TouchableOpacity
              key={c.key}
              activeOpacity={0.85}
              onPress={() => setSelected(i)}
              style={[styles.card, isSel && styles.cardSelected]}
            >
              {isSel && (
                <View style={styles.checkBadge}>
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
              <AnimatedSprite frames={thumb} content={c.content} size={60} />
              <Text
                style={[styles.cardName, isSel && styles.cardNameSel]}
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[theme.colors.gradientVectorStart, theme.colors.gradientVectorEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, landscape && styles.headerLandscape]}
      >
        <SafeAreaView edges={['top', 'left', 'right']}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.title, landscape && styles.titleLandscape]}>
            Choose Your Character
          </Text>
          {!landscape && (
            <Text style={styles.subtitle}>Pick a hero to explore the open world</Text>
          )}
        </SafeAreaView>
      </LinearGradient>

      {landscape ? landscapeBody : portraitPicker}

      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
        <TouchableOpacity activeOpacity={1}>
          <LinearGradient
            colors={[theme.colors.gradientVectorStart, theme.colors.gradientVectorEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.cta, styles.ctaDisabled]}
          >
            <Text style={styles.ctaText}>Enter Open World</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerLandscape: {
    paddingBottom: theme.spacing.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  back: { paddingVertical: theme.spacing.sm, alignSelf: 'flex-start' },
  title: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 26,
    color: '#FFFFFF',
    marginTop: theme.spacing.sm,
  },
  titleLandscape: {
    fontSize: 20,
    marginTop: 0,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  // --- Portrait picker ---
  portraitBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  nameField: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  namePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: 260,
  },
  nameText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  nameInput: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    minWidth: 200,
    maxWidth: 260,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  arrowBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  stage: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageShadow: {
    position: 'absolute',
    bottom: 18,
    width: 110,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  charName: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: theme.colors.primary,
  },
  // --- Landscape ---
  bodyLandscape: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  previewWrapLandscape: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLandscape: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    maxWidth: 120,
    aspectRatio: 0.85,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '12',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  cardNameSel: { color: theme.colors.primary },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  cta: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: theme.fonts.headingBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
});
