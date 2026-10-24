'use strict';
const assert = require('node:assert/strict');
const { betweenCandidates } = require('../between.js');
const { createGenerator } = require('../generator.js');
const { countSolutions, generate } = createGenerator(betweenCandidates);
const solved = '534678912672195348198342567859761423426853791713924856961537284287419635345286179'.split('').map(Number);
assert.equal(countSolutions(solved).count, 1);
const duplicate = solved.slice(); duplicate[0] = duplicate[1];
assert.equal(countSolutions(duplicate).count, 0);
assert.equal(countSolutions(Array(81).fill(0)).count, 2);
const impossible = Array(81).fill(0); impossible[0] = 1; impossible[3] = 3;
assert.equal(countSolutions(impossible).count, 0);
assert.throws(() => countSolutions(Array(81).fill(0), { deadline: 0 }), /timeout/);
assert.throws(() => generate({ timeoutMs: 0 }), /timeout/);
// An independent verifier derives allowed values directly from the given endpoints.
function verifySolution(givens, solution) {
  assert.equal(solution.length, 81);
  for (let i = 0; i < 81; i++) {
    if (givens[i]) assert.equal(solution[i], givens[i]);
    for (const line of [Array.from({length:9}, (_, n) => Math.floor(i / 9) * 9 + n), Array.from({length:9}, (_, n) => n * 9 + i % 9)]) {
      const pos = line.indexOf(i);
      let left = pos - 1, right = pos + 1;
      while (left >= 0 && !givens[line[left]]) left--;
      while (right < 9 && !givens[line[right]]) right++;
      if (!givens[i] && left >= 0 && right < 9) {
        assert(solution[i] > Math.min(givens[line[left]], givens[line[right]]));
        assert(solution[i] < Math.max(givens[line[left]], givens[line[right]]));
      }
      assert.equal(new Set(line.map(j => solution[j])).size, 9);
    }
    const br = Math.floor(i / 27) * 3, bc = Math.floor(i % 9 / 3) * 3;
    const values = Array.from({length:9}, (_, n) => solution[(br + Math.floor(n / 3)) * 9 + bc + n % 3]);
    assert.equal(new Set(values).size, 9);
  }
}
function independentCount(givens) {
  const board = givens.slice();
  const options = Array.from({ length: 81 }, (_, i) => {
    let allowed = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (const line of [Array.from({ length: 9 }, (_, n) => Math.floor(i / 9) * 9 + n), Array.from({ length: 9 }, (_, n) => n * 9 + i % 9)]) {
      const pos = line.indexOf(i);
      let a = pos - 1, b = pos + 1;
      while (a >= 0 && !givens[line[a]]) a--;
      while (b < 9 && !givens[line[b]]) b++;
      if (!givens[i] && a >= 0 && b < 9) allowed = allowed.filter(d => d > Math.min(givens[line[a]], givens[line[b]]) && d < Math.max(givens[line[a]], givens[line[b]]));
    }
    return allowed;
  });
  let count = 0;
  function search() {
    let best = -1, choices = null;
    for (let i = 0; i < 81; i++) if (!board[i]) {
      const r = Math.floor(i / 9), c = i % 9;
      const candidates = options[i].filter(d => !board.some((v, j) => v === d && (Math.floor(j / 9) === r || j % 9 === c || (Math.floor(j / 27) === Math.floor(r / 3) && Math.floor(j % 9 / 3) === Math.floor(c / 3)))));
      if (!candidates.length) return;
      if (!choices || candidates.length < choices.length) { best = i; choices = candidates; }
    }
    if (best < 0) { count++; return; }
    for (const d of choices) { board[best] = d; search(); board[best] = 0; if (count >= 2) return; }
  }
  search();
  return count;
}
const knownGenerated = '200800100300000000610000000001476900052189400960032710100000830089000000000008004'.split('').map(Number);
const knownSolution = countSolutions(knownGenerated).solution;
assert.equal(countSolutions(knownGenerated).count, 1);
assert.equal(independentCount(knownGenerated), 1);
verifySolution(knownGenerated, knownSolution);
console.log(`Verified generated puzzle: ${knownGenerated.filter(Boolean).length} givens`);
console.log('All generator checks passed');
