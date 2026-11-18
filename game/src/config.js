// Tuning, palette and the seven nights of the lakon (the shadow play's story).

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const LAMP_X = 640;
export const LAMP_Y = 420;

export const PALETTE = {
  ink: '#1a0d08',
  inkSoft: '#2b1610',
  screen: '#f3dfb4',
  screenWarm: '#ffd98a',
  gold: '#f2b437',
  goldDeep: '#b9761b',
  red: '#c8322a',
  redDeep: '#7c1a16',
  teal: '#2f8f87',
  tealDeep: '#1d5652',
  indigo: '#2a2f6b',
  cream: '#fff4dc',
  leaf: '#4f7a2c',
  panel: 'rgba(26, 13, 8, 0.86)',
  panelEdge: '#c99a3a',
  good: '#7fd36a',
  bad: '#ff5a46',
  beat: '#ffe08a',
};

export const DIFFICULTIES = [
  { id: 'alus', name: 'ALUS', blurb: 'gentle: wide beat, slow foes', key: '1', enemyHp: 0.8, enemySpeed: 0.85, beatWindow: 0.15, scoreMul: 0.8 },
  { id: 'gagah', name: 'GAGAH', blurb: 'the true performance', key: '2', enemyHp: 1, enemySpeed: 1, beatWindow: 0.12, scoreMul: 1 },
  { id: 'kasar', name: 'KASAR', blurb: 'brutal: tight beat, fierce foes', key: '3', enemyHp: 1.3, enemySpeed: 1.15, beatWindow: 0.095, scoreMul: 1.6 },
];

// Each night: its name, gamelan tempo, the verses of foes it sends and, on 4 and 7, a boss.
export const NIGHTS = [
  { title: 'Jejer: the court gathers', bpm: 84, verses: [['buto', 6], ['lelawa', 4], ['buto', 8]] },
  { title: 'Budhalan: the march out', bpm: 90, verses: [['buto', 8], ['lelawa', 6], ['banaspati', 2], ['buto', 6]] },
  { title: 'Perang Gagal: the failed war', bpm: 96, verses: [['lelawa', 8], ['banaspati', 3], ['wewe', 3], ['buto', 10]] },
  { title: 'The Iron Ogre wakes', bpm: 100, verses: [['buto', 6], ['banaspati', 2]], boss: 'ironOgre' },
  { title: 'Gara-gara: the world shakes', bpm: 106, verses: [['wewe', 5], ['gendruwo', 2], ['lelawa', 10], ['banaspati', 4]] },
  { title: 'Perang Kembang: the flower war', bpm: 112, verses: [['gendruwo', 3], ['buto', 12], ['wewe', 6], ['banaspati', 5]] },
  { title: 'Tancep Kayon: the Moon-Eater', bpm: 118, verses: [['lelawa', 6], ['wewe', 4]], boss: 'moonEater' },
];

export const PLAYER = {
  maxHp: 120,
  speed: 270,
  slashCooldown: 0.3,
  slashRange: 104,
  slashArc: Math.PI * 0.62,
  slashDamage: 12,
  dashCooldown: 0.85,
  dashDistance: 190,
  dashTime: 0.16,
  gongCost: 100,
  gongRadius: 230,
  gongDamage: 38,
};

export const LAMP = { maxOil: 100, radius: 46 };

// Irama, the gamelan's tempo layer, doubles as the combo: on-beat actions climb it.
export const IRAMA_STEPS = [0, 4, 9, 15, 23];
export const IRAMA_NAMES = ['LANCAR', 'TANGGUNG', 'DADI', 'WILET', 'RANGKEP'];
