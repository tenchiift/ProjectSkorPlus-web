// ============================================================================
// SKOR+ CalcQuest: Handcrafted 16x16 Pixel-Art Tile & Layered Sprite Engine
// Reason (R-20, R-31): Renders outlined 16-bit pixel-art sprites with 3-tone
// shading, cobbled paths, shingled cottages, shoreline ripples, and layered
// character sprites instead of flat geometric boxes.
// ============================================================================

import { AVATAR_OPTIONS } from '../data/worldsData';

const SKIN_MAP = Object.fromEntries(
  AVATAR_OPTIONS.baseCharacters.map((c) => [c.id, c])
);

const OUTLINE = '#1E1610';

const WORLD_PALETTES = {
  world_1: {
    turf1: '#59A84A',
    turf2: '#4B963D',
    turfSpec: '#76C264',
    turfShadow: '#39782C',
    pathFill: '#D8B37C',
    pathCobble: '#C29860',
    pathRim: '#8C6234',
    waterDeep: '#247BA0',
    waterMid: '#3696BF',
    waterFoam: '#D4F1F9',
    wall: '#E8D8B9',
    timber: '#6E4726',
    roofMain: '#B84A28',
    roofShade: '#8C3216',
    leafHigh: '#68B84E',
    leafMid: '#3E8C34',
    leafDark: '#255E20',
  },
  world_2: {
    turf1: '#2D6E59',
    turf2: '#235C49',
    turfSpec: '#438C74',
    turfShadow: '#184234',
    pathFill: '#8D99A6',
    pathCobble: '#6E7B88',
    pathRim: '#46515C',
    waterDeep: '#1A5E8A',
    waterMid: '#2678AD',
    waterFoam: '#BEE9F7',
    wall: '#94A3B8',
    timber: '#334155',
    roofMain: '#1D6E68',
    roofShade: '#114B47',
    leafHigh: '#3D9982',
    leafMid: '#24735F',
    leafDark: '#144A3C',
  },
  world_3: {
    turf1: '#4A3B2F',
    turf2: '#3E3127',
    turfSpec: '#634F3F',
    turfShadow: '#2B211A',
    pathFill: '#B87A3D',
    pathCobble: '#996028',
    pathRim: '#5E3813',
    waterDeep: '#1E524E',
    waterMid: '#2A6E68',
    waterFoam: '#A8E0DC',
    wall: '#C2A88B',
    timber: '#523A24',
    roofMain: '#B8621B',
    roofShade: '#85420C',
    leafHigh: '#C98A3A',
    leafMid: '#9E6620',
    leafDark: '#69400F',
  },
  world_4: {
    turf1: '#62549E',
    turf2: '#54468C',
    turfSpec: '#7E6FBF',
    turfShadow: '#3D316B',
    pathFill: '#D4C2EC',
    pathCobble: '#B59ED6',
    pathRim: '#755B99',
    waterDeep: '#241E4E',
    waterMid: '#352D6E',
    waterFoam: '#E2D4F7',
    wall: '#EFE8FA',
    timber: '#634B8A',
    roofMain: '#3B7EA8',
    roofShade: '#265878',
    leafHigh: '#A987E8',
    leafMid: '#835EC7',
    leafDark: '#573991',
  },
  world_5: {
    turf1: '#525B66',
    turf2: '#454D57',
    turfSpec: '#6B7685',
    turfShadow: '#2E343B',
    pathFill: '#A8B2BD',
    pathCobble: '#8893A0',
    pathRim: '#525A63',
    waterDeep: '#1C2530',
    waterMid: '#283545',
    waterFoam: '#CBD5E1',
    wall: '#CBD5E1',
    timber: '#475569',
    roofMain: '#B8841B',
    roofShade: '#875E0D',
    leafHigh: '#94A3B8',
    leafMid: '#64748B',
    leafDark: '#334155',
  },
};

