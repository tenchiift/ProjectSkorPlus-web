import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PhaserGame from '../game-phaser/PhaserGame';
import { vectorQuestions, toGamePayload } from '../data/vectorQuestions';
import { supabase } from '../config/supabase';
import { updateModuleProgress } from '../services/moduleService';
import { resolveCharacter } from '../game/characterAssets';
import { resolveLevel } from '../game/levelAssets';
import { resolveAllMobs } from '../game/mobAssets';
import { resolveButtons } from '../game/uiAssets';
import { resolvePhaserTextures } from '../game-phaser/phaserAssets';
import useForceLandscape from '../hooks/useForceLandscape';

export default function GameScreen({ navigation, route }) {
  // Platformer level is landscape-only; restores portrait on exit.
  useForceLandscape();

  const moduleData = route?.params?.module ?? {};
  // Use the character the player picked in the open world. Fall back to knight.
  const charKey = route?.params?.character ?? 'knight';
  const questions = toGamePayload(vectorQuestions);

  // Individual PNG frames for the chosen character (idle/walk/run/jump/attack),
  // plus level UI (background, hearts, ability, settings) and enemy mobs.
  const character = useMemo(() => resolveCharacter(charKey), [charKey]);
  const level = useMemo(() => resolveLevel(), []);
  const mobs = useMemo(() => resolveAllMobs(), []);
  const buttons = useMemo(() => resolveButtons(), []);
  // Packed Phaser spritesheets resolved to URIs the DOM component can load.
  const textures = useMemo(() => resolvePhaserTextures(), []);

  const handleGameOver = useCallback(async ({ score }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && moduleData.id) {
        await updateModuleProgress(user.id, moduleData.id, score);
      }
    } catch (e) {
      // progress is best-effort; don't block the results screen
    }
  }, [moduleData.id]);

  const handleExit = useCallback(async () => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <PhaserGame
        style={{ flex: 1 }}
        mode="platformer"
        character={character}
        characterName={character.name}
        level={level}
        mobs={mobs}
        buttons={buttons}
        questions={questions}
        textures={textures}
        onGameOver={handleGameOver}
        onExit={handleExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF6FF',
  },
});
