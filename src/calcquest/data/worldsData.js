// ============================================================================
// SKOR+ CalcQuest: Five Calculus Worlds, Quests, NPCs, Cosmetics & Tilemaps
// ============================================================================

export const AVATAR_OPTIONS = {
  baseCharacters: [
    { id: 'tone_1', name: 'Warm Ivory', skin: '#FCE0C8', shadow: '#E2B492' },
    { id: 'tone_2', name: 'Golden Honey', skin: '#ECC096', shadow: '#C9986D' },
    { id: 'tone_3', name: 'Sunlit Bronze', skin: '#C68B59', shadow: '#9E683B' },
    { id: 'tone_4', name: 'Deep Umber', skin: '#7D4E2D', shadow: '#57331A' },
  ],
  hairstyles: [
    { id: 'spiky', name: 'Adventurer Spikes' },
    { id: 'bob', name: 'Scholar Bob' },
    { id: 'long', name: 'Flowing Locks' },
    { id: 'curly', name: 'Arcane Curls' },
  ],
  hairColors: [
    { id: '#2C1B12', name: 'Espresso' },
    { id: '#8D401D', name: 'Auburn Copper' },
    { id: '#EAB308', name: 'Sun Gold' },
    { id: '#38BDF8', name: 'Aether Blue' },
    { id: '#C084FC', name: 'Mystic Violet' },
  ],
  outfits: [
    { id: 'tunic', name: 'Explorer Tunic', unlockId: 'default' },
    { id: 'robe', name: 'Academy Robe', unlockId: 'default' },
    { id: 'jacket', name: 'Artificer Jacket', unlockId: 'default' },
    { id: 'outfit_river', name: 'River Adventurer Coat', unlockId: 'world_2_complete', badge: 'World 2 Reward' },
  ],
  outfitColors: [
    { id: '#3E7BD6', name: 'Royal Sapphire' },
    { id: '#2F9E5F', name: 'Emerald Leaf' },
    { id: '#D97706', name: 'Brass Amber' },
    { id: '#7E6BC4', name: 'Astral Indigo' },
    { id: '#E11D48', name: 'Crimson Valor' },
  ],
  headAccessories: [
    { id: 'none', name: 'None', unlockId: 'default' },
    { id: 'bandana', name: 'Scout Bandana', unlockId: 'default' },
    { id: 'hat_algebra', name: 'Algebra Explorer Hat', unlockId: 'world_1_complete', badge: 'World 1 Reward' },
    { id: 'goggles_derivative', name: 'Derivative Engineer Goggles', unlockId: 'world_3_complete', badge: 'World 3 Reward' },
    { id: 'crown_master', name: 'Calculus Master Crown', unlockId: 'world_5_complete', badge: 'World 5 Reward' },
  ],
  backAccessories: [
    { id: 'none', name: 'None', unlockId: 'default' },
    { id: 'satchel', name: 'Field Satchel', unlockId: 'default' },
    { id: 'cape_integral', name: 'Integral Mage Cape', unlockId: 'world_4_complete', badge: 'World 4 Reward' },
  ],
  cosmeticEffects: [
    { id: 'none', name: 'None', unlockId: 'default' },
    { id: 'leaf_sparkle', name: 'Emerald Spark', unlockId: 'world_1_complete' },
    { id: 'aether_halo', name: 'Harmonic Rune Halo', unlockId: 'world_4_complete' },
  ],
};

export const ACHIEVEMENTS_CATALOG = [
  {
    id: 'first_equation',
    title: 'First Steps in the Realm',
    description: 'Complete Professor Pi’s welcome challenge in Foundation Village.',
    icon: 'core_green',
    xpReward: 25,
    coinReward: 20,
  },
  {
    id: 'bridge_builder',
    title: 'Bridge Restorer',
    description: 'Repair and cross the Broken Village Bridge in Foundation Village.',
    icon: 'compass',
    xpReward: 50,
    coinReward: 40,
  },
  {
    id: 'core_world_1',
    title: 'Foundation Core Restored',
    description: 'Defeat the Algebra Guardian and restore the Foundation Knowledge Core.',
    icon: 'core_green',
    xpReward: 100,
    coinReward: 80,
  },
  {
    id: 'core_world_2',
    title: 'Tamer of the River of Uncertainty',
    description: 'Defeat the Limit Guardian and restore the Limit Knowledge Core.',
    icon: 'core_blue',
    xpReward: 120,
    coinReward: 100,
  },
  {
    id: 'core_world_3',
    title: 'Chief Derivative Engineer',
    description: 'Reactivate the Central Reactor and defeat the Derivative Automaton.',
    icon: 'core_amber',
    xpReward: 150,
    coinReward: 120,
  },
  {
    id: 'core_world_4',
    title: 'Architect of the Floating Isles',
    description: 'Reconnect the Sky Bridges and defeat the Integral Keeper.',
    icon: 'core_violet',
    xpReward: 180,
    coinReward: 150,
  },
  {
    id: 'core_world_5',
    title: 'Grand Calculus Sovereign',
    description: 'Complete the Final Knowledge Trial atop Mastery Mountain.',
    icon: 'crown',
    xpReward: 250,
    coinReward: 250,
  },
  {
    id: 'mistake_to_mastery',
    title: 'Mistake to Mastery',
    description: 'Complete a personalized remedial practice mission to overcome a misconception.',
    icon: 'scroll',
    xpReward: 60,
    coinReward: 50,
  },
  {
    id: 'team_synergy',
    title: 'Study Party Collaborator',
    description: 'Complete a cooperative Derivative Reactor mission in Study Party.',
    icon: 'shield',
    xpReward: 75,
    coinReward: 60,
  },
];

export const DAILY_QUESTS_POOL = [
  {
    id: 'dq_diff_3',
    title: 'Gear Calibration',
    description: 'Solve 3 differentiation or algebra challenges across any world.',
    target: 3,
    xpReward: 45,
    coinReward: 30,
    topicFilter: ['algebra', 'power_rule', 'product_rule', 'quotient_rule', 'chain_rule'],
  },
  {
    id: 'dq_limit_1',
    title: 'River Scout',
    description: 'Complete 1 limit or continuity puzzle in Limit Crossing.',
    target: 1,
    xpReward: 35,
    coinReward: 25,
    topicFilter: ['limits', 'continuity'],
  },
  {
    id: 'dq_integral_1',
    title: 'Aether Harvester',
    description: 'Solve 1 integration or area challenge in Integral Isles.',
    target: 1,
    xpReward: 40,
    coinReward: 25,
    topicFilter: ['indefinite_integration', 'definite_integration', 'substitution'],
  },
  {
    id: 'dq_error_spot',
    title: 'Archive Inspector',
    description: 'Complete 1 error-spotting or multi-step reasoning challenge.',
    target: 1,
    xpReward: 40,
    coinReward: 30,
    topicFilter: ['applications'],
  },
];

function buildMapGrid(width, height, builderFn) {
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        grid[y][x] = 1;
      } else {
        grid[y][x] = builderFn(x, y);
      }
    }
  }
  return grid;
}

