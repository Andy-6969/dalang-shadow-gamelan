// Tembang: the songs the dalang learns between nights. Each one changes how the hero fights.

export function baseMods() {
  return {
    damage: 1,
    slashRange: 1,
    slashArc: 1,
    twinStrike: 0,
    beatWindow: 0,
    gongGain: 1,
    gongEcho: 0,
    dashDamage: 0,
    dashCooldown: 1,
    sparks: 0,
    lifesteal: 0,
    shield: 0,
    oilRegen: 0,
    knockback: 1,
    speed: 1,
  };
}

export const TEMBANG = [
  { id: 'keris', name: 'SHARP KERIS', icon: 'K', color: '#e85a3a', text: '+30% slash damage', apply: (m) => { m.damage += 0.3; } },
  { id: 'sabet', name: 'WIDE SABET', icon: 'W', color: '#f2b437', text: 'slash arc and reach +25%', apply: (m) => { m.slashArc += 0.25; m.slashRange += 0.25; } },
  { id: 'twin', name: 'TWIN KERIS', icon: 'II', color: '#e85a3a', text: 'on-beat slashes strike twice', apply: (m) => { m.twinStrike += 1; } },
  { id: 'kendang', name: 'KENDANG STEP', icon: 'D', color: '#2f8f87', text: 'dash hits foes in its path', apply: (m) => { m.dashDamage += 18; m.dashCooldown *= 0.85; } },
  { id: 'echo', name: 'GONG ECHO', icon: 'G', color: '#9a6bd8', text: 'gong blast rings a second time', apply: (m) => { m.gongEcho += 1; } },
  { id: 'saron', name: 'SARON SPARKS', icon: 'S', color: '#ffd23f', text: 'on-beat kills spark to 2 foes', apply: (m) => { m.sparks += 2; } },
  { id: 'irama', name: 'SLOW IRAMA', icon: 'I', color: '#7fd36a', text: 'the beat window widens 30%', apply: (m) => { m.beatWindow += 0.035; } },
  { id: 'rebab', name: 'REBAB LAMENT', icon: 'R', color: '#c8322a', text: 'on-beat hits heal 2', apply: (m) => { m.lifesteal += 2; } },
  { id: 'kayon', name: 'KAYON WARD', icon: 'Y', color: '#4f7a2c', text: 'block one hit each night', apply: (m) => { m.shield += 1; } },
  { id: 'minyak', name: 'COCONUT OIL', icon: 'O', color: '#ffb84a', text: 'the lamp refills 1 oil/s', apply: (m) => { m.oilRegen += 1; } },
  { id: 'suling', name: 'SULING GUST', icon: 'U', color: '#9fd3c9', text: 'knockback +60%, gong fills faster', apply: (m) => { m.knockback += 0.6; m.gongGain += 0.4; } },
  { id: 'kijang', name: 'KIJANG FEET', icon: 'F', color: '#f3dfb4', text: 'move speed +15%', apply: (m) => { m.speed += 0.15; } },
];

export function draftChoices(rng, owned) {
  const counts = {};
  for (const id of owned) counts[id] = (counts[id] || 0) + 1;
  const pool = TEMBANG.filter((t) => (counts[t.id] || 0) < 3);
  const picks = [];
  while (picks.length < 3 && pool.length) {
    const i = Math.floor(rng.next() * pool.length);
    picks.push(pool.splice(i, 1)[0]);
  }
  return picks;
}

export function tembangById(id) {
  return TEMBANG.find((t) => t.id === id);
}

// The two roads after a night: a wild clown-interlude or a calm rest.
export const ROADS = [
  { id: 'garagara', name: 'GARA-GARA', key: 'Q', color: '#e85a3a', text: 'wilder night: +40% foes, +50% score, a bonus tembang' },
  { id: 'limbukan', name: 'LIMBUKAN', key: 'E', color: '#2f8f87', text: 'gentle interlude: +35 health, +30 lamp oil' },
];
