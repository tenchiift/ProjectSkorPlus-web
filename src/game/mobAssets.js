// Enemy (mob) animation frame registry. Frames are individual PNGs.
// Plant1 faces one way (flip in engine for the other direction);
// Plant2 ships directional frames — we use the "Left" set and flip as needed.
import { Image } from 'react-native';

const MOBS = {
  plant1: {
    name: 'Plant',
    idle: [
      require('../../assets/game assets/mobs/Plant1/Idle/Idle_1.png'),
      require('../../assets/game assets/mobs/Plant1/Idle/Idle_2.png'),
      require('../../assets/game assets/mobs/Plant1/Idle/Idle_3.png'),
      require('../../assets/game assets/mobs/Plant1/Idle/Idle_4.png'),
    ],
    walk: [
      require('../../assets/game assets/mobs/Plant1/Walk/Walk_1.png'),
      require('../../assets/game assets/mobs/Plant1/Walk/Walk_2.png'),
      require('../../assets/game assets/mobs/Plant1/Walk/Walk_3.png'),
      require('../../assets/game assets/mobs/Plant1/Walk/Walk_4.png'),
      require('../../assets/game assets/mobs/Plant1/Walk/Walk_5.png'),
      require('../../assets/game assets/mobs/Plant1/Walk/Walk_6.png'),
    ],
    attack: [
      require('../../assets/game assets/mobs/Plant1/Attack1/Attack1_1.png'),
      require('../../assets/game assets/mobs/Plant1/Attack1/Attack1_2.png'),
      require('../../assets/game assets/mobs/Plant1/Attack1/Attack1_3.png'),
      require('../../assets/game assets/mobs/Plant1/Attack1/Attack1_4.png'),
      require('../../assets/game assets/mobs/Plant1/Attack1/Attack1_5.png'),
      require('../../assets/game assets/mobs/Plant1/Attack1/Attack1_6.png'),
    ],
    death: [
      require('../../assets/game assets/mobs/Plant1/Death/Death_1.png'),
      require('../../assets/game assets/mobs/Plant1/Death/Death_2.png'),
      require('../../assets/game assets/mobs/Plant1/Death/Death_3.png'),
      require('../../assets/game assets/mobs/Plant1/Death/Death_4.png'),
      require('../../assets/game assets/mobs/Plant1/Death/Death_5.png'),
      require('../../assets/game assets/mobs/Plant1/Death/Death_6.png'),
    ],
  },
  plant2: {
    name: 'Vine',
    idle: [
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_1.png'),
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_2.png'),
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_3.png'),
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_4.png'),
    ],
    walk: [
      require('../../assets/game assets/mobs/Plant2/Walk/Walk_Left_1.png'),
      require('../../assets/game assets/mobs/Plant2/Walk/Walk_Left_2.png'),
      require('../../assets/game assets/mobs/Plant2/Walk/Walk_Left_3.png'),
      require('../../assets/game assets/mobs/Plant2/Walk/Walk_Left_4.png'),
      require('../../assets/game assets/mobs/Plant2/Walk/Walk_Left_5.png'),
      require('../../assets/game assets/mobs/Plant2/Walk/Walk_Left_6.png'),
    ],
    attack: [
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_1.png'),
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_2.png'),
    ],
    death: [
      require('../../assets/game assets/mobs/Plant2/Idle/Idle_Left_1.png'),
    ],
  },
};

const resolve = (m) => Image.resolveAssetSource(m).uri;

export const MOB_KEYS = Object.keys(MOBS);

export function resolveMob(key) {
  const m = MOBS[key] || MOBS[MOB_KEYS[0]];
  return {
    key,
    name: m.name,
    idle: m.idle.map(resolve),
    walk: m.walk.map(resolve),
    attack: m.attack.map(resolve),
    death: m.death.map(resolve),
  };
}

export function resolveAllMobs() {
  return MOB_KEYS.map(resolveMob);
}