export function drawWorldTile(ctx, worldId, tileCode, gx, gy, px, py, tileSize, tick, worldState = {}) {
  const s = tileSize / 16;
  const pal = WORLD_PALETTES[worldId] || WORLD_PALETTES.world_1;
  const bridgeRepaired = !!worldState.bridge_repaired || !!worldState.w2_continuity_bridge;
  const gardenBloomed = !!worldState.w1_garden_bloomed;
  const gearsSpinning = !!worldState.w3_gears_spinning || bridgeRepaired;

  // 1. Textured Turf Base with 16-bit grass tufts
  const checker = (gx + gy) % 2 === 0;
  ctx.fillStyle = checker ? pal.turf1 : pal.turf2;
  ctx.fillRect(px, py, tileSize, tileSize);

  ctx.fillStyle = pal.turfSpec;
  ctx.fillRect(px + 2 * s, py + 3 * s, s, 2 * s);
  ctx.fillRect(px + 3 * s, py + 4 * s, s, s);
  ctx.fillRect(px + 11 * s, py + 11 * s, s, 2 * s);
  ctx.fillStyle = pal.turfShadow;
  ctx.fillRect(px + 7 * s, py + 13 * s, 2 * s, s);

  // Tile 3: Cobblestone RPG Path with recessed mortar joints
  if (tileCode === 3) {
    ctx.fillStyle = pal.pathFill;
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = pal.pathCobble;
    ctx.fillRect(px + 2 * s, py + 2 * s, 5 * s, 5 * s);
    ctx.fillRect(px + 9 * s, py + 2 * s, 5 * s, 4 * s);
    ctx.fillRect(px + 1 * s, py + 9 * s, 6 * s, 5 * s);
    ctx.fillRect(px + 9 * s, py + 8 * s, 5 * s, 6 * s);
    ctx.fillStyle = pal.pathRim;
    ctx.fillRect(px + 2 * s, py + 7 * s, 5 * s, s);
    ctx.fillRect(px + 9 * s, py + 6 * s, 5 * s, s);
    ctx.fillRect(px + 1 * s, py + 14 * s, 6 * s, s);
    ctx.fillRect(px + 9 * s, py + 14 * s, 5 * s, s);
    return;
  }

  // Tile 2: Animated Water / Chasm (or Unrepaired Bridge Tile 5)
  if (tileCode === 2 || (tileCode === 5 && !bridgeRepaired)) {
    const wave = Math.floor(tick / 20 + gx + gy) % 3;
    ctx.fillStyle = pal.waterDeep;
    ctx.fillRect(px, py, tileSize, tileSize);
    ctx.fillStyle = pal.waterMid;
    ctx.fillRect(px + s, py + 2 * s, 14 * s, 12 * s);
    // Shoreline foam & ripple highlights
    ctx.fillStyle = pal.waterFoam;
    ctx.fillRect(px + (2 + wave * 2) * s, py + 4 * s, 4 * s, s);
    ctx.fillRect(px + (7 - wave * 2) * s, py + 11 * s, 5 * s, s);

    if (tileCode === 5) {
      // Broken wooden bridge pilings on both banks
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px, py + 2 * s, 4 * s, 12 * s);
      ctx.fillRect(px + 12 * s, py + 2 * s, 4 * s, 12 * s);
      ctx.fillStyle = '#8C5A2B';
      ctx.fillRect(px + s, py + 3 * s, 2 * s, 10 * s);
      ctx.fillRect(px + 13 * s, py + 3 * s, 2 * s, 10 * s);
    }
    return;
  }

  // Tile 5: Repaired Bridge / Stepping Stones / Sky Bridge
  if (tileCode === 5 && bridgeRepaired) {
    ctx.fillStyle = pal.waterDeep;
    ctx.fillRect(px, py, tileSize, tileSize);

    if (worldId === 'world_2') {
      // Carved stone stepping platform in river
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px + 2 * s, py + 2 * s, 12 * s, 12 * s);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(px + 3 * s, py + 3 * s, 10 * s, 10 * s);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(px + 6 * s, py + 6 * s, 4 * s, 4 * s);
    } else {
      // Sturdy timber plank bridge with rope rails
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px, py + s, tileSize, 14 * s);
      ctx.fillStyle = '#8C5A2B';
      ctx.fillRect(px, py + 2 * s, tileSize, 12 * s);
      ctx.fillStyle = '#B87D3E';
      for (let i = 1; i < 15; i += 4) {
        ctx.fillRect(px + i * s, py + 3 * s, 3 * s, 10 * s);
      }
      ctx.fillStyle = '#D9A05B';
      ctx.fillRect(px, py + 2 * s, tileSize, s);
      ctx.fillRect(px, py + 13 * s, tileSize, s);
    }
    return;
  }

  // Tile 1: Outlined 16-Bit RPG Tree / Pillar Obstacle
  if (tileCode === 1) {
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(px + 3 * s, py + 13 * s, 10 * s, 2 * s);
    // Trunk with outline
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(px + 5 * s, py + 9 * s, 6 * s, 6 * s);
    ctx.fillStyle = '#6E4726';
    ctx.fillRect(px + 6 * s, py + 10 * s, 4 * s, 4 * s);
    // Layered canopy with dark pixel outline
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(px + 2 * s, py + 2 * s, 12 * s, 9 * s);
    ctx.fillRect(px + 3 * s, py + s, 10 * s, 10 * s);
    ctx.fillStyle = pal.leafDark;
    ctx.fillRect(px + 3 * s, py + 3 * s, 10 * s, 7 * s);
    ctx.fillStyle = pal.leafMid;
    ctx.fillRect(px + 3 * s, py + 2 * s, 10 * s, 6 * s);
    ctx.fillStyle = pal.leafHigh;
    ctx.fillRect(px + 4 * s, py + 2 * s, 7 * s, 3 * s);
    return;
  }

  // Tile 4: Timber-Framed RPG Cottage / Academy / Lab Building
  if (tileCode === 4) {
    // Outer outline
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(px, py, tileSize, tileSize);
    // Shingled pitched roof
    ctx.fillStyle = pal.roofShade;
    ctx.fillRect(px + s, py + s, 14 * s, 6 * s);
    ctx.fillStyle = pal.roofMain;
    ctx.fillRect(px + s, py + s, 14 * s, 4 * s);
    // Timber wall
    ctx.fillStyle = pal.wall;
    ctx.fillRect(px + s, py + 7 * s, 14 * s, 8 * s);
    ctx.fillStyle = pal.timber;
    ctx.fillRect(px + s, py + 7 * s, 2 * s, 8 * s);
    ctx.fillRect(px + 13 * s, py + 7 * s, 2 * s, 8 * s);
    // Warm paned window
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(px + 5 * s, py + 8 * s, 6 * s, 5 * s);
    ctx.fillStyle = '#F5B82E';
    ctx.fillRect(px + 6 * s, py + 9 * s, 4 * s, 3 * s);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(px + 7.5 * s, py + 9 * s, s, 3 * s);
    return;
  }

  // Tile 7: Interactive World Prop (Garden Plot / Brass Gear / Resonance Crystal)
  if (tileCode === 7) {
    if (worldId === 'world_1') {
      // Raised soil planter bed with pixel flowers
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px + s, py + 2 * s, 14 * s, 12 * s);
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect(px + 2 * s, py + 3 * s, 12 * s, 10 * s);
      ctx.fillStyle = '#2E8B57';
      ctx.fillRect(px + 4 * s, py + 6 * s, 3 * s, 4 * s);
      ctx.fillRect(px + 9 * s, py + 6 * s, 3 * s, 4 * s);
      ctx.fillStyle = gardenBloomed ? '#F5B82E' : '#A3D977';
      ctx.fillRect(px + 4 * s, py + 4 * s, 3 * s, 3 * s);
      ctx.fillRect(px + 9 * s, py + 4 * s, 3 * s, 3 * s);
    } else if (worldId === 'world_3') {
      // Recessed Brass Gear Pit
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px + s, py + s, 14 * s, 14 * s);
      ctx.fillStyle = '#261C14';
      ctx.fillRect(px + 2 * s, py + 2 * s, 12 * s, 12 * s);
      const step = gearsSpinning ? Math.floor(tick / 10) % 2 : 0;
      ctx.fillStyle = gearsSpinning ? '#D9822B' : '#7A6855';
      ctx.fillRect(px + 4 * s, py + 4 * s, 8 * s, 8 * s);
      ctx.fillStyle = '#F5B82E';
      ctx.fillRect(px + (5 + step) * s, py + 5 * s, 4 * s, 4 * s);
    } else {
      // Faceted Crystal Formation
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(px + 4 * s, py + 2 * s, 8 * s, 12 * s);
      ctx.fillStyle = worldId === 'world_2' ? '#3696BF' : worldId === 'world_4' ? '#9B6B9E' : '#D99B26';
      ctx.fillRect(px + 5 * s, py + 3 * s, 6 * s, 10 * s);
      ctx.fillStyle = '#FFF7D6';
      ctx.fillRect(px + 6 * s, py + 4 * s, 2 * s, 6 * s);
    }
  }
}

