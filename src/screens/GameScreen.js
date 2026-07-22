import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import VectorGame from '../game/VectorGame';
import { vectorQuestions, toGamePayload } from '../data/vectorQuestions';
import { supabase } from '../config/supabase';
import { updateModuleProgress } from '../services/moduleService';

const resolveSprite = (m) => Image.resolveAssetSource(m).uri;

const spriteModules = {
  idle: require('../assets/game/sprites/player_idle.png'),
  walk: require('../assets/game/sprites/player_walk.png'),
  run: require('../assets/game/sprites/player_run.png'),
  attack: require('../assets/game/sprites/player_attack.png'),
  hurt: require('../assets/game/sprites/player_hurt.png'),
  death: require('../assets/game/sprites/player_death.png'),
};

export default function GameScreen({ navigation, route }) {
  const moduleData = route?.params?.module ?? {};
  const questions = toGamePayload(vectorQuestions);

  const sprites = useMemo(() => ({
    idle: resolveSprite(spriteModules.idle),
    walk: resolveSprite(spriteModules.walk),
    run: resolveSprite(spriteModules.run),
    attack: resolveSprite(spriteModules.attack),
    hurt: resolveSprite(spriteModules.hurt),
    death: resolveSprite(spriteModules.death),
  }), []);

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
      <VectorGame
        style={{ flex: 1 }}
        sprites={sprites}
        questions={questions}
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