export const WORLDS_DATA = {
  // ==========================================================================
  // WORLD 1: FOUNDATION VILLAGE
  // ==========================================================================
  world_1: {
    id: 'world_1',
    order: 1,
    name: 'Foundation Village',
    subtitle: 'Algebraic Foundations & Functions',
    themeColor: '#266B3E',
    coreName: 'Foundation Knowledge Core',
    coreItem: { id: 'core_1', name: 'Foundation Knowledge Core', icon: 'core_green', type: 'core' },
    cosmeticReward: 'hat_algebra',
    cosmeticRewardName: 'Algebra Explorer Hat',
    achievementReward: 'core_world_1',
    spawn: { x: 3, y: 9 },
    mapSize: { width: 28, height: 18 },
    storyIntro:
      'A sunlit village where the wooden bridge leading to the Learning Academy has collapsed into the stream. Restore the bridge’s mathematical runes to reach the Algebra Guardian.',
    palette: {
      ground: '#4D9E4A',
      groundAlt: '#438E40',
      path: '#D6AD72',
      water: '#38BDF8',
      wall: '#8B5A2B',
      roof: '#C2410C',
      accent: '#FACC15',
    },
    tiles: buildMapGrid(28, 18, (x, y) => {
      if (x === 15 || x === 16) {
        if (y === 8 || y === 9) return 5;
        return 2;
      }
      if ((x >= 3 && x <= 6 && y >= 2 && y <= 4) || (x >= 9 && x <= 12 && y >= 2 && y <= 4)) return 4;
      if (x >= 20 && x <= 24 && y >= 2 && y <= 4) return 4;
      if (x >= 4 && x <= 11 && y >= 13 && y <= 15) return 7;
      if (y === 8 || y === 9) return 3;
      if ((x === 7 || x === 8) && y >= 5 && y <= 14) return 3;
      if ((x === 2 && y === 14) || (x === 13 && y === 14) || (x === 19 && y === 14)) return 1;
      return 0;
    }),
    npcs: [
      {
        id: 'npc_pi_w1',
        name: 'Professor Pi',
        role: 'Chief Calculus Mentor',
        x: 5,
        y: 8,
        spriteType: 'professor_pi',
        questId: 'w1_quest_1',
        greeting:
          'Welcome to Foundation Village, Explorer. The Knowledge Cores that stabilize our realm have grown unstable, and our Academy Bridge has collapsed. Let’s start by calibrating your Algebraic Compass.',
        conceptExplanation:
          'In Calculus, almost every limit, derivative, and integral relies on clean algebraic manipulation: isolating variables, expanding brackets, and applying exponent laws without losing track of signs.',
      },
      {
        id: 'npc_merchant_w1',
        name: 'Merchant Lin',
        role: 'Village Quartermaster',
        x: 10,
        y: 5,
        spriteType: 'merchant',
        questId: 'w1_quest_2',
        greeting:
          'Thank goodness you are here. My supply chest is locked by a balanced linear equation. Can you find the missing number $x$ so we can distribute tools to the bridge crew?',
        conceptExplanation:
          'When an equation has brackets like $4(x+2) = 2x+20$, apply the distributive property $a(b+c) = ab + ac$ first, then group all $x$ terms on one side and constants on the other.',
      },
      {
        id: 'npc_gardener_w1',
        name: 'Gardener Mira',
        role: 'Keeper of the Function Garden',
        x: 7,
        y: 13,
        spriteType: 'villager',
        questId: 'w1_quest_3',
        greeting:
          'Look at these magical flora. Each plant is a mathematical function $f(x)$ that blooms when fed the exact output for a given input. Will you help illuminate the Function Garden?',
        conceptExplanation:
          'A function $f(x)$ is a rule that assigns each input $x$ to a single output $f(x)$. For a composite function $f(g(x))$, always evaluate the inside function $g(x)$ first.',
      },
      {
        id: 'npc_engineer_w1',
        name: 'Bridgewright Kael',
        role: 'Bridge Master',
        x: 13,
        y: 8,
        spriteType: 'engineer',
        questId: 'w1_quest_4',
        greeting:
          'The Academy Bridge is missing three structural sections. Each truss responds to exponent simplification and quadratic factoring. Solve all three to physically rebuild the bridge.',
        conceptExplanation:
          'When multiplying same-base powers, add exponents ($x^a \\cdot x^b = x^{a+b}$). When dividing, subtract exponents. Also recall the difference of squares: $x^2 - a^2 = (x - a)(x + a)$.',
      },
      {
        id: 'npc_baker_w1',
        name: 'Baker Otomo',
        role: 'Side Quest: Radical Artisan',
        x: 4,
        y: 5,
        spriteType: 'villager',
        questId: 'w1_side_1',
        greeting:
          'Optional Challenge: want to earn bonus CalcCoins? Help me convert radical expressions into fractional exponents for my oven timer.',
        conceptExplanation:
          'Any root can be written as a fractional power: $\\sqrt[n]{x^m} = x^{m/n}$. If that root sits in a denominator, use a negative exponent: $\\frac{1}{\\sqrt{x}} = x^{-1/2}$.',
      },
      {
        id: 'npc_gatekeeper_w1',
        name: 'Gatekeeper Arden',
        role: 'Academy Warden',
        x: 19,
        y: 8,
        spriteType: 'explorer',
        questId: 'w1_quest_5',
        greeting:
          'You crossed the repaired bridge. Ahead stands the Knowledge Gate and the Algebra Guardian. Match the power runes to unseal the Guardian’s courtyard.',
        conceptExplanation:
          'Mastering power laws ($(x^a)^b = x^{ab}$ versus $x^a \\cdot x^b = x^{a+b}$) is essential before you tackle the Power Rule in Derivative District.',
      },
      {
        id: 'boss_w1',
        name: 'The Algebra Guardian',
        role: 'World 1 Guardian Boss',
        x: 24,
        y: 9,
        spriteType: 'boss_algebra',
        isBoss: true,
        questId: 'w1_boss_quest',
        greeting:
          'I am the Algebra Guardian, keeper of the Foundation Knowledge Core. Prove your command of factoring, functions, and exponents across 3 stages to restore this region.',
        conceptExplanation:
          'Take your time on each stage: factor quadratics carefully, watch negative signs when squaring $(-2)^2 = +4$, and apply exponent rules step by step.',
      },
    ],
    interactiveObjects: [
      {
        id: 'obj_w1_chest',
        name: 'Merchant Supply Chest',
        type: 'chest',
        x: 11,
        y: 5,
        questId: 'w1_quest_2',
        stateKey: 'w1_chest_opened',
      },
      {
        id: 'obj_w1_garden',
        name: 'Luminous Function Flora',
        type: 'garden',
        x: 9,
        y: 14,
        questId: 'w1_quest_3',
        stateKey: 'w1_garden_bloomed',
      },
      {
        id: 'obj_w1_bridge',
        name: 'Broken Village Bridge',
        type: 'bridge',
        x: 14,
        y: 9,
        questId: 'w1_quest_4',
        stateKey: 'bridge_repaired',
      },
      {
        id: 'obj_w1_portal',
        name: 'Portal to Limit Crossing',
        type: 'portal',
        x: 26,
        y: 9,
        targetWorld: 'world_2',
        requiresBoss: true,
      },
    ],
    quests: [
      {
        id: 'w1_quest_1',
        title: 'Quest 1: Welcome to the Village',
        topic: 'Linear Equations',
        description: 'Speak with Professor Pi and solve your first algebraic equation to calibrate your Explorer Compass.',
        questionIds: ['w1_q1'],
        xpReward: 40,
        coinReward: 25,
        unlocksState: 'w1_entrance_open',
        rewardItem: { id: 'compass_pi', name: 'Algebraic Compass', icon: 'compass', type: 'quest' },
      },
      {
        id: 'w1_quest_2',
        title: 'Quest 2: The Missing Number',
        topic: 'Equations with Brackets',
        description: 'Help Merchant Lin unlock the village supply chest by solving for the missing value x.',
        questionIds: ['w1_q2'],
        xpReward: 50,
        coinReward: 40,
        unlocksState: 'w1_chest_opened',
        rewardItem: { id: 'bridge_timber', name: 'Enchanted Bridge Timber', icon: 'scroll', type: 'quest' },
      },
      {
        id: 'w1_quest_3',
        title: 'Quest 3: Function Garden',
        topic: 'Function & Composite Evaluation',
        description: 'Evaluate single and composite functions for Gardener Mira so the magical garden blooms with light.',
        questionIds: ['w1_q3', 'w1_q4'],
        xpReward: 65,
        coinReward: 45,
        unlocksState: 'w1_garden_bloomed',
        rewardItem: { id: 'bloom_essence', name: 'Luminous Function Dew', icon: 'core_green', type: 'fragment' },
      },
      {
        id: 'w1_quest_4',
        title: 'Quest 4: Repair the Village Bridge',
        topic: 'Exponents & Factorization',
        description: 'Solve three structural algebra challenges with Bridgewright Kael to visibly rebuild and cross the Village Bridge.',
        questionIds: ['w1_q5', 'w1_q6', 'w1_q7'],
        xpReward: 90,
        coinReward: 60,
        unlocksState: 'bridge_repaired',
        rewardItem: { id: 'bridge_keystone', name: 'Bridge Keystone', icon: 'shield', type: 'quest' },
      },
      {
        id: 'w1_quest_5',
        title: 'Quest 5: The Village Knowledge Gate',
        topic: 'Exponent Laws Matching',
        description: 'Cross the repaired bridge and align the power runes with Gatekeeper Arden.',
        questionIds: ['w1_q8'],
        xpReward: 60,
        coinReward: 40,
        unlocksState: 'w1_gate_open',
      },
      {
        id: 'w1_side_1',
        title: 'Side Quest: The Baker’s Exponent Oven',
        topic: 'Fractional & Negative Exponents',
        isSideQuest: true,
        description: 'Help Baker Otomo rewrite radical expressions in power form for future Calculus rules.',
        questionIds: ['w1_q9'],
        xpReward: 45,
        coinReward: 35,
      },
      {
        id: 'w1_boss_quest',
        title: 'Boss Trial: The Algebra Guardian',
        topic: 'Foundational Algebra & Functions Synthesis',
        isBossQuest: true,
        bossName: 'The Algebra Guardian',
        description: 'Overcome the Algebra Guardian’s 3 stages to recover the Foundation Knowledge Core and unlock Limit Crossing.',
        questionIds: ['w1_boss_1', 'w1_boss_2', 'w1_boss_3'],
        xpReward: 150,
        coinReward: 100,
        unlocksState: 'boss_defeated',
      },
    ],
  },

  // ==========================================================================
  // WORLD 2: LIMIT CROSSING
  // ==========================================================================
  world_2: {
    id: 'world_2',
    order: 2,
    name: 'Limit Crossing',
    subtitle: 'Limits, Indeterminate Forms & Continuity',
    themeColor: '#246A8E',
    coreName: 'Limit Knowledge Core',
    coreItem: { id: 'core_2', name: 'Limit Knowledge Core', icon: 'core_blue', type: 'core' },
    cosmeticReward: 'outfit_river',
    cosmeticRewardName: 'River Adventurer Coat',
    achievementReward: 'core_world_2',
    spawn: { x: 3, y: 9 },
    mapSize: { width: 28, height: 18 },
    storyIntro:
      'A misty emerald forest divided by the River of Uncertainty. Activate the ancient stepping stones and the three-part Continuity Bridge to calm the river.',
    palette: {
      ground: '#1E5E4A',
      groundAlt: '#164A3A',
      path: '#64748B',
      water: '#0284C7',
      wall: '#334155',
      roof: '#0F766E',
      accent: '#38BDF8',
    },
    tiles: buildMapGrid(28, 18, (x, y) => {
      if (x === 10 || x === 11) {
        if (y === 8 || y === 9) return 5;
        return 2;
      }
      if (x === 18 || x === 19) {
        if (y === 8 || y === 9) return 5;
        return 2;
      }
      if (x >= 13 && x <= 16 && y >= 2 && y <= 4) return 4;
      if ((x === 6 && y === 13) || (x === 14 && y === 14) || (x === 22 && y === 13)) return 7;
      if (y === 8 || y === 9) return 3;
      return 0;
    }),
    npcs: [
      {
        id: 'npc_explorer_w2',
        name: 'Explorer Talen',
        role: 'River Cartographer',
        x: 5,
        y: 8,
        spriteType: 'explorer',
        questId: 'w2_quest_1',
        greeting:
          'Welcome to Limit Crossing. Here, a function does not need to exist AT a point to approach a clear destination. Test my interactive River Compass.',
        conceptExplanation:
          'A limit $\\lim_{x \\to a} f(x) = L$ asks what value $f(x)$ gets closer and closer to as $x$ approaches $a$ from both the left ($x < a$) and the right ($x > a$).',
      },
      {
        id: 'npc_stones_w2',
        name: 'Stonekeeper Venn',
        role: 'Warden of the Stepping Stones',
        x: 8,
        y: 8,
        spriteType: 'villager',
        questId: 'w2_quest_2',
        greeting:
          'The stepping stones across the first channel have sunk. Evaluate these polynomial and indeterminate limits so the stones rise above the current.',
        conceptExplanation:
          'Always try direct substitution first. If it gives a real number, you are done. If it gives $\\frac{0}{0}$, factor the numerator and denominator to cancel the zero-producing factor.',
      },
      {
        id: 'npc_cave_w2',
        name: 'Mystic Lyra',
        role: 'Keeper of the Hidden Cave',
        x: 14,
        y: 5,
        spriteType: 'scientist',
        questId: 'w2_quest_3',
        greeting:
          'Inside this cave lies an ancient rune locked by a $\\frac{0}{0}$ indeterminate form. Complete the missing factoring step to reveal why the hole disappears.',
        conceptExplanation:
          'When $x \\to 2$, $x$ is approaching $2$ but $x \\neq 2$. That is why $x - 2 \\neq 0$, allowing us to legally divide both numerator and denominator by $(x - 2)$.',
      },
      {
        id: 'npc_bridge_w2',
        name: 'Architect Soren',
        role: 'Continuity Engineer',
        x: 16,
        y: 8,
        spriteType: 'engineer',
        questId: 'w2_quest_4',
        greeting:
          'The Continuity Bridge has three segments, one for each mathematical condition of continuity at a point $x = a$. Restore all three.',
        conceptExplanation:
          'A curve can only be drawn without lifting your pen at $x = a$ if: (1) $f(a)$ is defined, (2) $\\lim_{x \\to a} f(x)$ exists, and (3) $\\lim_{x \\to a} f(x) = f(a)$.',
      },
      {
        id: 'npc_shrine_w2',
        name: 'Hermit Caelum',
        role: 'Side Quest: Rationalization Sage',
        x: 14,
        y: 13,
        spriteType: 'professor_pi',
        questId: 'w2_side_1',
        greeting:
          'Optional Shrine Challenge: when a limit contains a square root like $\\sqrt{x} - 3$, how do we resolve $\\frac{0}{0}$? Test your conjugate mastery.',
        conceptExplanation:
          'Multiply numerator and denominator by the conjugate $(\\sqrt{x} + 3)$, or recognize $x - 9 = (\\sqrt{x} - 3)(\\sqrt{x} + 3)$.',
      },
      {
        id: 'npc_waterfall_w2',
        name: 'Watcher Nerissa',
        role: 'Waterfall Gate Guardian',
        x: 21,
        y: 8,
        spriteType: 'explorer',
        questId: 'w2_quest_5',
        greeting:
          'Two streams merge at the Waterfall Gate. Check the left-hand limit ($x \\to 1^-$) and right-hand limit ($x \\to 1^+$) to part the curtain of water.',
        conceptExplanation:
          'A two-sided limit $\\lim_{x \\to a} f(x)$ exists if and only if the left-hand limit and right-hand limit both exist and equal the exact same number.',
      },
      {
        id: 'boss_w2',
        name: 'The Limit Guardian',
        role: 'World 2 Guardian Boss',
        x: 24,
        y: 9,
        spriteType: 'boss_limit',
        isBoss: true,
        questId: 'w2_boss_quest',
        greeting:
          'I am the Limit Guardian of the River of Uncertainty. Demonstrate your mastery of indeterminate forms, one-sided limits, and continuity across 4 stages.',
        conceptExplanation:
          'Factor common variables or difference of squares when you see $\\frac{0}{0}$, and equate left and right limits to enforce continuity.',
      },
    ],
    interactiveObjects: [
      {
        id: 'obj_w2_stones',
        name: 'River Stepping Stones',
        type: 'bridge',
        x: 10,
        y: 9,
        questId: 'w2_quest_2',
        stateKey: 'bridge_repaired',
      },
      {
        id: 'obj_w2_portal',
        name: 'Portal to Derivative District',
        type: 'portal',
        x: 26,
        y: 9,
        targetWorld: 'world_3',
        requiresBoss: true,
      },
    ],
    quests: [
      {
        id: 'w2_quest_1',
        title: 'Quest 1: The First Limit',
        topic: 'Approaching a Value',
        description: 'Use Explorer Talen’s interactive number-line slider to observe how f(x) behaves as x approaches 2.',
        questionIds: ['w2_q1'],
        xpReward: 50,
        coinReward: 35,
      },
      {
        id: 'w2_quest_2',
        title: 'Quest 2: The Stepping Stone Challenge',
        topic: 'Direct Substitution & Factoring Limits',
        description: 'Evaluate limits for Stonekeeper Venn to raise the stepping stones across the river.',
        questionIds: ['w2_q2', 'w2_q3'],
        xpReward: 75,
        coinReward: 50,
        unlocksState: 'bridge_repaired',
        rewardItem: { id: 'river_rune', name: 'Glowing River Rune', icon: 'core_blue', type: 'fragment' },
      },
      {
        id: 'w2_quest_3',
        title: 'Quest 3: The Hidden Cave',
        topic: 'Indeterminate Forms (0/0)',
        description: 'Help Mystic Lyra complete the factorization proof inside the Hidden Cave.',
        questionIds: ['w2_q4'],
        xpReward: 65,
        coinReward: 45,
      },
      {
        id: 'w2_quest_4',
        title: 'Quest 4: Continuity Bridge',
        topic: 'Continuity at a Point',
        description: 'Verify the three conditions of continuity with Architect Soren to activate the Continuity Bridge.',
        questionIds: ['w2_q5', 'w2_q6'],
        xpReward: 85,
        coinReward: 55,
        unlocksState: 'w2_continuity_bridge',
      },
      {
        id: 'w2_quest_5',
        title: 'Quest 5: The Waterfall Gate',
        topic: 'One-Sided Limits',
        description: 'Evaluate left-hand and right-hand piecewise limits to open the Waterfall Gate.',
        questionIds: ['w2_q7'],
        xpReward: 70,
        coinReward: 45,
      },
      {
        id: 'w2_side_1',
        title: 'Side Quest: The Rationalization Shrine',
        topic: 'Conjugate & Radical Limits',
        isSideQuest: true,
        description: 'Resolve a square-root indeterminate limit at Hermit Caelum’s shrine.',
        questionIds: ['w2_q8'],
        xpReward: 60,
        coinReward: 45,
      },
      {
        id: 'w2_boss_quest',
        title: 'Boss Trial: The Limit Guardian',
        topic: 'Limits & Continuity Mastery',
        isBossQuest: true,
        bossName: 'The Limit Guardian',
        description: 'Calm the River of Uncertainty by solving the Limit Guardian’s 4-stage assessment.',
        questionIds: ['w2_boss_1', 'w2_boss_2', 'w2_boss_3', 'w2_boss_4'],
        xpReward: 180,
        coinReward: 120,
        unlocksState: 'boss_defeated',
      },
    ],
  },

  // ==========================================================================
  // WORLD 3: DERIVATIVE DISTRICT
  // ==========================================================================
  world_3: {
    id: 'world_3',
    order: 3,
    name: 'Derivative District',
    subtitle: 'Differentiation Rules & Tangent Gradients',
    themeColor: '#B87314',
    coreName: 'Derivative Knowledge Core',
    coreItem: { id: 'core_3', name: 'Derivative Knowledge Core', icon: 'core_amber', type: 'core' },
    cosmeticReward: 'goggles_derivative',
    cosmeticRewardName: 'Derivative Engineer Goggles',
    achievementReward: 'core_world_3',
    spawn: { x: 3, y: 9 },
    mapSize: { width: 28, height: 18 },
    storyIntro:
      'A brass-and-copper steampunk scientific city whose Central Derivative Reactor has stalled. Reactivate the Power, Product, Quotient, and Chain Rule machines.',
    palette: {
      ground: '#2B3440',
      groundAlt: '#222A35',
      path: '#B4692E',
      water: '#0F766E',
      wall: '#475569',
      roof: '#D97706',
      accent: '#F97316',
    },
    tiles: buildMapGrid(28, 18, (x, y) => {
      if (x === 16) {
        if (y === 8 || y === 9) return 5;
        return 2;
      }
      if ((x >= 4 && x <= 7 && y >= 2 && y <= 4) || (x >= 10 && x <= 14 && y >= 2 && y <= 4)) return 4;
      if (x >= 19 && x <= 23 && y >= 2 && y <= 4) return 4;
      if ((x >= 5 && x <= 8 && y === 13) || (x >= 11 && x <= 14 && y === 13)) return 7;
      if (y === 8 || y === 9) return 3;
      return 0;
    }),
    npcs: [
      {
        id: 'npc_watts_w3',
        name: 'Chief Engineer Watts',
        role: 'Power Rule Specialist',
        x: 5,
        y: 8,
        spriteType: 'engineer',
        questId: 'w3_quest_1',
        greeting:
          'Welcome to Derivative District. Our brass turbines run on instantaneous rates of change. Fire up the Power Rule Engine to start the primary gears.',
        conceptExplanation:
          'The Power Rule states that $\\frac{d}{dx}[x^n] = n x^{n-1}$. Constants have zero rate of change, so $\\frac{d}{dx}[c] = 0$.',
      },
      {
        id: 'npc_ada_w3',
        name: 'Mechanic Ada',
        role: 'Product Rule Engineer',
        x: 9,
        y: 8,
        spriteType: 'scientist',
        questId: 'w3_quest_2',
        greeting:
          'Two mechanical engines are multiplied together. Apply the Product Rule so both pistons fire in harmony.',
        conceptExplanation:
          'When two functions are multiplied, $\\frac{d}{dx}[u \\cdot v] = u\'v + uv\'$. Never just multiply $u\' \\cdot v\'$.',
      },
      {
        id: 'npc_boyle_w3',
        name: 'Pressure Tech Boyle',
        role: 'Quotient Control Officer',
        x: 12,
        y: 5,
        spriteType: 'engineer',
        questId: 'w3_quest_3',
        greeting:
          'The ratio valve pressure is fluctuating. Apply the Quotient Rule carefully to stabilize $\\frac{u(x)}{v(x)}$.',
        conceptExplanation:
          'For a quotient $\\frac{u}{v}$, the derivative is $\\frac{v u\' - u v\'}{v^2}$ (denominator times derivative of numerator, minus numerator times derivative of denominator, all over the denominator squared).',
      },
      {
        id: 'npc_newtonia_w3',
        name: 'Dr. Newtonia',
        role: 'Chain Rule Reactor Lead',
        x: 14,
        y: 9,
        spriteType: 'scientist',
        questId: 'w3_quest_4',
        greeting:
          'The Central Reactor uses nested composite energy shells. Differentiate the outer shell and multiply by the derivative of the inner core.',
        conceptExplanation:
          'By the Chain Rule, $\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)$. Always multiply by the derivative of the inside expression.',
      },
      {
        id: 'npc_fermat_w3',
        name: 'Inspector Fermat',
        role: 'Side Quest: Optimization Specialist',
        x: 8,
        y: 13,
        spriteType: 'professor_pi',
        questId: 'w3_side_1',
        greeting:
          'Optional Engineering Task: want to tune our steam valve to peak efficiency? Find the stationary point where the derivative equals zero.',
        conceptExplanation:
          'At a smooth local maximum or minimum, the tangent line is horizontal, meaning the derivative $f\'(x) = 0$.',
      },
      {
        id: 'npc_leibniz_w3',
        name: 'Conductor Leibniz',
        role: 'Tangent Rail Master',
        x: 19,
        y: 8,
        spriteType: 'explorer',
        questId: 'w3_quest_5',
        greeting:
          'The Tangent Rail train is ready. Calculate the exact gradient of the tangent line at $x = 2$ to power the track to the Automaton Foundry.',
        conceptExplanation:
          'The derivative $f\'(a)$ gives the exact slope (gradient) of the tangent line to the curve $y = f(x)$ at $x = a$.',
      },
      {
        id: 'boss_w3',
        name: 'The Derivative Automaton',
        role: 'World 3 Guardian Boss',
        x: 24,
        y: 9,
        spriteType: 'boss_derivative',
        isBoss: true,
        questId: 'w3_boss_quest',
        greeting:
          'Initiating 5-Stage Calculus Protocol: Power Rule, Product Rule, Quotient Rule, Chain Rule, and Mixed Differentiation.',
        conceptExplanation:
          'Identify the structure of each expression before differentiating: is it a sum of powers, a product $u \\cdot v$, a quotient $u/v$, or a composite function $f(g(x))$?',
      },
    ],
    interactiveObjects: [
      {
        id: 'obj_w3_reactor',
        name: 'Central Derivative Reactor',
        type: 'machine',
        x: 15,
        y: 9,
        questId: 'w3_quest_4',
        stateKey: 'bridge_repaired',
      },
      {
        id: 'obj_w3_portal',
        name: 'Portal to Integral Isles',
        type: 'portal',
        x: 26,
        y: 9,
        targetWorld: 'world_4',
        requiresBoss: true,
      },
    ],
    quests: [
      {
        id: 'w3_quest_1',
        title: 'Quest 1: The Power Rule Engine',
        topic: 'Power & Sum Rules',
        description: 'Differentiate Chief Engineer Watts’s generator polynomial to start the brass gears.',
        questionIds: ['w3_q1'],
        xpReward: 65,
        coinReward: 45,
        unlocksState: 'w3_gears_spinning',
      },
      {
        id: 'w3_quest_2',
        title: 'Quest 2: The Product Rule Machine',
        topic: 'Product Rule',
        description: 'Synchronize Mechanic Ada’s dual turbines using the Product Rule.',
        questionIds: ['w3_q2'],
        xpReward: 75,
        coinReward: 50,
      },
      {
        id: 'w3_quest_3',
        title: 'Quest 3: The Quotient Control Room',
        topic: 'Quotient Rule',
        description: 'Stabilize the steam pressure ratio for Pressure Tech Boyle.',
        questionIds: ['w3_q3'],
        xpReward: 80,
        coinReward: 55,
      },
      {
        id: 'w3_quest_4',
        title: 'Quest 4: Chain Rule Rescue',
        topic: 'Chain Rule & Composite Functions',
        description: 'Apply the Chain Rule with Dr. Newtonia to reactivate the Central Reactor and extend the Tangent Rail Bridge.',
        questionIds: ['w3_q4'],
        xpReward: 95,
        coinReward: 65,
        unlocksState: 'bridge_repaired',
        rewardItem: { id: 'reactor_coil', name: 'Charged Differential Coil', icon: 'core_amber', type: 'quest' },
      },
      {
        id: 'w3_quest_5',
        title: 'Quest 5: The Tangent Rail',
        topic: 'Tangent Gradients',
        description: 'Determine the tangent gradient on Conductor Leibniz’s graph to activate the mechanical train.',
        questionIds: ['w3_q5'],
        xpReward: 80,
        coinReward: 55,
      },
      {
        id: 'w3_side_1',
        title: 'Side Quest: The Optimization Valve',
        topic: 'Stationary Points',
        isSideQuest: true,
        description: 'Find the maximum steam output point where the derivative equals zero.',
        questionIds: ['w3_q6'],
        xpReward: 65,
        coinReward: 45,
      },
      {
        id: 'w3_boss_quest',
        title: 'Boss Trial: The Derivative Automaton',
        topic: 'Complete Differentiation Mastery',
        isBossQuest: true,
        bossName: 'The Derivative Automaton',
        description: 'Shut down all 5 armor stages of the Derivative Automaton to restore the Derivative Knowledge Core.',
        questionIds: ['w3_boss_1', 'w3_boss_2', 'w3_boss_3', 'w3_boss_4', 'w3_boss_5'],
        xpReward: 220,
        coinReward: 150,
        unlocksState: 'boss_defeated',
      },
    ],
  },

  // ==========================================================================
  // WORLD 4: INTEGRAL ISLES
  // ==========================================================================
  world_4: {
    id: 'world_4',
    order: 4,
    name: 'Integral Isles',
    subtitle: 'Antiderivatives, Definite Integrals & Substitution',
    themeColor: '#5B3E85',
    coreName: 'Integral Knowledge Core',
    coreItem: { id: 'core_4', name: 'Integral Knowledge Core', icon: 'core_violet', type: 'core' },
    cosmeticReward: 'cape_integral',
    cosmeticRewardName: 'Integral Mage Cape',
    achievementReward: 'core_world_4',
    spawn: { x: 3, y: 9 },
    mapSize: { width: 28, height: 18 },
    storyIntro:
      'Floating islands drifting among clouds. Collect Aether fragments and solve integration challenges to weave the Sky Bridges back together.',
    palette: {
      ground: '#6D59B5',
      groundAlt: '#5B48A2',
      path: '#C084FC',
      water: '#1E1B4B',
      wall: '#4C1D95',
      roof: '#38BDF8',
      accent: '#F0ABFC',
    },
    tiles: buildMapGrid(28, 18, (x, y) => {
      if (x === 15 || x === 16) {
        if (y === 8 || y === 9) return 5;
        return 2;
      }
      if (x >= 8 && x <= 12 && y >= 2 && y <= 4) return 4;
      if (x >= 5 && x <= 11 && y === 14) return 7;
      if (y === 8 || y === 9) return 3;
      return 0;
    }),
    npcs: [
      {
        id: 'npc_celeste_w4',
        name: 'Aether Collector Celeste',
        role: 'Keeper of Antiderivatives',
        x: 5,
        y: 8,
        spriteType: 'explorer',
        questId: 'w4_quest_1',
        greeting:
          'Welcome to the Integral Isles. Where differentiation breaks change into instants, integration accumulates instants back into wholes. Help me collect Aether energy.',
        conceptExplanation:
          'To integrate $x^n$, reverse the Power Rule: add $1$ to the exponent and divide by the new exponent ($\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$). Always include $+ C$ for indefinite integrals.',
      },
      {
        id: 'npc_riemann_w4',
        name: 'Temple Keeper Riemann',
        role: 'Curator of the Integration Temple',
        x: 10,
        y: 5,
        spriteType: 'professor_pi',
        questId: 'w4_quest_2',
        greeting:
          'The Ancient Integration Temple has three locked stone doors. Match each integral to its true antiderivative family to awaken the temple runes.',
        conceptExplanation:
          'You can always check an antiderivative $F(x) + C$ by differentiating it: its derivative $F\'(x)$ must match the integrand $f(x)$.',
      },
      {
        id: 'npc_darboux_w4',
        name: 'Botanist Darboux',
        role: 'Tender of the Area Garden',
        x: 8,
        y: 13,
        spriteType: 'villager',
        questId: 'w4_quest_3',
        greeting:
          'Behold the Area Garden. Compute the definite integral $\\int_0^3 (2x+1) dx$ to fill the terrace between the curve and the $x$-axis with light.',
        conceptExplanation:
          'By the Fundamental Theorem of Calculus, $\\int_a^b f(x) dx = F(b) - F(a)$, where $F\'(x) = f(x)$.',
      },
      {
        id: 'npc_euler_w4',
        name: 'Portal Weaver Euler',
        role: 'Master of Substitution',
        x: 12,
        y: 8,
        spriteType: 'scientist',
        questId: 'w4_quest_4',
        greeting:
          'This arcane portal reverses the Chain Rule. Order the $u$-substitution steps to calibrate the portal frequency.',
        conceptExplanation:
          'In $u$-substitution, look for an inner function $u = g(x)$ whose derivative $du = g\'(x)dx$ appears as a factor in the integrand.',
      },
      {
        id: 'npc_aria_w4',
        name: 'Sky Architect Aria',
        role: 'Weaver of Sky Bridges',
        x: 14,
        y: 9,
        spriteType: 'engineer',
        questId: 'w4_quest_5',
        greeting:
          'The chasm between the islands is wide. Solve this definite integral to weave the Sky Bridge across to the Sanctuary.',
        conceptExplanation:
          'Always evaluate $F(b) - F(a)$ at both the upper bound $b$ and the lower bound $a$. Never assume $F(a)$ is zero when $a \\neq 0$.',
      },
      {
        id: 'npc_fountain_w4',
        name: 'Mystic Simpson',
        role: 'Side Quest: Signed Area Sage',
        x: 20,
        y: 13,
        spriteType: 'villager',
        questId: 'w4_side_1',
        greeting:
          'Optional Island Puzzle: what happens when a symmetric odd curve dips below the $x$-axis on $[-2, 2]$? Test your understanding of signed net area.',
        conceptExplanation:
          'A definite integral computes signed net area: area above the $x$-axis is positive, while area below the $x$-axis is counted as negative.',
      },
      {
        id: 'boss_w4',
        name: 'The Integral Keeper',
        role: 'World 4 Guardian Boss',
        x: 24,
        y: 9,
        spriteType: 'boss_integral',
        isBoss: true,
        questId: 'w4_boss_quest',
        greeting:
          'I am the Integral Keeper. Harmonize indefinite integrals, definite bounds, and substitution across 4 stages to restore the Integral Knowledge Core.',
        conceptExplanation:
          'Check whether an integral is indefinite (requires $+ C$) or definite (produces a number $F(b) - F(a)$), and watch differential factors during $u$-substitution.',
      },
    ],
    interactiveObjects: [
      {
        id: 'obj_w4_bridge',
        name: 'Luminous Sky Bridge',
        type: 'bridge',
        x: 15,
        y: 9,
        questId: 'w4_quest_5',
        stateKey: 'bridge_repaired',
      },
      {
        id: 'obj_w4_portal',
        name: 'Portal to Mastery Mountain',
        type: 'portal',
        x: 26,
        y: 9,
        targetWorld: 'world_5',
        requiresBoss: true,
      },
    ],
    quests: [
      {
        id: 'w4_quest_1',
        title: 'Quest 1: The Energy Collector',
        topic: 'Indefinite Integration',
        description: 'Find the antiderivative family (including + C) to collect Aether energy with Celeste.',
        questionIds: ['w4_q1'],
        xpReward: 75,
        coinReward: 50,
      },
      {
        id: 'w4_quest_2',
        title: 'Quest 2: The Ancient Integration Temple',
        topic: 'Basic Integration Rules',
        description: 'Match integrals to antiderivatives with Temple Keeper Riemann to open the stone doors.',
        questionIds: ['w4_q2'],
        xpReward: 80,
        coinReward: 55,
      },
      {
        id: 'w4_quest_3',
        title: 'Quest 3: The Area Garden',
        topic: 'Definite Integrals & Area',
        description: 'Calculate the definite integral under the curve to fill the Area Garden with light.',
        questionIds: ['w4_q3'],
        xpReward: 85,
        coinReward: 60,
      },
      {
        id: 'w4_quest_4',
        title: 'Quest 4: The Substitution Portal',
        topic: 'Integration by Substitution',
        description: 'Order the u-substitution steps with Portal Weaver Euler to activate the island portal.',
        questionIds: ['w4_q4'],
        xpReward: 90,
        coinReward: 65,
      },
      {
        id: 'w4_quest_5',
        title: 'Quest 5: Restore the Sky Bridges',
        topic: 'Definite Integration Bounds',
        description: 'Evaluate the definite integral with Sky Architect Aria to materialize the Sky Bridge.',
        questionIds: ['w4_q5'],
        xpReward: 100,
        coinReward: 70,
        unlocksState: 'bridge_repaired',
        rewardItem: { id: 'aether_prism', name: 'Harmonic Aether Prism', icon: 'core_violet', type: 'quest' },
      },
      {
        id: 'w4_side_1',
        title: 'Side Quest: The Accumulation Fountain',
        topic: 'Signed Net Area & Symmetry',
        isSideQuest: true,
        description: 'Evaluate a symmetric odd definite integral on [-2, 2] with Mystic Simpson.',
        questionIds: ['w4_q6'],
        xpReward: 70,
        coinReward: 50,
      },
      {
        id: 'w4_boss_quest',
        title: 'Boss Trial: The Integral Keeper',
        topic: 'Complete Integration Mastery',
        isBossQuest: true,
        bossName: 'The Integral Keeper',
        description: 'Complete the Integral Keeper’s 4 crystal stages to restore the Integral Knowledge Core and unlock Mastery Mountain.',
        questionIds: ['w4_boss_1', 'w4_boss_2', 'w4_boss_3', 'w4_boss_4'],
        xpReward: 240,
        coinReward: 160,
        unlocksState: 'boss_defeated',
      },
    ],
  },

  // ==========================================================================
  // WORLD 5: MASTERY MOUNTAIN
  // ==========================================================================
  world_5: {
    id: 'world_5',
    order: 5,
    name: 'Mastery Mountain',
    subtitle: 'Integrated Calculus Synthesis & Applications',
    themeColor: '#6E4726',
    coreName: 'Sovereign Mastery Core',
    coreItem: { id: 'core_5', name: 'Sovereign Mastery Core', icon: 'crown', type: 'core' },
    cosmeticReward: 'crown_master',
    cosmeticRewardName: 'Calculus Master Crown',
    achievementReward: 'core_world_5',
    spawn: { x: 3, y: 9 },
    mapSize: { width: 28, height: 18 },
    storyIntro:
      'An atmospheric mountain peak crowned by an ancient stone citadel. Spot mathematical errors in the Forgotten Library, activate the Crystal Cave, and face the Calculus Guardian.',
    palette: {
      ground: '#334155',
      groundAlt: '#1E293B',
      path: '#94A3B8',
      water: '#0F172A',
      wall: '#475569',
      roof: '#F59E0B',
      accent: '#FDE047',
    },
    tiles: buildMapGrid(28, 18, (x, y) => {
      if (x === 16) {
        if (y === 8 || y === 9) return 5;
        return 2;
      }
      if ((x >= 6 && x <= 11 && y >= 2 && y <= 4) || (x >= 19 && x <= 25 && y >= 2 && y <= 5)) return 4;
      if (x >= 7 && x <= 13 && y === 14) return 7;
      if (y === 8 || y === 9) return 3;
      return 0;
    }),
    npcs: [
      {
        id: 'npc_warden_w5',
        name: 'Trail Warden Peak',
        role: 'Keeper of the Knowledge Trail',
        x: 5,
        y: 8,
        spriteType: 'explorer',
        questId: 'w5_quest_1',
        greeting:
          'You have restored four Knowledge Cores and reached Mastery Mountain. Begin the ascent by connecting limits to derivatives on the Knowledge Trail.',
        conceptExplanation:
          'The derivative $f\'(a)$ is defined as the limit of the difference quotient: $f\'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}$.',
      },
      {
        id: 'npc_noether_w5',
        name: 'Archivist Noether',
        role: 'Curator of the Forgotten Library',
        x: 9,
        y: 5,
        spriteType: 'scientist',
        questId: 'w5_quest_2',
        greeting:
          'In the Forgotten Library, corrupted manuscripts contain subtle Calculus mistakes. Spot the exact errors in these worked proofs to restore the archive.',
        conceptExplanation:
          'True mastery means not only executing rules, but diagnosing why a step fails, such as forgetting the inner derivative in the Chain Rule or differentiating factors separately.',
      },
      {
        id: 'npc_cauchy_w5',
        name: 'Crystal Sage Cauchy',
        role: 'Guardian of the Crystal Cave',
        x: 11,
        y: 13,
        spriteType: 'professor_pi',
        questId: 'w5_quest_3',
        greeting:
          'These four resonance crystals link derivatives and antiderivatives. Recover the original function $f(x)$ from its gradient $f\'(x)$ and a known point.',
        conceptExplanation:
          'Integrating $f\'(x)$ gives $f(x) + C$. Substituting a known point $(x_0, y_0)$ lets you solve for the exact constant $C$.',
      },
      {
        id: 'npc_lagrange_w5',
        name: 'Commander Lagrange',
        role: 'Warden of the Mountain Gate',
        x: 14,
        y: 9,
        spriteType: 'engineer',
        questId: 'w5_quest_4',
        greeting:
          'Before you stands the Summit Gate. Solve this multi-step kinematics optimization puzzle to lower the drawbridge into the Citadel.',
        conceptExplanation:
          'Position $s(t)$ differentiated gives velocity $v(t) = s\'(t)$. Maximum height occurs when $v(t) = 0$; substitute that time $t$ back into $s(t)$ to find the height.',
      },
      {
        id: 'boss_w5',
        name: 'The Calculus Guardian',
        role: 'Final Sovereign Boss',
        x: 23,
        y: 9,
        spriteType: 'boss_final',
        isBoss: true,
        questId: 'w5_boss_quest',
        greeting:
          'Welcome to the Summit Citadel, Explorer. Face the 5-stage Grand Trial of Algebra, Limits, Differentiation, Integration, and the Fundamental Theorem of Calculus.',
        conceptExplanation:
          'All five branches of the Calculus Realm are united: functions describe relationships, limits describe approach, derivatives measure instantaneous change, and integrals accumulate change.',
      },
    ],
    interactiveObjects: [
      {
        id: 'obj_w5_gate',
        name: 'Summit Citadel Drawbridge',
        type: 'bridge',
        x: 15,
        y: 9,
        questId: 'w5_quest_4',
        stateKey: 'bridge_repaired',
      },
      {
        id: 'obj_w5_portal',
        name: 'Return Portal to Foundation Village',
        type: 'portal',
        x: 26,
        y: 9,
        targetWorld: 'world_1',
        requiresBoss: false,
      },
    ],
    quests: [
      {
        id: 'w5_quest_1',
        title: 'Quest 1: The Knowledge Trail',
        topic: 'First Principles & Limits',
        description: 'Evaluate the difference-quotient limit with Trail Warden Peak to clear the mountain path.',
        questionIds: ['w5_q1'],
        xpReward: 90,
        coinReward: 60,
      },
      {
        id: 'w5_quest_2',
        title: 'Quest 2: The Forgotten Library',
        topic: 'Mathematical Error Detection',
        description: 'Identify the flawed steps in worked Chain Rule and Product Rule manuscripts with Archivist Noether.',
        questionIds: ['w5_q2', 'w5_q3'],
        xpReward: 110,
        coinReward: 75,
      },
      {
        id: 'w5_quest_3',
        title: 'Quest 3: The Crystal Cave',
        topic: 'Initial Value & Antiderivative Recovery',
        description: 'Recover f(x) from f\'(x) and a boundary condition to activate the Crystal Cave network.',
        questionIds: ['w5_q4'],
        xpReward: 110,
        coinReward: 75,
      },
      {
        id: 'w5_quest_4',
        title: 'Quest 4: The Mountain Gate',
        topic: 'Multi-Step Optimization & Kinematics',
        description: 'Complete Commander Lagrange’s multi-step maximum height puzzle to open the Summit Gate.',
        questionIds: ['w5_q5'],
        xpReward: 125,
        coinReward: 85,
        unlocksState: 'bridge_repaired',
        rewardItem: { id: 'summit_crest', name: 'Golden Summit Crest', icon: 'crown', type: 'quest' },
      },
      {
        id: 'w5_boss_quest',
        title: 'Final Trial: The Calculus Guardian',
        topic: 'Full Calculus Realm Synthesis',
        isBossQuest: true,
        bossName: 'The Calculus Guardian',
        description: 'Complete the 5-stage final encounter to restore the Sovereign Mastery Core and illuminate the entire Calculus Realm.',
        questionIds: ['w5_boss_1', 'w5_boss_2', 'w5_boss_3', 'w5_boss_4', 'w5_boss_5'],
        xpReward: 350,
        coinReward: 250,
        unlocksState: 'boss_defeated',
      },
    ],
  },
};