export function drawLayeredAvatar(ctx, avatarConfig = {}, px, py, size = 48, direction = 'down', animFrame = 0, isCelebrating = false) {
  const s = size / 16;
  const skinObj = SKIN_MAP[avatarConfig.base_character] || SKIN_MAP.tone_2;
  const skin = skinObj.skin;
  const skinShadow = skinObj.shadow;
  const hairColor = avatarConfig.selected_colors?.hair || '#2C1B12';
  const outfitColor = avatarConfig.selected_colors?.outfit || '#3E7BD6';
  const headAcc = avatarConfig.selected_accessories?.head || 'none';
  const backAcc = avatarConfig.selected_accessories?.back || 'none';
  const hairStyle = avatarConfig.selected_hair || 'spiky';

  const bounceY = isCelebrating
    ? -Math.abs(Math.sin(animFrame * 0.35)) * 3 * s
    : animFrame % 2 === 1
      ? -1 * s
      : 0;

  ctx.save();
  ctx.translate(px, py + bounceY);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(4 * s, 14 * s - bounceY, 8 * s, 2 * s);

  // Layer 1: Back Accessory
  if (backAcc === 'cape_integral') {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(2 * s, 6 * s, 12 * s, 8 * s);
    ctx.fillStyle = '#6C3B9E';
    ctx.fillRect(3 * s, 7 * s, 10 * s, 6 * s);
  } else if (backAcc === 'satchel') {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(2 * s, 7 * s, 3 * s, 5 * s);
    ctx.fillStyle = '#8C5A2B';
    ctx.fillRect(2.5 * s, 7.5 * s, 2 * s, 4 * s);
  }

  // Layer 2: Outlined Boots & Legs
  const leftStep = animFrame === 1 ? -1 * s : 0;
  const rightStep = animFrame === 2 ? -1 * s : 0;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(4.5 * s, 12 * s + leftStep, 3 * s, 3 * s);
  ctx.fillRect(8.5 * s, 12 * s + rightStep, 3 * s, 3 * s);
  ctx.fillStyle = '#4A321F';
  ctx.fillRect(5 * s, 12.5 * s + leftStep, 2 * s, 2 * s);
  ctx.fillRect(9 * s, 12.5 * s + rightStep, 2 * s, 2 * s);

  // Layer 3: Outlined Tunic / Coat
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(3 * s, 8 * s, 10 * s, 5 * s);
  ctx.fillStyle = outfitColor;
  ctx.fillRect(4 * s, 8.5 * s, 8 * s, 4 * s);
  // Belt & brass buckle
  ctx.fillStyle = '#3D2612';
  ctx.fillRect(4 * s, 11 * s, 8 * s, s);
  ctx.fillStyle = '#F5B82E';
  ctx.fillRect(7 * s, 11 * s, 2 * s, s);

  // Arms
  const armOffset = isCelebrating ? -2.5 * s : 0;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(2 * s, 8.5 * s + armOffset, 2 * s, 4 * s);
  ctx.fillRect(12 * s, 8.5 * s + armOffset, 2 * s, 4 * s);
  ctx.fillStyle = skin;
  ctx.fillRect(2.5 * s, 10.5 * s + armOffset, 1.2 * s, 1.5 * s);
  ctx.fillRect(12.3 * s, 10.5 * s + armOffset, 1.2 * s, 1.5 * s);

  // Layer 4: Outlined Head & Face
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(3 * s, 2 * s, 10 * s, 7 * s);
  ctx.fillStyle = skin;
  ctx.fillRect(4 * s, 3 * s, 8 * s, 5.5 * s);
  ctx.fillStyle = skinShadow;
  ctx.fillRect(4 * s, 7.5 * s, 8 * s, s);

  if (direction !== 'up') {
    const shift = direction === 'left' ? -1 * s : direction === 'right' ? 1 * s : 0;
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(5.5 * s + shift, 5 * s, 1.4 * s, 2 * s);
    ctx.fillRect(9.2 * s + shift, 5 * s, 1.4 * s, 2 * s);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(5.5 * s + shift, 5 * s, 0.7 * s, 0.8 * s);
    ctx.fillRect(9.2 * s + shift, 5 * s, 0.7 * s, 0.8 * s);
  }

  // Layer 5: Hair
  ctx.fillStyle = hairColor;
  ctx.fillRect(3.5 * s, 2 * s, 9 * s, 2.2 * s);
  if (hairStyle === 'spiky') {
    ctx.fillRect(4 * s, 1 * s, 2 * s, 1.5 * s);
    ctx.fillRect(7 * s, 0.8 * s, 2 * s, 1.5 * s);
    ctx.fillRect(10 * s, 1 * s, 2 * s, 1.5 * s);
  } else if (hairStyle === 'long') {
    ctx.fillRect(3 * s, 3 * s, 1.5 * s, 5.5 * s);
    ctx.fillRect(11.5 * s, 3 * s, 1.5 * s, 5.5 * s);
  } else if (hairStyle === 'bob') {
    ctx.fillRect(3.2 * s, 2.5 * s, 1.3 * s, 4 * s);
    ctx.fillRect(11.5 * s, 2.5 * s, 1.3 * s, 4 * s);
  } else if (hairStyle === 'curly') {
    ctx.fillRect(3 * s, 1.5 * s, 10 * s, 2.8 * s);
  }

  // Layer 6: Head Accessories
  if (headAcc === 'hat_algebra') {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(2 * s, 1 * s, 12 * s, 2 * s);
    ctx.fillStyle = '#266B3E';
    ctx.fillRect(2.5 * s, 1.3 * s, 11 * s, 1.4 * s);
    ctx.fillRect(4.5 * s, 0, 7 * s, 1.8 * s);
  } else if (headAcc === 'goggles_derivative') {
    ctx.fillStyle = '#B87314';
    ctx.fillRect(4 * s, 2.2 * s, 8 * s, 1.8 * s);
    ctx.fillStyle = '#9ED8F5';
    ctx.fillRect(4.8 * s, 2.5 * s, 2.4 * s, 1.2 * s);
    ctx.fillRect(8.8 * s, 2.5 * s, 2.4 * s, 1.2 * s);
  } else if (headAcc === 'crown_master') {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(3.5 * s, 0, 9 * s, 2.5 * s);
    ctx.fillStyle = '#F5B82E';
    ctx.fillRect(4 * s, 0.5 * s, 8 * s, 1.8 * s);
  } else if (headAcc === 'bandana') {
    ctx.fillStyle = '#B83B2A';
    ctx.fillRect(3.8 * s, 2.4 * s, 8.4 * s, 1.3 * s);
  }

  ctx.restore();
}

