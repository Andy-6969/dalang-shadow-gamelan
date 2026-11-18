// Night goals: three side objectives per night. Each finished goal pays a bonus at dawn and
// shows on the HUD checklist, so every night asks for more than just survival.

import { BOSS_KINDS } from './bosses.js';

export function makeNightGoals(nightIndex, night, queueLength) {
  const cut = Math.max(6, Math.round(queueLength * 0.7));
  const beats = 10 + nightIndex * 3;
  const goals = [
    { id: 'cut', text: `Cut down ${cut} foes`, target: cut, value: (g) => g.nightKills, bonus: 1500 },
    { id: 'beat', text: `Land ${beats} ON BEAT hits`, target: beats, value: (g) => g.nightBeats, bonus: 2000 },
  ];
  if (night.boss) {
    const def = BOSS_KINDS[night.boss];
    goals.push({ id: 'boss', text: `Break all 3 phases of ${def.short}`, target: 3, value: (g) => g.bossPhasesBroken(), bonus: 4000 });
  } else {
    goals.push({ id: 'lamp', text: 'Keep the lamp above 50 oil', target: 1, value: (g) => (g.nightLowestOil > 50 ? 1 : 0), bonus: 2500, holds: true });
  }
  return goals.map((goal) => ({ ...goal, done: false }));
}

// Called every frame: marks goals as they complete and announces them once.
export function updateNightGoals(game) {
  for (const goal of game.goals) {
    if (goal.done || goal.holds) continue;
    if (goal.value(game) >= goal.target) {
      goal.done = true;
      game.effects.callout('GOAL!', '#7fd36a', goal.text);
      game.audio.sfx('pick');
    }
  }
}

// At dawn: goals that hold all night (the lamp) are judged, and every finished goal pays.
export function settleNightGoals(game) {
  let bonus = 0;
  for (const goal of game.goals) {
    if (goal.holds) goal.done = goal.value(game) >= goal.target;
    if (goal.done) bonus += Math.round(goal.bonus * game.diff.scoreMul * (game.nightIndex + 1) * 0.5);
  }
  game.stats.goalsDone += game.goals.filter((goal) => goal.done).length;
  return bonus;
}
