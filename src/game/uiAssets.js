// Game UI button assets (resolved to URIs for use in 'use dom' canvas components).
import { Image } from 'react-native';

const BTN = {
  left: require('../../assets/game assets/Button/left.png'),
  right: require('../../assets/game assets/Button/right.png'),
  up: require('../../assets/game assets/Button/up.png'),
  down: require('../../assets/game assets/Button/down.png'),
  menu: require('../../assets/game assets/Button/menu.png'),
  pause: require('../../assets/game assets/Button/pause.png'),
  play: require('../../assets/game assets/Button/play.png'),
  settings: require('../../assets/game assets/Button/settings.png'),
  back: require('../../assets/game assets/Button/back.png'),
};

const resolve = (m) => Image.resolveAssetSource(m).uri;

// Returns { left, right, up, down, ... } as URI strings.
export function resolveButtons() {
  const out = {};
  for (const k of Object.keys(BTN)) out[k] = resolve(BTN[k]);
  return out;
}