export function drawNPCSprite(ctx, npc, px, py, size = 48, tick = 0, isCompleted = false) {
  const s = size / 16;
  const bob = Math.sin(tick / 18 + npc.x) * 1.2;

  if (npc.isBoss) {
    ctx.save();
    ctx.translate(px, py + bob);

    const bossPalettes = {
      boss_algebra: { armor: '#6E7885', core: '#2E8B57', trim: '#D99B26' },
      boss_limit: { armor: '#246A8E', core: '#5BC0EB', trim: '#E2F1F8' },
      boss_derivative: { armor: '#8C5220', core: '#E07A2B', trim: '#F5B82E' },
      boss_integral: { armor: '#5B3E85', core: '#B88AE8', trim: '#E8D8F8' },
      boss_final: { armor: '#2E343B', core: '#F5B82E', trim: '#C83E31' },
    };
    const bp = bossPalettes[npc.spriteType] || bossPalettes.boss_algebra;

    // Outlined Golem / Guardian Silhouette
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(1.5 * s, 1.5 * s, 13 * s, 13 * s);
    ctx.fillStyle = bp.armor;
    ctx.fillRect(2.5 * s, 2.5 * s, 11 * s, 11 * s);
    // Shoulder pauldrons
    ctx.fillStyle = bp.trim;
    ctx.fillRect(1 * s, 3 * s, 2.5 * s, 6 * s);
    ctx.fillRect(12.5 * s, 3 * s, 2.5 * s, 6 * s);
    // Core chest emblem
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(5 * s, 6 * s, 6 * s, 5 * s);
    ctx.fillStyle = isCompleted ? '#2E8B57' : bp.core;
    ctx.fillRect(5.8 * s, 6.8 * s, 4.4 * s, 3.4 * s);
    // Visor eyes
    ctx.fillStyle = '#FFF7D6';
    ctx.fillRect(5 * s, 4 * s, 2 * s, 1.4 * s);
    ctx.fillRect(9 * s, 4 * s, 2 * s, 1.4 * s);

    ctx.restore();
    return;
  }

  const presetMap = {
    professor_pi: {
      base_character: 'tone_1',
      selected_hair: 'bob',
      selected_colors: { hair: '#D8D2C5', outfit: '#5B3E85' },
      selected_accessories: { head: 'hat_algebra', back: 'cape_integral', effect: 'none' },
    },
    merchant: {
      base_character: 'tone_2',
      selected_hair: 'curly',
      selected_colors: { hair: '#6E3818', outfit: '#B8621B' },
      selected_accessories: { head: 'bandana', back: 'satchel', effect: 'none' },
    },
    engineer: {
      base_character: 'tone_3',
      selected_hair: 'spiky',
      selected_colors: { hair: '#2C1B12', outfit: '#8C5220' },
      selected_accessories: { head: 'goggles_derivative', back: 'none', effect: 'none' },
    },
    scientist: {
      base_character: 'tone_1',
      selected_hair: 'long',
      selected_colors: { hair: '#3B2618', outfit: '#246A8E' },
      selected_accessories: { head: 'none', back: 'none', effect: 'none' },
    },
    explorer: {
      base_character: 'tone_2',
      selected_hair: 'spiky',
      selected_colors: { hair: '#B87D28', outfit: '#266B3E' },
      selected_accessories: { head: 'bandana', back: 'satchel', effect: 'none' },
    },
    villager: {
      base_character: 'tone_3',
      selected_hair: 'bob',
      selected_colors: { hair: '#2C1B12', outfit: '#3A6B9C' },
      selected_accessories: { head: 'none', back: 'none', effect: 'none' },
    },
  };

  drawLayeredAvatar(
    ctx,
    presetMap[npc.spriteType] || presetMap.villager,
    px,
    py + bob * 0.4,
    size,
    'down',
    0,
    false
  );
}
