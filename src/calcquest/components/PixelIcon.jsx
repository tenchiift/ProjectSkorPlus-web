// ============================================================================
// SKOR+ CalcQuest: Custom 16x16 Pixel-Art SVG Icons
// Reason (R-04 / R-31): Replaces generic emojis and thin-stroke SaaS icons
// with crisp 16x16 pixel-grid glyphs that match the 2D RPG tileset.
// ============================================================================

const PIXEL_GLYPHS = {
  coin: [
    '.....BBBBBB.....',
    '...BBYYYYYYBB...',
    '..BYYFFFFFFYYB..',
    '.BYYFFBBBBFFYYB.',
    '.BYFFBB..BBFFYB.',
    'BYYFB..BB..BYYB.',
    'BYYFB..BB..BYYB.',
    'BYYFB..BB..BYYB.',
    'BYYFB..BB..BYYB.',
    '.BYFFBB..BBFFYB.',
    '.BYYFFBBBBFFYYB.',
    '..BYYOOOOOOYYB..',
    '...BBOOOOOOBB...',
    '.....BBBBBB.....',
  ],
  xp: [
    '.......BB.......',
    '......BYYB......',
    '.....BYYYYB.....',
    '....BYYYYYYB....',
    '..BBBYYYYYYBBB..',
    '.BYYYYYYYYYYYYB.',
    '..BYYYYYYYYYYB..',
    '...BYYYYYYYYB...',
    '....BYYYYYYB....',
    '...BYYBBBBYYB...',
    '..BYYB....BYYB..',
    '.BYYB......BYYB.',
    '..BB........BB..',
  ],
  core_green: [
    '.....BBBBBB.....',
    '...BBGGGGGGBB...',
    '..BGGFFFFFFGGB..',
    '.BGGFFGGGGFFGGB.',
    'BGGFFGGGGGGGGGB.',
    'BGGFGGGGGGGGGGGB',
    'BGGGGGGGGGGGGGGB',
    'BGGGGGGGGGGGGGGB',
    '.BGGGGGGGGGGGGB.',
    '..BGGGGGGGGGGB..',
    '...BBGGGGGGBB...',
    '.....BBBBBB.....',
  ],
  core_blue: [
    '.....BBBBBB.....',
    '...BBCCCCCCBB...',
    '..BCCFFFFFFCCB..',
    '.BCCFFCCCCFFCCB.',
    'BCCFFCCCCCCCCCB.',
    'BCCFCCCCCCCCCCCB',
    'BCCCCCCCCCCCCCCB',
    'BCCCCCCCCCCCCCCB',
    '.BCCCCCCCCCCCCB.',
    '..BCCCCCCCCCCB..',
    '...BBCCCCCCBB...',
    '.....BBBBBB.....',
  ],
  core_amber: [
    '.....BBBBBB.....',
    '...BBOOOOOOBB...',
    '..BOOFFFFFFOOB..',
    '.BOOFFOOOOFFOOB.',
    'BOOFFYYYYYYYYOB.',
    'BOOFYYYYYYYYYYOB',
    'BOOYYYYYYYYYYYOB',
    '.BOOYYYYYYYYYOB.',
    '..BBOOOOOOOOBB..',
    '....BBBBBBBB....',
  ],
  core_violet: [
    '.....BBBBBB.....',
    '...BBVVVVVVBB...',
    '..BVVFFFFFFVVB..',
    '.BVVFFVVVVFFVVB.',
    'BVVFFVVVVVVVVVB.',
    'BVVFVVVVVVVVVVVB',
    'BVVVVVVVVVVVVVVB',
    '.BVVVVVVVVVVVVB.',
    '..BBVVVVVVVVBB..',
    '....BBBBBBBB....',
  ],
  crown: [
    '.BB....BB....BB.',
    'BYYB..BYYB..BYYB',
    'BYYB.BYYYYB.BYYB',
    'BYYYBYYYYYYBYYYB',
    'BYYYYYYYYYYYYYYB',
    'BYYRRYYYYYYRRYYB',
    'BYYYYYYYYYYYYYYB',
    'BBOOOOOOOOOOOOBB',
    '.BBBBBBBBBBBBBB.',
  ],
  scroll: [
    '..BBBBBBBBBBBB..',
    '.BOOWWWWWWWWOOB.',
    '.BOWWWWWWWWWWWB.',
    '..BWWBBBBBBWWB..',
    '..BWWWWWWWWWWB..',
    '..BWWBBBBBBWWB..',
    '..BWWWWWWWWWWB..',
    '..BWWBBBBWWB....',
    '..BWWWWWWWWWWB..',
    '.BOOWWWWWWWWOOB.',
    '..BBBBBBBBBBBB..',
  ],
  compass: [
    '....BBBBBBBB....',
    '..BBOOOOOOOOBB..',
    '.BOWWWWWWWWWWO..',
    'BOWWWWWRRWWWWWO.',
    'BOWWWWRRRRWWWWO.',
    'BOWWWWBBBBWWWWO.',
    'BOWWWWCCCCWWWWO.',
    'BOWWWWWCCWWWWWO.',
    '.BOWWWWWWWWWWO..',
    '..BBOOOOOOOOBB..',
    '....BBBBBBBB....',
  ],
  bag: [
    '.....BBBBBB.....',
    '....BBOOOOBB....',
    '..BBBOOOOOOBBB..',
    '.BOOOOOOOOOOOOB.',
    'BOOOOBBBBBBOOOOB',
    'BOOOBYYYYYYBOOOB',
    'BOOOOOOOOOOOOOOB',
    'BOOOOOOOOOOOOOOB',
    '.BOOOOOOOOOOOOB.',
    '..BBBBBBBBBBBB..',
  ],
  shield: [
    '..BBBBBBBBBBBB..',
    '.BCCCCCCCCCCCCB.',
    'BCCWWWWWWWWWWCCB',
    'BCCWCCCCCCCCWCCB',
    'BCCWCCCCCCCCWCCB',
    '.BCCWCCCCCCWCCB.',
    '..BCCWCCCCWCCB..',
    '...BCCWCCWCCB...',
    '....BCCCCCCB....',
    '.....BBBBBB.....',
  ],
  lock: [
    '.....BBBBBB.....',
    '....BB....BB....',
    '....B......B....',
    '..BBBBBBBBBBBB..',
    '.BYYYYYYYYYYYYB.',
    '.BYYYYBBBBYYYYB.',
    '.BYYYYB..BYYYYB.',
    '.BYYYYBBBBYYYYB.',
    '..BBBBBBBBBBBB..',
  ],
  check: [
    '...........BBB..',
    '..........BGGGB.',
    '.........BGGGGB.',
    '..BBB...BGGGGGB.',
    '.BGGGB.BGGGGGB..',
    '.BGGGGBGGGGGB...',
    '..BGGGGGGGGB....',
    '...BGGGGGGGB....',
    '....BGGGGGB.....',
    '.....BBBBB......',
  ],
  sound_on: [
    '......BBB.......',
    '....BBYYB..BB...',
    '..BBBYYYB.B..B..',
    '.BYYYYYYB....B..',
    '.BYYYYYYB.B..B..',
    '..BBBYYYB..BB...',
    '....BBYYB.......',
    '......BBB.......',
  ],
  sound_off: [
    '......BBB.......',
    '....BBYYB.R...R.',
    '..BBBYYYB..R.R..',
    '.BYYYYYYB...R...',
    '.BYYYYYYB..R.R..',
    '..BBBYYYB.R...R.',
    '....BBYYB.......',
    '......BBB.......',
  ],
  pause: [
    '..BBBB....BBBB..',
    '..BYYB....BYYB..',
    '..BYYB....BYYB..',
    '..BYYB....BYYB..',
    '..BYYB....BYYB..',
    '..BYYB....BYYB..',
    '..BYYB....BYYB..',
    '..BBBB....BBBB..',
  ],
  home: [
    '.......BB.......',
    '.....BBOOBB.....',
    '...BBOOOOOOBB...',
    '.BBOOOOOOOOOOBB.',
    '..BWWWWWWWWWWB..',
    '..BWWBBBBBBWWB..',
    '..BWWBYYYYBWWB..',
    '..BWWBYYYYBWWB..',
    '..BBBBBBBBBBBB..',
  ],
};

const COLOR_KEY = {
  B: '#231A12',
  Y: '#F5B82E',
  O: '#B87314',
  F: '#FFF7D6',
  G: '#2E8B57',
  C: '#2B72B8',
  V: '#7A49B8',
  R: '#C83E31',
  W: '#F7F1E3',
};

export default function PixelIcon({ name = 'coin', size = 18, className = '' }) {
  const rows = PIXEL_GLYPHS[name] || PIXEL_GLYPHS.coin;
  const height = rows.length;
  const width = rows[0]?.length || 16;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        shapeRendering: 'crispEdges',
        flexShrink: 0,
      }}
    >
      {rows.map((row, y) =>
        Array.from(row).map((ch, x) => {
          const fill = COLOR_KEY[ch];
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}
