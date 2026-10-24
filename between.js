(function (root) {
  'use strict';
  function betweenCandidates(givens) {
    const candidates = Array(81).fill(null);
    const lines = [];
    for (let n = 0; n < 9; n++) {
      lines.push(Array.from({ length: 9 }, (_, i) => n * 9 + i));
      lines.push(Array.from({ length: 9 }, (_, i) => i * 9 + n));
    }
    for (const line of lines) {
      let previous = -1;
      for (let position = 0; position < 9; position++) {
        const index = line[position];
        if (!givens[index]) continue;
        if (previous >= 0 && position > previous + 1) {
          const a = givens[line[previous]], b = givens[index];
          const allowed = Array.from({ length: 9 }, (_, i) => i + 1)
            .filter(d => d > Math.min(a, b) && d < Math.max(a, b));
          for (let i = previous + 1; i < position; i++) {
            const cell = line[i];
            candidates[cell] = candidates[cell] === null ? allowed.slice() : candidates[cell].filter(d => allowed.includes(d));
          }
        }
        previous = position;
      }
    }
    return candidates;
  }
  function findContradictions(givens, marks = betweenCandidates(givens)) {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const houses = [];
    for (let n = 0; n < 9; n++) {
      houses.push({ name: `Row ${n + 1}`, cells: digits.map((_, i) => n * 9 + i) });
      houses.push({ name: `Column ${n + 1}`, cells: digits.map((_, i) => i * 9 + n) });
      houses.push({ name: `Box ${n + 1}`, cells: digits.map((_, i) => (Math.floor(n / 3) * 3 + Math.floor(i / 3)) * 9 + (n % 3) * 3 + i % 3) });
    }
    const possibilities = givens.map((given, i) => {
      if (given) return [];
      const used = new Set(houses.filter(h => h.cells.includes(i)).flatMap(h => h.cells.map(c => givens[c])));
      return (marks[i] === null ? digits : marks[i]).filter(d => !used.has(d));
    });
    const issues = [];
    const cellName = i => `R${Math.floor(i / 9) + 1}C${i % 9 + 1}`;
    for (let i = 0; i < 81; i++) {
      if (!givens[i] && !possibilities[i].length) issues.push({ message: `${cellName(i)} has no possible digit.`, cells: [i] });
    }
    for (const house of houses) {
      const givenCells = house.cells.filter(i => givens[i]);
      const empty = house.cells.filter(i => !givens[i]);
      for (const d of digits) {
        const duplicates = givenCells.filter(i => givens[i] === d);
        if (duplicates.length > 1) issues.push({ message: `${house.name} contains more than one given ${d}.`, cells: duplicates });
        else if (!duplicates.length && !empty.some(i => possibilities[i].includes(d))) {
          issues.push({ message: `${house.name} has no possible position for ${d}.`, cells: house.cells });
        }
      }
      // Hall's condition: a group of cells must have at least as many
      // distinct possible digits as cells. This catches forced duplicates too.
      let deficit = null;
      for (let mask = 1; mask < (1 << empty.length); mask++) {
        const group = empty.filter((_, i) => mask & (1 << i));
        if (group.length < 2 || group.some(i => !possibilities[i].length)) continue;
        const available = [...new Set(group.flatMap(i => possibilities[i]))].sort((a, b) => a - b);
        if (available.length < group.length && (!deficit || group.length < deficit.cells.length)) deficit = { cells: group, available };
      }
      if (deficit) issues.push({ message: `${house.name}: ${deficit.cells.map(cellName).join(', ')} need ${deficit.cells.length} different digits, but only ${deficit.available.join(', ')} ${deficit.available.length === 1 ? 'is' : 'are'} possible.`, cells: deficit.cells });
    }
    return issues;
  }
  if (typeof module !== 'undefined') module.exports = { betweenCandidates, findContradictions };
  root.betweenCandidates = betweenCandidates;
  root.findContradictions = findContradictions;
})(typeof globalThis !== 'undefined' ? globalThis : this);
