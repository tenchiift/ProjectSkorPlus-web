// Level UI assets (background, health bar states, ability, HUD buttons).
// Resolved to URIs for use inside the 'use dom' canvas/HTML game component.
import { Image } from 'react-native';

const IMG = {
  background: require('../../assets/game assets/level/background full size.png'),
  ability: require('../../assets/game assets/level/Bottle (ability).png'),
  stamina: require('../../assets/game assets/level/Stamina.png'),
  settings: require('../../assets/game assets/Button/settings.png'),
  pause: require('../../assets/game assets/Button/pause.png'),
  // 5-state health bar (1/5 .. 5/5 filled).
  hearts: [
    require('../../assets/game assets/Button/1_5 heart.png'),
    require('../../assets/game assets/Button/2_5 heart.png'),
    require('../../assets/game assets/Button/3_5 heart.png'),
    require('../../assets/game assets/Button/4_5 heart.png'),
    require('../../assets/game assets/Button/5_5 heart.png'),
  ],
};

const resolve = (m) => Image.resolveAssetSource(m).uri;

export function resolveLevel() {
  return {
    background: resolve(IMG.background),
    ability: resolve(IMG.ability),
    stamina: resolve(IMG.stamina),
    settings: resolve(IMG.settings),
    pause: resolve(IMG.pause),
    hearts: IMG.hearts.map(resolve),
  };
}
