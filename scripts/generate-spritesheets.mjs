// generate-spritesheets.mjs
// Packs the individual PNG animation frames into horizontal spritesheets that
// Phaser can load with a fixed frame size. Output: assets/phaser/*.png + *.json
// plus a manifest.json describing every sheet.
//
// Why: the raw art ships as 250+ individual PNGs at wildly different sizes
// (128x128 human classes, 256x256 monsters, 96x96 plants). We measure each
// frame's opaque content box, pick one cell size per character/mob, and place
// every frame bottom-centered in that cell so animations line up and the feet
// sit on the ground — the same normalization the old canvas engine did at
// runtime, done once here instead.
//
// Usage: node scripts/generate-spritesheets.mjs
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'game assets');
const OUT = path.join(ROOT, 'assets', 'phaser');
const STANDALONE = path.join(ROOT, 'src', 'game-phaser', 'stand alone', 'assets');

const ALPHA_THRESHOLD = 16;
const CELL_PAD = 2; // transparent padding around content inside each cell

// ---- source layout ------------------------------------------------------
// Character packs. `dir` is relative to assets/game assets. `anims` maps a
// logical animation name to the sub-folder that holds its frames.
const CHARACTERS = [
  { key: 'knight',       dir: 'char/Knight' },
  { key: 'mage',         dir: 'char/Mage' },
  { key: 'rogue',        dir: 'char/Rogue' },
  { key: 'pinkMonster',  dir: 'char/Pink_Monster/norm' },
  { key: 'owletMonster', dir: 'char/2 Owlet_Monster/norm' },
  { key: 'dudeMonster',  dir: 'char/3 Dude_Monster/norm' },
];
const CHAR_ANIMS = ['Idle', 'Walk', 'Run', 'Jump', 'Attack'];

// Mob packs. Plant2 ships directional frames; we keep the "Left" facing set.
const MOBS = [
  {
    key: 'plant1', dir: 'mobs/Plant1',
    anims: { idle: 'Idle', walk: 'Walk', attack: 'Attack1', death: 'Death' },
    filter: null,
  },
  {
    key: 'plant2', dir: 'mobs/Plant2',
    anims: { idle: 'Idle', walk: 'Walk', attack: 'Attack', death: 'Death' },
    filter: (name) => name.includes('_Left'),
  },
];

// ---- helpers ------------------------------------------------------------
const naturalSort = (a, b) => {
  const na = a.match(/\d+/g)?.map(Number) || [];
  const nb = b.match(/\d+/g)?.map(Number) || [];
  const len = Math.max(na.length, nb.length);
  for (let i = 0; i < len; i++) {
    const d = (na[i] ?? -1) - (nb[i] ?? -1);
    if (d !== 0) return d;
  }
  return a.localeCompare(b);
};

async function listPngs(dir, filter) {
  let entries;
  try { entries = await fs.readdir(dir); }
  catch { return []; }
  return entries
    .filter((f) => /\.png$/i.test(f))
    .filter((f) => (filter ? filter(f) : true))
    .sort(naturalSort)
    .map((f) => path.join(dir, f));
}

// Measure the opaque content box (left/top/width/height) of a PNG.
async function measure(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let top = height, bottom = -1, left = width, right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * channels + 3];
      if (a > ALPHA_THRESHOLD) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < top || right < left) {
    return { left: 0, top: 0, width, height, frameW: width, frameH: height };
  }
  return {
    left, top,
    width: right - left + 1,
    height: bottom - top + 1,
    frameW: width, frameH: height,
  };
}

