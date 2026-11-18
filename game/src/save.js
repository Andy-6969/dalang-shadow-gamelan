// Best score and the last runs, kept in localStorage (quietly skipped when storage is blocked).

const KEY = 'dalang-save-v1';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { best: 0, runs: [], plays: 0, ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable */ }
  return { best: 0, runs: [], plays: 0 };
}

export function recordRun(save, run) {
  save.plays += 1;
  save.best = Math.max(save.best, run.score);
  save.runs = [{ score: run.score, grade: run.grade, won: run.victory, night: run.night, diff: run.diff }, ...save.runs].slice(0, 4);
  try { window.localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  return save;
}
