import { parseGrid, isSolved, bit } from './vendor/sudokui/engine/board';
import { findNextStep, applyStep } from './vendor/sudokui/engine/humanSolver';
import { TECHS, SOLVE_ORDER, maxLevel, bandFloor, Level } from './vendor/sudokui/engine/ratings';

// Keep the catalogue and solve path in sync with the techniques enabled here.
const ACTIVE_SOLVE_ORDER = SOLVE_ORDER.filter(tech => tech !== 'CHUTE_REMOTE_PAIR');

export function techniqueCatalog() {
  return ACTIVE_SOLVE_ORDER.map(key => ({ key, ...TECHS[key] }));
}

function betweenMasks(givens: number[]) {
  const masks = Array(81).fill(0x1ff);
  for (let n = 0; n < 9; n++) for (const line of [Array.from({length: 9}, (_, i) => n * 9 + i), Array.from({length: 9}, (_, i) => i * 9 + n)]) {
    let prior = -1;
    for (let pos = 0; pos < 9; pos++) if (givens[line[pos]]) {
      if (prior >= 0) {
        const lo = Math.min(givens[line[prior]], givens[line[pos]]), hi = Math.max(givens[line[prior]], givens[line[pos]]);
        let mask = 0; for (let d = lo + 1; d < hi; d++) mask |= bit(d);
        for (let p = prior + 1; p < pos; p++) masks[line[p]] &= mask;
      }
      prior = pos;
    }
  }
  return masks;
}
export function walkthrough(givens: number[], solution: number[]) {
  const g = parseGrid(givens.map(d => d || '.').join(''));
  if (!g) throw new Error('Invalid puzzle');
  const masks = betweenMasks(givens);
  for (let i = 0; i < 81; i++) if (!g.values[i]) g.cands[i] &= masks[i];
  const steps: any[] = [{ tech: 'BETWEEN_NOTATION', placements: [], eliminations: [], description: 'Snyder notation: add candidates to every blank cell, applying normal Sudoku and Between restrictions.' }];
  const candidateStates = [Array.from(g.cands)];
  const techniques: Record<string, number> = { BETWEEN_NOTATION: 1 };
  let score = 0, level: Level = 'Beginner', guard = 0;
  while (!isSolved(g) && guard++ < 400) {
    let step = findNextStep(g, ACTIVE_SOLVE_ORDER);
    if (!step) {
      const cell = Array.from(g.values).findIndex(v => !v);
      if (cell < 0) break;
      step = { tech: 'BRUTE_FORCE', placements: [{ cell, digit: solution[cell] }], eliminations: [], description: `No active logical technique applies. Set r${Math.floor(cell / 9) + 1}c${cell % 9 + 1} to ${solution[cell]}. This adds 10000 to the difficulty score.` };
    }
    const before = Array.from(g.cands);
    applyStep(g, step);
    const removedCandidates: { cell: number; digit: number }[] = [];
    for (let cell = 0; cell < 81; cell++) {
      if (g.values[cell]) continue;
      for (let digit = 1; digit <= 9; digit++) if ((before[cell] & bit(digit)) && !(g.cands[cell] & bit(digit))) removedCandidates.push({ cell, digit });
    }
    step.removedCandidates = removedCandidates;
    candidateStates.push(Array.from(g.cands));
    steps.push(step); techniques[step.tech] = (techniques[step.tech] || 0) + 1;
    const info = TECHS[step.tech];
    score += info.score; level = maxLevel(level, bandFloor(info.level));
  }
  return { steps, candidateStates, techniques, score, level, solvable: !Object.hasOwn(techniques, 'BRUTE_FORCE') };
}