// Build one horizontal spritesheet from a list of frame files, normalizing
// every frame's content into a fixed cell (bottom-centered). Returns metadata.
async function buildSheet(files, outBase) {
  if (!files.length) return null;

  const measured = [];
  for (const f of files) measured.push({ file: f, box: await measure(f) });

  const cellW = Math.max(...measured.map((m) => m.box.width)) + CELL_PAD * 2;
  const cellH = Math.max(...measured.map((m) => m.box.height)) + CELL_PAD * 2;
  const count = measured.length;

  const composites = [];
  for (let i = 0; i < count; i++) {
    const { file, box } = measured[i];
    // Extract just the opaque content region from the source frame.
    const buf = await sharp(file)
      .ensureAlpha()
      .extract({ left: box.left, top: box.top, width: box.width, height: box.height })
      .toBuffer();
    const dx = i * cellW + Math.round((cellW - box.width) / 2); // center horizontally
    const dy = cellH - CELL_PAD - box.height;                    // bottom-align (feet)
    composites.push({ input: buf, left: dx, top: dy });
  }

  const sheet = sharp({
    create: { width: cellW * count, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png();

  await sheet.composite(composites).toFile(`${outBase}.png`);

  const meta = { frameWidth: cellW, frameHeight: cellH, frameCount: count };
  await fs.writeFile(`${outBase}.json`, JSON.stringify(meta, null, 2));
  return meta;
}

async function copyImage(src, outBase) {
  await sharp(src).png().toFile(`${outBase}.png`);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(STANDALONE, { recursive: true });

  const manifest = { characters: {}, mobs: {}, level: {}, buttons: {} };

  // Characters
  for (const c of CHARACTERS) {
    manifest.characters[c.key] = {};
    for (const anim of CHAR_ANIMS) {
      const dir = path.join(SRC, c.dir, anim);
      const files = await listPngs(dir, null);
      if (!files.length) { console.warn(`  skip ${c.key}/${anim} (no frames)`); continue; }
      const key = `${c.key}_${anim.toLowerCase()}`;
      const meta = await buildSheet(files, path.join(OUT, key));
      manifest.characters[c.key][anim.toLowerCase()] = { key, ...meta };
      console.log(`  ${key}: ${meta.frameCount} frames @ ${meta.frameWidth}x${meta.frameHeight}`);
    }
  }

  // Mobs
  for (const m of MOBS) {
    manifest.mobs[m.key] = {};
    for (const [anim, folder] of Object.entries(m.anims)) {
      const dir = path.join(SRC, m.dir, folder);
      const files = await listPngs(dir, m.filter);
      if (!files.length) { console.warn(`  skip ${m.key}/${anim} (no frames)`); continue; }
      const key = `${m.key}_${anim}`;
      const meta = await buildSheet(files, path.join(OUT, key));
      manifest.mobs[m.key][anim] = { key, ...meta };
      console.log(`  ${key}: ${meta.frameCount} frames @ ${meta.frameWidth}x${meta.frameHeight}`);
    }
  }

  // Level background
  const bgSrc = path.join(SRC, 'level', 'background full size.png');
  try {
    await copyImage(bgSrc, path.join(OUT, 'background'));
    manifest.level.background = 'background';
    console.log('  background copied');
  } catch { console.warn('  no background'); }

  // Ability + hearts (HUD art the platformer references)
  const extras = [
    { src: 'level/Bottle (ability).png', key: 'ability' },
    { src: 'Button/settings.png', key: 'settings' },
    { src: 'Button/1_5 heart.png', key: 'heart_1' },
    { src: 'Button/2_5 heart.png', key: 'heart_2' },
    { src: 'Button/3_5 heart.png', key: 'heart_3' },
    { src: 'Button/4_5 heart.png', key: 'heart_4' },
    { src: 'Button/5_5 heart.png', key: 'heart_5' },
  ];
  for (const e of extras) {
    try { await copyImage(path.join(SRC, e.src), path.join(OUT, e.key)); manifest.level[e.key] = e.key; }
    catch { console.warn(`  no ${e.key}`); }
  }

  // Buttons
  const buttons = ['left', 'right', 'up', 'down'];
  for (const b of buttons) {
    try {
      await copyImage(path.join(SRC, 'Button', `${b}.png`), path.join(OUT, `btn_${b}`));
      manifest.buttons[b] = `btn_${b}`;
    } catch { console.warn(`  no button ${b}`); }
  }

  await fs.writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Emit a React Native asset module (static requires so Metro bundles every
  // sheet) that resolves the packed spritesheets to URIs for the Expo wrapper.
  // Scenes never import this — they read plain URLs from the game registry —
  // so the scenes stay pure Phaser and reusable in the standalone build.
  await emitRnModule(manifest);

  // Mirror everything into the standalone assets folder so the standalone HTML
  // game (Phaser Editor / web deploy) can load the exact same files.
  const all = (await fs.readdir(OUT)).filter((f) => /\.(png|json)$/i.test(f));
  for (const f of all) {
    await fs.copyFile(path.join(OUT, f), path.join(STANDALONE, f));
  }

  console.log(`\nDone. ${all.length} files -> assets/phaser/ (mirrored to standalone).`);
}

// Collect every texture key the manifest references and its output filename.
function collectKeys(manifest) {
  const keys = new Set();
  for (const anims of Object.values(manifest.characters)) {
    for (const a of Object.values(anims)) keys.add(a.key);
  }
  for (const anims of Object.values(manifest.mobs)) {
    for (const a of Object.values(anims)) keys.add(a.key);
  }
  for (const v of Object.values(manifest.level)) keys.add(v);
  for (const v of Object.values(manifest.buttons)) keys.add(v);
  return [...keys];
}

// Write src/game-phaser/phaserAssets.js — a Metro-friendly module mapping each
// spritesheet key to its resolved URI plus the frame metadata.
async function emitRnModule(manifest) {
  const keys = collectKeys(manifest);
  const lines = [];
  lines.push('// AUTO-GENERATED by scripts/generate-spritesheets.mjs — do not edit.');
  lines.push('// Resolves packed Phaser spritesheets to URIs for the Expo wrapper.');
  lines.push("import { Image } from 'react-native';");
  lines.push('');
  lines.push('const RAW = {');
  for (const k of keys) {
    lines.push(`  '${k}': require('../../assets/phaser/${k}.png'),`);
  }
  lines.push('};');
  lines.push('');
  lines.push('const resolve = (m) => Image.resolveAssetSource(m).uri;');
  lines.push('');
  lines.push(`export const MANIFEST = ${JSON.stringify(manifest, null, 2)};`);
  lines.push('');
  lines.push('// { key: uri } for every packed spritesheet / image.');
  lines.push('export function resolvePhaserTextures() {');
  lines.push('  const out = {};');
  lines.push('  for (const k of Object.keys(RAW)) out[k] = resolve(RAW[k]);');
  lines.push('  return out;');
  lines.push('}');
  lines.push('');
  const mod = path.join(ROOT, 'src', 'game-phaser', 'phaserAssets.js');
  await fs.writeFile(mod, lines.join('\n'));
  console.log(`  emitted src/game-phaser/phaserAssets.js (${keys.length} textures)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
