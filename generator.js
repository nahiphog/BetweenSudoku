(function (root) {
  'use strict';
  function createGenerator(betweenCandidates) {
    const ALL = 0x1ff;
    const now = () => performance.now();
    const box = i => Math.floor(i / 27) * 3 + Math.floor(i % 9 / 3);
    function countSolutions(givens, options = {}) {
      const deadline = options.deadline ?? Infinity;
      const board = givens.slice();
      const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
      const allowed = betweenCandidates(givens).map(marks => marks === null ? ALL : marks.reduce((mask, d) => mask | (1 << (d - 1)), 0));
      let count = 0, first = null, solutions = [], nodes = 0;
      for (let i = 0; i < 81; i++) {
        const digit = board[i];
        if (!digit) continue;
        const bit = 1 << (digit - 1), r = Math.floor(i / 9), c = i % 9, b = box(i);
        if ((rows[r] | cols[c] | boxes[b]) & bit) return { count: 0, solution: null };
        rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      }
      function search() {
        if ((++nodes & 1023) === 0 && now() >= deadline) throw new Error('timeout');
        let best = -1, bestMask = 0, bestCount = 10;
        for (let i = 0; i < 81; i++) {
          if (board[i]) continue;
          const mask = allowed[i] & ~(rows[Math.floor(i / 9)] | cols[i % 9] | boxes[box(i)]) & ALL;
          if (!mask) return;
          let n = 0; for (let m = mask; m; m &= m - 1) n++;
          if (n < bestCount) { best = i; bestMask = mask; bestCount = n; if (n === 1) break; }
        }
        if (best === -1) { count++; solutions.push(board.slice()); if (!first) first = board.slice(); return; }
        const r = Math.floor(best / 9), c = best % 9, b = box(best);
        for (let mask = bestMask; mask && count < 2; mask &= mask - 1) {
          const bit = mask & -mask;
          board[best] = 1 + Math.log2(bit);
          rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
          search();
          rows[r] ^= bit; cols[c] ^= bit; boxes[b] ^= bit; board[best] = 0;
        }
      }
      if (now() >= deadline) throw new Error('timeout');
      search();
      return { count, solution: first, solutions };
    }
    function shuffle(array, random) {
      for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
      return array;
    }
    function generate(options = {}) {
      if (options.method === 'dual') return generateDual(options);
      const random = options.random || Math.random;
      const overallStarted = now(), deadline = overallStarted + (options.timeoutMs ?? Infinity);
      const restartAfterMs = options.restartAfterMs ?? 1000;
      let attempts = 0, restarts = 0;
      while (now() < deadline) {
        const started = now();
        const attemptDeadline = Math.min(deadline, started + restartAfterMs);
        const givens = Array(81).fill(0);
        let givenCount = 0;
        while (now() < deadline && now() - started < restartAfterMs) {
          const choices = [];
          for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9), col = i % 9;
            const neighbours = [row > 0 ? i - 9 : -1, row < 8 ? i + 9 : -1, col > 0 ? i - 1 : -1, col < 8 ? i + 1 : -1];
            const blocked = options.noOrthogonalAdjacent && neighbours.some(cell => cell >= 0 && givens[cell]);
            if (!givens[i] && !blocked) for (let d = 1; d <= 9; d++) choices.push([i, d]);
          }
          shuffle(choices, random);
          let accepted = false;
          for (const [cell, digit] of choices) {
            if (now() >= deadline || now() - started >= restartAfterMs) break;
            givens[cell] = digit; attempts++;
            let result;
            try {
              result = countSolutions(givens, { deadline: attemptDeadline });
            } catch (error) {
              if (error.message === 'timeout') break;
              throw error;
            }
            if (result.count) {
              accepted = true; givenCount++;
              if (options.onProgress) options.onProgress({ givenCount, attempts, restarts });
              if (result.count === 1) return { givens: givens.slice(), solution: result.solution, givenCount, elapsedMs: now() - started, attempts, restarts };
              break;
            }
            givens[cell] = 0;
          }
          if (!accepted) break;
        }
        restarts++;
      }
      throw new Error('timeout');
    }
    function generateDual(options = {}) {
      const random = options.random || Math.random;
      const overallStarted = now(), deadline = overallStarted + (options.timeoutMs ?? Infinity);
      const restartAfterMs = options.restartAfterMs ?? 1000;
      let attempts = 0, restarts = 0;
      const neighbours = cell => {
        const row = Math.floor(cell / 9), col = cell % 9;
        return [row > 0 ? cell - 9 : -1, row < 8 ? cell + 9 : -1, col > 0 ? cell - 1 : -1, col < 8 ? cell + 1 : -1];
      };
      while (now() < deadline) {
        const started = now(), attemptDeadline = Math.min(deadline, started + restartAfterMs);
        const givens = Array(81).fill(0);
        let givenCount = 0, timedOut = false;
        while (!timedOut && now() < attemptDeadline) {
          const choices = [];
          for (let cell = 0; cell <= 40; cell++) {
            const mate = 80 - cell;
            if (givens[cell] || givens[mate]) continue;
            const pair = [cell, mate];
            const blocked = options.noOrthogonalAdjacent && pair.some(candidate => neighbours(candidate).some(neighbour => neighbour >= 0 && givens[neighbour]));
            if (!blocked) choices.push([cell, mate]);
          }
          if (!choices.length) {
            try {
              const result = countSolutions(givens, { deadline: attemptDeadline });
              if (result.count === 1) return { givens: givens.slice(), solution: result.solution, givenCount, elapsedMs: now() - overallStarted, attempts, restarts };
            } catch (error) { if (error.message !== 'timeout') throw error; }
            break;
          }
          shuffle(choices, random);
          let accepted = false;
          for (const [cell, mate] of choices) {
            const firstDigits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
            for (const first of firstDigits) {
              givens[cell] = first; attempts++;
              let firstResult;
              try { firstResult = countSolutions(givens, { deadline: attemptDeadline }); }
              catch (error) { if (error.message === 'timeout') { timedOut = true; break; } throw error; }
              if (!firstResult.count) { givens[cell] = 0; continue; }
              if (mate === cell) {
                accepted = true; givenCount++;
                if (firstResult.count === 1) return { givens: givens.slice(), solution: firstResult.solution, givenCount, elapsedMs: now() - overallStarted, attempts, restarts };
                break;
              }
              const secondDigits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
              for (const second of secondDigits) {
                givens[mate] = second; attempts++;
                let result;
                try { result = countSolutions(givens, { deadline: attemptDeadline }); }
                catch (error) { if (error.message === 'timeout') { timedOut = true; break; } throw error; }
                if (result.count) {
                  accepted = true; givenCount += 2;
                  if (result.count === 1) return { givens: givens.slice(), solution: result.solution, givenCount, elapsedMs: now() - overallStarted, attempts, restarts };
                  break;
                }
                givens[mate] = 0;
              }
              if (accepted || timedOut) break;
              givens[cell] = 0;
            }
            if (accepted || timedOut) break;
          }
          if (!accepted || timedOut) break;
          if (options.onProgress) options.onProgress({ givenCount, attempts, restarts });
        }
        restarts++;
      }
      throw new Error('timeout');
    }
    function buildCustom(requiredCells, options = {}) {
      const random = options.random || Math.random;
      const started = now(), deadline = started + (options.timeoutMs ?? 120000);
      const restartAfterMs = options.restartAfterMs ?? 1000;
      let attempts = 0, restarts = 0;
      while (now() < deadline) {
        const attemptStarted = now(), attemptDeadline = Math.min(deadline, attemptStarted + restartAfterMs);
        const givens = Array(81).fill(0);
        const remaining = shuffle(requiredCells.slice(), random);
        let failed = false;
        while (remaining.length && now() < attemptDeadline) {
          const cell = remaining.pop();
          const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
          let accepted = false;
          for (const digit of digits) {
            givens[cell] = digit; attempts++;
            let result;
            try { result = countSolutions(givens, { deadline: attemptDeadline }); }
            catch (error) { if (error.message === 'timeout') break; throw error; }
            if (result.count) { accepted = true; break; }
            givens[cell] = 0;
          }
          if (!accepted) { failed = true; break; }
          if (options.onProgress) options.onProgress({ filled: requiredCells.length - remaining.length, required: requiredCells.length, attempts, restarts });
        }
        if (!failed && !remaining.length) {
          try {
            const result = countSolutions(givens, { deadline: attemptDeadline });
            if (result.count === 1) return { givens: givens.slice(), solution: result.solution, givenCount: requiredCells.length, elapsedMs: now() - started, attempts, restarts };
          } catch (error) { if (error.message !== 'timeout') throw error; }
        }
        restarts++;
      }
      throw new Error('timeout');
    }
    return { countSolutions, generate, generateDual, buildCustom };
  }
  root.createGenerator = createGenerator;
  if (typeof module !== 'undefined') module.exports = { createGenerator };
})(typeof globalThis !== 'undefined' ? globalThis : this);
