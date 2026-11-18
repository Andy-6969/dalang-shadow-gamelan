// DALANG: hands the game in for make.fun's best-game-01 bounty (Node 22, standard library only).
// Copies game/ and screenshots/ to the output directory and writes dossier.json with the kit's
// unchanged vendor/makefun-game.ts. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyFolder(name: string): void {
  const from = join(repoRoot, name);
  if (existsSync(from)) cpSync(from, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyFolder('game');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyFolder('screenshots');

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