export const WORLD_LIST = [
  WORLDS_DATA.world_1,
  WORLDS_DATA.world_2,
  WORLDS_DATA.world_3,
  WORLDS_DATA.world_4,
  WORLDS_DATA.world_5,
];

export const MULTIPLAYER_MISSIONS = [
  {
    id: 'mission_derivative_reactor',
    title: 'Mission 1: Derivative Reactor Repair',
    worldTheme: 'Derivative District Co-op Lab',
    description:
      'Three cooperative engineering stations must synchronize to stabilize the nested reactor function $y = (2x^{2} + 3)^{3}$ at $x = 1$.',
    roles: {
      solver: {
        roleId: 'solver',
        title: 'Player A: Solver',
        badgeColor: '#B87314',
        stationLabel: 'Derivative Calculation Station',
        prompt: 'Calculate the numerical value of $\\frac{dy}{dx}$ for $y = (2x^{2} + 3)^{3}$ at $x = 1$.',
        question: {
          id: 'mp_m1_solver',
          question_type: 'numerical',
          prompt: 'Solver Task: for $y = (2x^{2} + 3)^{3}$, we have $\\frac{dy}{dx} = 12x(2x^{2} + 3)^{2}$. Evaluate $\\frac{dy}{dx}$ at $x = 1$.',
          answer_data: { correctValue: 300, tolerance: 0.01 },
          explanation: 'At $x = 1$, $\\frac{dy}{dx} = 12(1)(2(1)^{2} + 3)^{2} = 12(5)^{2} = 12 \\times 25 = 300$.',
          hint: 'Substitute $x = 1$ into $12x(2x^{2} + 3)^{2}$: $12(1)(5)^{2}$.',
        },
      },
      analyst: {
        roleId: 'analyst',
        title: 'Player B: Analyst',
        badgeColor: '#246A8E',
        stationLabel: 'Rule & Misconception Diagnostic Station',
        prompt: 'Identify the Differentiation Rule and diagnose why an engineer’s draft answer $3(2x^{2} + 3)^{2}$ failed.',
        question: {
          id: 'mp_m1_analyst',
          question_type: 'multiple_choice',
          prompt: 'Analyst Task: why is $\\frac{dy}{dx} = 3(2x^{2} + 3)^{2}$ an incorrect derivative for $y = (2x^{2} + 3)^{3}$?',
          answer_data: {
            options: [
              'It omits multiplying by the inner derivative $\\frac{d}{dx}(2x^{2} + 3) = 4x$ required by the Chain Rule.',
              'It should use the Quotient Rule instead of the Chain Rule.',
              'The outer exponent should remain $3$ instead of reducing to $2$.',
              'The constant $+3$ inside the bracket should become $0$ before cubing.',
            ],
            correctIndex: 0,
          },
          explanation: 'By the Chain Rule, we must multiply the outer derivative $3(2x^{2}+3)^{2}$ by the inner derivative $4x$.',
          hint: 'Compare $3(2x^{2}+3)^{2}$ with the full Chain Rule formula $f\'(g(x)) \\cdot g\'(x)$.',
        },
      },
      verifier: {
        roleId: 'verifier',
        title: 'Player C: Verifier',
        badgeColor: '#266B3E',
        stationLabel: 'Tangent Line & Output Verification Station',
        prompt: 'Verify the reactor’s baseline output $y(1)$ to confirm the tangent point $(1, y(1))$ is locked.',
        question: {
          id: 'mp_m1_verifier',
          question_type: 'numerical',
          prompt: 'Verifier Task: confirm the reactor’s baseline energy output $y(1)$ for $y = (2x^{2} + 3)^{3}$ when $x = 1$.',
          answer_data: { correctValue: 125, tolerance: 0.01 },
          explanation: 'At $x = 1$, $y(1) = (2(1)^{2} + 3)^{3} = 5^{3} = 125$.',
          hint: 'Compute $(2(1)^{2} + 3)^{3} = 5^{3}$.',
        },
      },
    },
    xpReward: 100,
    coinReward: 75,
  },
  {
    id: 'mission_bridge_harmony',
    title: 'Mission 2: Sky Bridge Integral Sync',
    worldTheme: 'Integral Isles Co-op Sanctuary',
    description:
      'Collaborate across three Aether stations to verify the definite integral $\\int_{0}^{2} (3x^{2} + 4x) dx$.',
    roles: {
      solver: {
        roleId: 'solver',
        title: 'Player A: Solver',
        badgeColor: '#B87314',
        stationLabel: 'Definite Integral Evaluator',
        prompt: 'Compute the exact numerical value of $\\int_{0}^{2} (3x^{2} + 4x) dx$.',
        question: {
          id: 'mp_m2_solver',
          question_type: 'numerical',
          prompt: 'Solver Task: evaluate $\\int_{0}^{2} (3x^{2} + 4x) dx$.',
          answer_data: { correctValue: 16, tolerance: 0.01 },
          explanation: '$[x^{3} + 2x^{2}]_{0}^{2} = (8 + 8) - 0 = 16$.',
          hint: 'Evaluate $[x^{3} + 2x^{2}]$ at $x = 2$.',
        },
      },
      analyst: {
        roleId: 'analyst',
        title: 'Player B: Analyst',
        badgeColor: '#246A8E',
        stationLabel: 'Antiderivative Structure Analyst',
        prompt: 'Identify the correct antiderivative $F(x)$ before bounds are applied.',
        question: {
          id: 'mp_m2_analyst',
          question_type: 'expression',
          prompt: 'Analyst Task: write the antiderivative $F(x)$ of $3x^{2} + 4x$ with $C = 0$ (such as `x^3 + 2x^2`).',
          answer_data: { correctExpression: 'x^3 + 2x^2', requireConstantC: false },
          explanation: 'Integrating $3x^{2} + 4x$ gives $\\frac{3x^{3}}{3} + \\frac{4x^{2}}{2} = x^{3} + 2x^{2}$.',
          hint: 'Integrate $3x^{2}$ and $4x$ using the reverse power rule.',
        },
      },
      verifier: {
        roleId: 'verifier',
        title: 'Player C: Verifier',
        badgeColor: '#266B3E',
        stationLabel: 'Fundamental Theorem Checker',
        prompt: 'Verify that $F\'(x)$ matches the integrand $f(x) = 3x^{2} + 4x$ at $x = 2$.',
        question: {
          id: 'mp_m2_verifier',
          question_type: 'numerical',
          prompt: 'Verifier Task: evaluate the rate of accumulation $f(2) = 3(2)^{2} + 4(2)$ at the upper bound $x = 2$.',
          answer_data: { correctValue: 20, tolerance: 0.01 },
          explanation: '$f(2) = 3(4) + 8 = 12 + 8 = 20$.',
          hint: 'Compute $3(2)^{2} + 4(2)$.',
        },
      },
    },
    xpReward: 110,
    coinReward: 80,
  },
];
