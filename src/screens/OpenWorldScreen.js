import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PhaserGame from '../game-phaser/PhaserGame';
import { resolveCharacter } from '../game/characterAssets';
import { resolveButtons } from '../game/uiAssets';
import { resolvePhaserTextures } from '../game-phaser/phaserAssets';
import useForceLandscape from '../hooks/useForceLandscape';
import { supabase } from '../config/supabase';

export default function OpenWorldScreen({ navigation, route }) {
  // Open world is landscape-only; restores portrait on exit.
  useForceLandscape();

  const charKey = route?.params?.character ?? 'knight';
  const passedModule = route?.params?.module ?? null;
  // Name chosen on the character screen takes priority; fall back to the
  // app profile username, then a generic default.
  const [playerName, setPlayerName] = useState(route?.params?.playerName ?? 'Player');

  const character = useMemo(() => resolveCharacter(charKey), [charKey]);
  const buttons = useMemo(() => resolveButtons(), []);
  // Packed Phaser spritesheets resolved to URIs the DOM component can load.
  const textures = useMemo(() => resolvePhaserTextures(), []);

  useEffect(() => {
    // If the character screen already supplied a name, don't override it.
    if (route?.params?.playerName) return undefined;
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', user.id)
          .single();
        if (alive && profile) {
          setPlayerName(profile.username || profile.full_name || 'Player');
        }
      } catch (e) {
        // best-effort; keep default name
      }
    })();
    return () => { alive = false; };
  }, [route?.params?.playerName]);

  const handleEnterModule = useCallback((moduleKey) => {
    // The Vector house launches the existing platformer level.
    if (moduleKey === 'vector') {
      navigation.navigate('Game', {
        module: passedModule ?? { id: 'vector', title: 'Vector', color: 'purple' },
        character: charKey,
      });
    }
  }, [navigation, passedModule, charKey]);

  const handleExit = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <PhaserGame
        style={{ flex: 1 }}
        mode="openworld"
        character={character}
        characterName={character.name}
        playerName={playerName}
        buttons={buttons}
        textures={textures}
        onEnterModule={handleEnterModule}
        onExit={handleExit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6FB84A' },
});
