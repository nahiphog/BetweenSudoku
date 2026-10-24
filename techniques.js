var BetweenSudokuTechniques = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // walkthrough.ts
  var walkthrough_exports = {};
  __export(walkthrough_exports, {
    techniqueCatalog: () => techniqueCatalog,
    walkthrough: () => walkthrough
  });

  // vendor/sudokui/engine/board.ts
  var ALL_CANDS = 511;
  var UNITS = [];
  var CELL_UNITS = [];
  var PEERS = [];
  for (let r = 0; r < 9; r++) UNITS.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) UNITS.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) {
    const br = Math.floor(b / 3) * 3;
    const bc = b % 3 * 3;
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push((br + r) * 9 + bc + c);
    UNITS.push(cells);
  }
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    CELL_UNITS.push([r, 9 + c, 18 + b]);
    const set = /* @__PURE__ */ new Set();
    for (const u of [UNITS[r], UNITS[9 + c], UNITS[18 + b]]) for (const cell of u) set.add(cell);
    set.delete(i);
    PEERS.push([...set].sort((a, z) => a - z));
  }
  var rowOf = (cell) => Math.floor(cell / 9);
  var colOf = (cell) => cell % 9;
  var boxOf = (cell) => Math.floor(cell / 27) * 3 + Math.floor(cell % 9 / 3);
  var sees = (a, b) => a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));
  var cellName = (cell) => `r${rowOf(cell) + 1}c${colOf(cell) + 1}`;
  var cellNames = (cells) => cells.map(cellName).join(", ");
  var bit = (digit) => 1 << digit - 1;
  function popcount(x) {
    x -= x >> 1 & 1431655765;
    x = (x & 858993459) + (x >> 2 & 858993459);
    x = x + (x >> 4) & 252645135;
    return x * 16843009 >> 24;
  }
  function digitsOf(mask) {
    const out = [];
    for (let d = 1; d <= 9; d++) if (mask & bit(d)) out.push(d);
    return out;
  }
  function emptyGrid() {
    const g = {
      values: new Uint8Array(81),
      cands: new Uint16Array(81),
      given: new Uint8Array(81)
    };
    g.cands.fill(ALL_CANDS);
    return g;
  }
  function cloneGrid(g) {
    return {
      values: new Uint8Array(g.values),
      cands: new Uint16Array(g.cands),
      given: new Uint8Array(g.given)
    };
  }
  function setValue(g, cell, digit) {
    g.values[cell] = digit;
    g.cands[cell] = 0;
    const b = bit(digit);
    for (const p of PEERS[cell]) g.cands[p] &= ~b;
  }
  function parseGrid(s) {
    const chars = s.replace(/[^0-9.]/g, "");
    if (chars.length !== 81) return null;
    const g = emptyGrid();
    for (let i = 0; i < 81; i++) {
      const ch = chars[i];
      if (ch !== "." && ch !== "0") {
        setValue(g, i, Number(ch));
        g.given[i] = 1;
      }
    }
    return g;
  }
  function isSolved(g) {
    for (let i = 0; i < 81; i++) if (g.values[i] === 0) return false;
    return true;
  }

  // vendor/sudokui/engine/text.ts
  var table = null;
  var missed = /* @__PURE__ */ new Set();
  var keys = /* @__PURE__ */ new WeakMap();
  function templateKey(strings) {
    let key = strings[0];
    for (let i = 1; i < strings.length; i++) key += `{${i - 1}}` + strings[i];
    return key;
  }
  function tr(strings, ...values) {
    if (table) {
      let key = keys.get(strings);
      if (key === void 0) {
        key = templateKey(strings);
        keys.set(strings, key);
      }
      const t2 = table[key];
      if (t2 !== void 0) return t2.replace(/\{(\d+)\}/g, (_, i) => String(values[Number(i)]));
      missed.add(key);
    }
    let s = strings[0];
    for (let i = 1; i < strings.length; i++) s += String(values[i - 1]) + strings[i];
    return s;
  }
  function joinAnd(items) {
    if (!items.length) return "";
    return items.map(String).reduce((a, b) => tr`${a} and ${b}`);
  }
  function listAnd(items) {
    if (items.length < 2) return items.join("");
    return tr`${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
  }
  function unitName(u) {
    if (u < 9) return tr`row ${u + 1}`;
    if (u < 18) return tr`column ${u - 8}`;
    return tr`box ${u - 17}`;
  }

  // vendor/sudokui/engine/ratings.ts
  var LEVELS = [
    "Beginner",
    "Easy",
    "Medium",
    "Tricky",
    "Hard",
    "Unfair",
    "Extreme",
    "Nightmare"
  ];
  var LEVEL_MAX_SCORE = {
    Beginner: 400,
    Easy: 800,
    Medium: 1e3,
    Tricky: 1150,
    Hard: 1600,
    Unfair: 1800,
    Extreme: 3e3,
    Nightmare: Number.MAX_SAFE_INTEGER
  };
  var t = (index, name, level, category, score, implemented = true, enabled = true) => ({ index, name, level, category, score, implemented, enabled });
  var TECHS = {
    FULL_HOUSE: t(100, "Full House", "Beginner", "Singles", 4),
    NAKED_SINGLE: t(200, "Naked Single", "Beginner", "Singles", 4),
    HIDDEN_SINGLE: t(300, "Hidden Single", "Beginner", "Singles", 14),
    LOCKED_PAIR: t(1e3, "Locked Pair", "Medium", "Intersections", 40),
    LOCKED_TRIPLE: t(1100, "Locked Triple", "Medium", "Intersections", 60),
    LOCKED_CANDIDATES_1: t(1200, "Locked Candidates (Pointing)", "Medium", "Intersections", 50),
    LOCKED_CANDIDATES_2: t(1210, "Locked Candidates (Claiming)", "Medium", "Intersections", 50),
    NAKED_PAIR: t(1300, "Naked Pair", "Medium", "Subsets", 60),
    NAKED_TRIPLE: t(1400, "Naked Triple", "Medium", "Subsets", 80),
    HIDDEN_PAIR: t(1500, "Hidden Pair", "Medium", "Subsets", 70),
    HIDDEN_TRIPLE: t(1600, "Hidden Triple", "Medium", "Subsets", 100),
    NAKED_QUADRUPLE: t(2e3, "Naked Quadruple", "Hard", "Subsets", 120),
    HIDDEN_QUADRUPLE: t(2100, "Hidden Quadruple", "Hard", "Subsets", 150),
    X_WING: t(2200, "X-Wing", "Hard", "Basic Fish", 140),
    SWORDFISH: t(2300, "Swordfish", "Hard", "Basic Fish", 150),
    JELLYFISH: t(2400, "Jellyfish", "Hard", "Basic Fish", 160),
    // Implemented but disabled by default (as in HoDoKu): any fish larger than
    // a jellyfish implies a complementary fish of size ≤ 4 on the same digit
    // (sudokuwiki: "a 5x5 automatically creates a 4x4 with the remaining
    // numbers"), so these can never be *required* by a solve path.
    SQUIRMBAG: t(2500, "Squirmbag", "Unfair", "Basic Fish", 470, true, false),
    WHALE: t(2600, "Whale", "Unfair", "Basic Fish", 470, true, false),
    LEVIATHAN: t(2700, "Leviathan", "Unfair", "Basic Fish", 470, true, false),
    REMOTE_PAIR: t(2800, "Remote Pair", "Hard", "Chains and Loops", 110),
    // This technique is deliberately disabled for Between Sudoku.
    CHUTE_REMOTE_PAIR: t(2850, "Chute Remote Pair", "Hard", "Chains and Loops", 110, true, false),
    BUG_PLUS_1: t(2900, "BUG+1", "Hard", "Uniqueness", 100),
    SKYSCRAPER: t(3e3, "Skyscraper", "Hard", "Single Digit Patterns", 130),
    TWO_STRING_KITE: t(3100, "2-String Kite", "Hard", "Single Digit Patterns", 150),
    TURBOT_FISH: t(3120, "Turbot Fish", "Hard", "Single Digit Patterns", 120),
    EMPTY_RECTANGLE: t(3170, "Empty Rectangle", "Hard", "Single Digit Patterns", 120),
    W_WING: t(3200, "W-Wing", "Hard", "Wings", 150),
    XY_WING: t(3300, "XY-Wing", "Hard", "Wings", 160),
    XYZ_WING: t(3400, "XYZ-Wing", "Hard", "Wings", 180),
    WXYZ_WING: t(3450, "WXYZ-Wing", "Hard", "Wings", 200),
    UNIQUENESS_1: t(3500, "Unique Rectangle Type 1", "Hard", "Uniqueness", 100),
    UNIQUENESS_2: t(3600, "Unique Rectangle Type 2", "Hard", "Uniqueness", 100),
    UNIQUENESS_3: t(3700, "Unique Rectangle Type 3", "Hard", "Uniqueness", 100),
    UNIQUENESS_4: t(3800, "Unique Rectangle Type 4", "Hard", "Uniqueness", 100),
    UNIQUENESS_5: t(3900, "Unique Rectangle Type 5", "Hard", "Uniqueness", 100),
    UNIQUENESS_6: t(4e3, "Unique Rectangle Type 6", "Hard", "Uniqueness", 100),
    HIDDEN_RECTANGLE: t(4010, "Hidden Rectangle", "Hard", "Uniqueness", 100),
    AVOIDABLE_RECTANGLE_1: t(4020, "Avoidable Rectangle Type 1", "Hard", "Uniqueness", 100),
    AVOIDABLE_RECTANGLE_2: t(4030, "Avoidable Rectangle Type 2", "Hard", "Uniqueness", 100),
    FINNED_X_WING: t(4100, "Finned X-Wing", "Hard", "Finned Fish", 130),
    SASHIMI_X_WING: t(4200, "Sashimi X-Wing", "Hard", "Finned Fish", 150),
    FINNED_SWORDFISH: t(4300, "Finned Swordfish", "Unfair", "Finned Fish", 200),
    SASHIMI_SWORDFISH: t(4400, "Sashimi Swordfish", "Unfair", "Finned Fish", 240),
    FINNED_JELLYFISH: t(4500, "Finned Jellyfish", "Unfair", "Finned Fish", 250),
    SASHIMI_JELLYFISH: t(4600, "Sashimi Jellyfish", "Unfair", "Finned Fish", 260),
    SUE_DE_COQ: t(5300, "Sue de Coq", "Unfair", "Miscellaneous", 250),
    SIMPLE_COLORS: t(5330, "Simple Colors", "Hard", "Coloring", 150),
    MULTI_COLORS: t(5360, "Multi Colors", "Hard", "Coloring", 200),
    // sudokUI extension (not in HoDoKu): rated between Multi Colors and X-Chain
    MEDUSA_3D: t(5370, "3D Medusa", "Unfair", "Coloring", 250),
    X_CHAIN: t(5400, "X-Chain", "Unfair", "Chains and Loops", 260),
    XY_CHAIN: t(5500, "XY-Chain", "Unfair", "Chains and Loops", 260),
    NICE_LOOP: t(5600, "Nice Loop", "Unfair", "Chains and Loops", 280),
    GROUPED_NICE_LOOP: t(5650, "Grouped Nice Loop", "Unfair", "Chains and Loops", 300),
    ALS_XZ: t(5700, "ALS-XZ", "Unfair", "Almost Locked Sets", 300),
    ALS_XY_WING: t(5800, "ALS-XY-Wing", "Unfair", "Almost Locked Sets", 320),
    ALS_XY_CHAIN: t(5900, "ALS-XY-Chain", "Unfair", "Almost Locked Sets", 340),
    DEATH_BLOSSOM: t(6e3, "Death Blossom", "Unfair", "Almost Locked Sets", 360),
    FRANKEN_X_WING: t(6100, "Franken X-Wing", "Unfair", "Complex Fish", 300),
    FRANKEN_SWORDFISH: t(6200, "Franken Swordfish", "Unfair", "Complex Fish", 350),
    // --- additions beyond the original port (mostly sudokUI extensions) ---
    X_CYCLES: t(5450, "X-Cycles (loops)", "Unfair", "Chains and Loops", 280),
    GROUPED_X_CYCLES: t(5460, "Grouped X-Cycles", "Unfair", "Chains and Loops", 300),
    TWINNED_XY_CHAIN: t(5550, "Twinned XY-Chains", "Unfair", "Chains and Loops", 300, false),
    AIC: t(5950, "Alternating Inference Chain", "Unfair", "Chains and Loops", 320),
    AIC_GROUPED: t(5960, "AIC with Groups", "Unfair", "Chains and Loops", 340),
    AIC_ALS: t(5970, "AIC with ALSs", "Unfair", "Chains and Loops", 360),
    EXTENDED_RECTANGLE: t(4040, "Extended Rectangle", "Hard", "Uniqueness", 110),
    FIREWORKS: t(6300, "Fireworks", "Extreme", "Miscellaneous", 400),
    TRIDAGON: t(6310, "Tridagon", "Extreme", "Miscellaneous", 400),
    SK_LOOP: t(6320, "SK Loop", "Extreme", "Miscellaneous", 400, false),
    ALIGNED_PAIR_EXCLUSION: t(6330, "Aligned Pair Exclusion", "Unfair", "Miscellaneous", 320),
    EXOCET: t(8300, "Exocet", "Extreme", "Last Resort", 450),
    DOUBLE_EXOCET: t(8310, "Double Exocet", "Extreme", "Last Resort", 480, true, false),
    PATTERN_OVERLAY: t(8320, "Pattern Overlay", "Extreme", "Last Resort", 500),
    DIGIT_FORCING_CHAIN: t(8510, "Digit Forcing Chain", "Extreme", "Last Resort", 500),
    NISHIO_FORCING_CHAIN: t(8520, "Nishio Forcing Chain", "Extreme", "Last Resort", 500),
    CELL_FORCING_CHAIN: t(8530, "Cell Forcing Chain", "Extreme", "Last Resort", 550),
    UNIT_FORCING_CHAIN: t(8540, "Unit Forcing Chain", "Extreme", "Last Resort", 550),
    FORCING_CHAIN: t(8500, "Forcing Chain", "Extreme", "Last Resort", 500, false),
    FORCING_NET: t(8600, "Forcing Net", "Extreme", "Last Resort", 700),
    BRUTE_FORCE: t(8900, "Brute Force", "Extreme", "Last Resort", 1e4)
  };
  var BETWEEN_SUDOKU_DISABLED_CATEGORIES = /* @__PURE__ */ new Set([
    "Uniqueness",
    "Finned Fish",
    "Chains and Loops",
    "Almost Locked Sets",
    "Miscellaneous"
  ]);
  var BETWEEN_SUDOKU_DISABLED_TECHNIQUES = /* @__PURE__ */ new Set([
    "REMOTE_PAIR",
    "SIMPLE_COLORS",
    "MEDUSA_3D"
  ]);
  var SOLVE_ORDER = Object.keys(TECHS).filter((k) => TECHS[k].implemented && TECHS[k].enabled).filter((k) => !BETWEEN_SUDOKU_DISABLED_CATEGORIES.has(TECHS[k].category)).filter((k) => TECHS[k].category !== "Last Resort" || k === "BRUTE_FORCE").filter((k) => !BETWEEN_SUDOKU_DISABLED_TECHNIQUES.has(k)).sort((a, b) => TECHS[a].index - TECHS[b].index);
  var NO_UNIQUENESS_ORDER = SOLVE_ORDER.filter((t2) => TECHS[t2].category !== "Uniqueness");
  var NOT_PRACTISABLE = {
    X_CYCLES: "never needed in practice: X-Chains, which run first, find the same loops",
    FRANKEN_X_WING: "never needed in practice: basic and finned fish, which run first, find what it finds",
    FRANKEN_SWORDFISH: "never needed in practice: basic and finned fish, which run first, find what it finds",
    TRIDAGON: "only ever needed in specially constructed puzzles; none can be generated"
  };
  var PRACTICE_TECHS = SOLVE_ORDER.filter(
    (k) => TECHS[k].category !== "Last Resort" && !NOT_PRACTISABLE[k]
  );
  var ALL_TECHS = Object.keys(TECHS).sort(
    (a, b) => TECHS[a].index - TECHS[b].index
  );
  function maxLevel(a, b) {
    return LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b;
  }
  function bandFloor(l) {
    return l === "Hard" ? "Tricky" : l;
  }

  // vendor/sudokui/engine/techniques/singles.ts
  function fullHouseStep(u, empty, digit) {
    return {
      tech: "FULL_HOUSE",
      placements: [{ cell: empty, digit }],
      eliminations: [],
      units: [{ unit: u, role: "primary" }],
      labels: { primary: tr`${unitName(u)}, with one cell left` },
      description: tr`Full House: ${cellName(empty)} is the last empty cell in ${unitName(u)}, so it must be ${digit}.`
    };
  }
  function findFullHouse(g) {
    for (let u = 0; u < 27; u++) {
      let empty = -1;
      let count = 0;
      for (const cell of UNITS[u]) {
        if (g.values[cell] === 0) {
          empty = cell;
          count++;
          if (count > 1) break;
        }
      }
      if (count === 1) {
        const digit = digitsOf(g.cands[empty])[0];
        if (!digit) continue;
        return fullHouseStep(u, empty, digit);
      }
    }
    return null;
  }
  function nakedSingleStep(g, cell) {
    const digit = digitsOf(g.cands[cell])[0];
    const others = [];
    for (let e = 1; e <= 9; e++) {
      if (e === digit) continue;
      const p = PEERS[cell].find((q) => g.values[q] === e);
      if (p !== void 0) others.push({ cell: p, digit: e });
    }
    return {
      tech: "NAKED_SINGLE",
      placements: [{ cell, digit }],
      eliminations: [],
      primary: [{ cell, digit }],
      secondary: others,
      labels: {
        primary: tr`the cell with one candidate left`,
        secondary: others.length === 8 ? tr`the other eight digits, each already in its row, column or box` : tr`the digits already in its row, column or box; its other candidates were ruled out earlier`
      },
      description: tr`Naked Single: ${cellName(cell)} has only one candidate left, ${digit}.`
    };
  }
  function findNakedSingle(g) {
    for (let cell = 0; cell < 81; cell++) {
      if (g.values[cell] === 0 && popcount(g.cands[cell]) === 1) return nakedSingleStep(g, cell);
    }
    return null;
  }
  function findHiddenSingle(g) {
    for (let u = 0; u < 27; u++) {
      for (let d = 1; d <= 9; d++) {
        const b = bit(d);
        let pos = -1;
        let count = 0;
        for (const cell of UNITS[u]) {
          if (g.values[cell] === 0 && g.cands[cell] & b) {
            pos = cell;
            count++;
            if (count > 1) break;
          }
        }
        if (count === 1) return hiddenSingleStep(g, u, d, pos);
      }
    }
    return null;
  }
  function hiddenSingleStep(g, u, d, pos) {
    {
      {
        {
          const blockers = /* @__PURE__ */ new Map();
          const bands = [{ unit: u, role: "primary" }];
          const shaded = /* @__PURE__ */ new Set([u]);
          for (const x of UNITS[u]) {
            if (x === pos || g.values[x] !== 0) continue;
            const holders = PEERS[x].filter((p) => g.values[p] === d);
            const blocker = holders.find((p) => rowOf(p) === rowOf(x) || colOf(p) === colOf(x)) ?? holders[0];
            if (blocker === void 0) continue;
            blockers.set(blocker, { cell: blocker, digit: d });
            const across = rowOf(blocker) === rowOf(x) ? rowOf(x) : colOf(blocker) === colOf(x) ? 9 + colOf(x) : 18 + boxOf(x);
            if (!shaded.has(across)) {
              shaded.add(across);
              bands.push({ unit: across, role: "secondary" });
            }
          }
          return {
            tech: "HIDDEN_SINGLE",
            placements: [{ cell: pos, digit: d }],
            eliminations: [],
            primary: [{ cell: pos, digit: d }],
            secondary: [...blockers.values()],
            units: bands,
            labels: {
              primary: tr`${unitName(u)}: ${d} has one place left in it`,
              secondary: tr`the ${d}s that rule out its other cells, shaded along their lines`
            },
            description: tr`Hidden Single: ${d} fits only in ${cellName(pos)} within ${unitName(u)}.`
          };
        }
      }
    }
  }

  // vendor/sudokui/engine/techniques/intersections.ts
  function findLockedCandidates1(g) {
    for (let b = 0; b < 9; b++) {
      const boxCells = UNITS[18 + b];
      for (let d = 1; d <= 9; d++) {
        const mask = bit(d);
        const cells = boxCells.filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        if (cells.length < 2) continue;
        for (const lineOf of [rowOf, colOf]) {
          const line = lineOf(cells[0]);
          if (!cells.every((c) => lineOf(c) === line)) continue;
          const lineUnit = UNITS[lineOf === rowOf ? line : 9 + line];
          const elims = lineUnit.filter((c) => boxOf(c) !== b && g.values[c] === 0 && g.cands[c] & mask).map((cell) => ({ cell, digit: d }));
          if (elims.length) {
            const onRow = lineOf === rowOf;
            const box = unitName(18 + b);
            return {
              tech: "LOCKED_CANDIDATES_1",
              placements: [],
              eliminations: elims,
              primary: cells.map((cell) => ({ cell, digit: d })),
              units: [
                { unit: 18 + b, role: "primary" },
                { unit: lineOf === rowOf ? line : 9 + line, role: "secondary" }
              ],
              labels: onRow ? {
                primary: tr`${box}: every ${d} in it sits on one row`,
                secondary: tr`the row, which loses ${d} outside the box`
              } : {
                primary: tr`${box}: every ${d} in it sits on one column`,
                secondary: tr`the column, which loses ${d} outside the box`
              },
              description: onRow ? tr`Locked Candidates (Pointing): in ${box}, digit ${d} is confined to ${cellNames(cells)}, so it can be removed from the rest of the row.` : tr`Locked Candidates (Pointing): in ${box}, digit ${d} is confined to ${cellNames(cells)}, so it can be removed from the rest of the column.`
            };
          }
        }
      }
    }
    return null;
  }
  function findLockedCandidates2(g) {
    for (let u = 0; u < 18; u++) {
      const lineCells = UNITS[u];
      for (let d = 1; d <= 9; d++) {
        const mask = bit(d);
        const cells = lineCells.filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        if (cells.length < 2) continue;
        const b = boxOf(cells[0]);
        if (!cells.every((c) => boxOf(c) === b)) continue;
        const elims = UNITS[18 + b].filter((c) => !lineCells.includes(c) && g.values[c] === 0 && g.cands[c] & mask).map((cell) => ({ cell, digit: d }));
        if (elims.length) {
          const lineName = unitName(u);
          const box = unitName(18 + b);
          return {
            tech: "LOCKED_CANDIDATES_2",
            placements: [],
            eliminations: elims,
            primary: cells.map((cell) => ({ cell, digit: d })),
            units: [
              { unit: u, role: "primary" },
              { unit: 18 + b, role: "secondary" }
            ],
            labels: {
              primary: tr`${lineName}: every ${d} in it sits in one box`,
              secondary: u < 9 ? tr`${box}, which loses ${d} outside the row` : tr`${box}, which loses ${d} outside the column`
            },
            description: tr`Locked Candidates (Claiming): in ${lineName}, digit ${d} is confined to ${box}, so it can be removed from the rest of the box.`
          };
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/subsets.ts
  function combinations(items, k) {
    const out = [];
    const rec = (start, acc) => {
      if (acc.length === k) {
        out.push([...acc]);
        return;
      }
      for (let i = start; i <= items.length - (k - acc.length); i++) {
        acc.push(items[i]);
        rec(i + 1, acc);
        acc.pop();
      }
    };
    rec(0, []);
    return out;
  }
  function subsetName(tech) {
    switch (tech) {
      case "NAKED_PAIR":
        return tr`Naked Pair`;
      case "NAKED_TRIPLE":
        return tr`Naked Triple`;
      case "NAKED_QUADRUPLE":
        return tr`Naked Quadruple`;
      case "LOCKED_PAIR":
        return tr`Locked Pair`;
      case "LOCKED_TRIPLE":
        return tr`Locked Triple`;
      case "HIDDEN_PAIR":
        return tr`Hidden Pair`;
      case "HIDDEN_TRIPLE":
        return tr`Hidden Triple`;
      case "HIDDEN_QUADRUPLE":
        return tr`Hidden Quadruple`;
      default:
        return tech;
    }
  }
  function sharedUnits(cells) {
    const [first, ...rest] = cells;
    return CELL_UNITS[first].filter((u) => rest.every((c) => CELL_UNITS[c].includes(u)));
  }
  function findNakedSubset(g, size, locked) {
    for (let u = 0; u < 27; u++) {
      const empty = UNITS[u].filter(
        (c) => g.values[c] === 0 && popcount(g.cands[c]) <= size
      );
      if (empty.length < size) continue;
      for (const combo of combinations(empty, size)) {
        let mask = 0;
        for (const c of combo) mask |= g.cands[c];
        if (popcount(mask) !== size) continue;
        const units = sharedUnits(combo);
        const elims = [];
        const seen = /* @__PURE__ */ new Set();
        const unitsWithElims = /* @__PURE__ */ new Set();
        for (const su of units) {
          for (const c of UNITS[su]) {
            if (combo.includes(c) || g.values[c] !== 0) continue;
            const hits = g.cands[c] & mask;
            if (!hits) continue;
            unitsWithElims.add(su);
            for (const d of digitsOf(hits)) {
              const key = `${c}-${d}`;
              if (!seen.has(key)) {
                seen.add(key);
                elims.push({ cell: c, digit: d });
              }
            }
          }
        }
        if (!elims.length) continue;
        const isLocked = units.length >= 2 && unitsWithElims.size >= 2 && size <= 3;
        if (isLocked !== locked) continue;
        const tech = locked ? size === 2 ? "LOCKED_PAIR" : "LOCKED_TRIPLE" : `NAKED_${["", "", "PAIR", "TRIPLE", "QUADRUPLE"][size]}`;
        const digits = digitsOf(mask);
        const houses = [...unitsWithElims].map(unitName);
        return {
          tech,
          placements: [],
          eliminations: elims,
          primary: combo.flatMap(
            (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
          ),
          // the houses the set clears: both, for a locked set in an intersection
          units: [...unitsWithElims].map((unit) => ({ unit, role: "primary" })),
          labels: {
            primary: houses.length === 2 ? tr`${size} cells that hold only ${digits.join("/")} between them, in ${houses[0]} and ${houses[1]}` : tr`${size} cells that hold only ${digits.join("/")} between them, in ${joinAnd(houses)}`
          },
          description: tr`${subsetName(tech)}: cells ${cellNames(combo)} contain only ${digits.join("/")}, removing those digits from the cells they all see.`
        };
      }
    }
    return null;
  }
  function findHiddenSubset(g, size) {
    for (let u = 0; u < 27; u++) {
      const empty = UNITS[u].filter((c) => g.values[c] === 0);
      if (empty.length <= size) continue;
      const missing = [];
      for (let d = 1; d <= 9; d++) {
        if (empty.some((c) => g.cands[c] & bit(d))) missing.push(d);
      }
      if (missing.length <= size) continue;
      for (const digitCombo of combinations(missing, size)) {
        let dmask = 0;
        for (const d of digitCombo) dmask |= bit(d);
        const cells = empty.filter((c) => g.cands[c] & dmask);
        if (cells.length !== size) continue;
        const elims = [];
        for (const c of cells) {
          for (const d of digitsOf(g.cands[c] & ~dmask)) elims.push({ cell: c, digit: d });
        }
        if (!elims.length) continue;
        const tech = `HIDDEN_${["", "", "PAIR", "TRIPLE", "QUADRUPLE"][size]}`;
        return {
          tech,
          placements: [],
          eliminations: elims,
          primary: cells.flatMap(
            (cell) => digitsOf(g.cands[cell] & dmask).map((digit) => ({ cell, digit }))
          ),
          units: [{ unit: u, role: "primary" }],
          labels: {
            primary: tr`the only ${size} cells of ${unitName(u)} that can take ${digitCombo.join("/")}`
          },
          description: tr`${subsetName(tech)}: in ${unitName(u)}, digits ${digitCombo.join("/")} fit only in ${cellNames(cells)}, so all other candidates there can be removed.`
        };
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/fish.ts
  var FISH_NAMES = ["", "", "X-Wing", "Swordfish", "Jellyfish", "Squirmbag", "Whale", "Leviathan"];
  var cellAt = (rows, line, pos) => rows ? line * 9 + pos : pos * 9 + line;
  function linePositions(g, d, rows) {
    const mask = bit(d);
    const out = [];
    for (let line = 0; line < 9; line++) {
      let posMask = 0;
      for (let pos = 0; pos < 9; pos++) {
        const c = cellAt(rows, line, pos);
        if (g.values[c] === 0 && g.cands[c] & mask) posMask |= 1 << pos;
      }
      out.push(posMask);
    }
    return out;
  }
  var bitsOf = (m) => {
    const out = [];
    for (let i = 0; i < 9; i++) if (m & 1 << i) out.push(i);
    return out;
  };
  var popcount9 = (m) => bitsOf(m).length;
  function findBasicFish(g, size) {
    for (const rows of [true, false]) {
      for (let d = 1; d <= 9; d++) {
        const positions = linePositions(g, d, rows);
        const candidateLines = [];
        for (let l = 0; l < 9; l++) {
          const n = popcount9(positions[l]);
          if (n >= 2 && n <= size) candidateLines.push(l);
        }
        if (candidateLines.length < size) continue;
        for (const baseLines of combinations(candidateLines, size)) {
          let cover = 0;
          for (const l of baseLines) cover |= positions[l];
          if (popcount9(cover) !== size) continue;
          const elims = [];
          for (const pos of bitsOf(cover)) {
            for (let line = 0; line < 9; line++) {
              if (baseLines.includes(line)) continue;
              const c = cellAt(rows, line, pos);
              if (g.values[c] === 0 && g.cands[c] & bit(d)) elims.push({ cell: c, digit: d });
            }
          }
          if (!elims.length) continue;
          const baseCells = baseLines.flatMap(
            (l) => bitsOf(positions[l]).map((p) => cellAt(rows, l, p))
          );
          const name = FISH_NAMES[size];
          const bases = baseLines.map((l) => l + 1).join(", ");
          const covers = bitsOf(cover).map((p) => p + 1).join(", ");
          return {
            tech: FISH_NAMES[size].toUpperCase().replace("-", "_"),
            placements: [],
            eliminations: elims,
            primary: baseCells.map((cell) => ({ cell, digit: d })),
            units: [
              ...baseLines.map((l) => ({ unit: rows ? l : 9 + l, role: "primary" })),
              ...bitsOf(cover).map((p) => ({ unit: rows ? 9 + p : p, role: "secondary" }))
            ],
            labels: rows ? {
              primary: tr`base rows: the ${d}s of the fish, ${size} rows with ${d} only in the cover columns`,
              secondary: tr`cover columns: ${size} of them take the base's ${d}s, so ${d} goes nowhere else in them`
            } : {
              primary: tr`base columns: the ${d}s of the fish, ${size} columns with ${d} only in the cover rows`,
              secondary: tr`cover rows: ${size} of them take the base's ${d}s, so ${d} goes nowhere else in them`
            },
            description: rows ? tr`${name} on ${d}: in rows ${bases}, ${d} can only go in columns ${covers} (${cellNames(baseCells)}). Those ${size} rows will use up ${d} in those ${size} columns, so ${d} can go nowhere else in them.` : tr`${name} on ${d}: in columns ${bases}, ${d} can only go in rows ${covers} (${cellNames(baseCells)}). Those ${size} columns will use up ${d} in those ${size} rows, so ${d} can go nowhere else in them.`
          };
        }
      }
    }
    return null;
  }
  function findFinnedFish(g, size, sashimi) {
    for (const rows of [true, false]) {
      for (let d = 1; d <= 9; d++) {
        const positions = linePositions(g, d, rows);
        const candidateLines = [];
        for (let l = 0; l < 9; l++) {
          const n = popcount9(positions[l]);
          if (n >= 2 && n <= size + 2) candidateLines.push(l);
        }
        if (candidateLines.length < size) continue;
        for (const baseLines of combinations(candidateLines, size)) {
          let union = 0;
          for (const l of baseLines) union |= positions[l];
          const unionPositions = bitsOf(union);
          if (unionPositions.length <= size || unionPositions.length > size + 2) continue;
          for (const coverPositions of combinations(unionPositions, size)) {
            let cover = 0;
            for (const p of coverPositions) cover |= 1 << p;
            const finCells = [];
            let degenerate = false;
            let isSashimi = false;
            for (const l of baseLines) {
              const inCover = positions[l] & cover;
              if (!inCover) {
                degenerate = true;
                break;
              }
              if (popcount9(inCover) < 2 && (positions[l] & ~cover) !== 0) isSashimi = true;
              for (const p of bitsOf(positions[l] & ~cover)) finCells.push(cellAt(rows, l, p));
            }
            if (degenerate || finCells.length === 0) continue;
            const finBox = boxOf(finCells[0]);
            if (!finCells.every((c) => boxOf(c) === finBox)) continue;
            if (isSashimi !== sashimi) continue;
            const elims = [];
            for (const pos of coverPositions) {
              for (let line = 0; line < 9; line++) {
                if (baseLines.includes(line)) continue;
                const c = cellAt(rows, line, pos);
                if (boxOf(c) !== finBox) continue;
                if (g.values[c] === 0 && g.cands[c] & bit(d)) elims.push({ cell: c, digit: d });
              }
            }
            if (!elims.length) continue;
            const baseCells = baseLines.flatMap(
              (l) => bitsOf(positions[l] & cover).map((p) => cellAt(rows, l, p))
            );
            const prefix = sashimi ? "Sashimi" : "Finned";
            const name = `${prefix} ${FISH_NAMES[size]}`;
            const bases = baseLines.map((l) => l + 1).join(", ");
            const covers = coverPositions.map((p) => p + 1).join(", ");
            const base = cellNames(baseCells);
            const fins = cellNames(finCells);
            const many = finCells.length > 1;
            return {
              tech: `${prefix.toUpperCase()}_${FISH_NAMES[size].toUpperCase().replace("-", "_")}`,
              placements: [],
              eliminations: elims,
              primary: baseCells.map((cell) => ({ cell, digit: d })),
              fins: finCells.map((cell) => ({ cell, digit: d })),
              units: [
                ...baseLines.map((l) => ({ unit: rows ? l : 9 + l, role: "primary" })),
                ...coverPositions.map((p) => ({ unit: rows ? 9 + p : p, role: "secondary" }))
              ],
              labels: {
                primary: rows ? tr`base rows: the ${d}s of the fish` : tr`base columns: the ${d}s of the fish`,
                secondary: rows ? tr`cover columns: where the base's ${d}s must land` : tr`cover rows: where the base's ${d}s must land`,
                fins: tr`fin: ${d}s outside the fish, in one box; a removal must see every fin`
              },
              description: rows ? many ? tr`${name} on ${d}: in rows ${bases}, ${d} sits in columns ${covers} (${base}) except for the fins ${fins}. Either the fins are false and the fish holds, or a fin is true; a ${d} that sees every fin and lies in the cover columns outside the base is false both ways.` : tr`${name} on ${d}: in rows ${bases}, ${d} sits in columns ${covers} (${base}) except for the fin ${fins}. Either the fin is false and the fish holds, or the fin is true; a ${d} that sees every fin and lies in the cover columns outside the base is false both ways.` : many ? tr`${name} on ${d}: in columns ${bases}, ${d} sits in rows ${covers} (${base}) except for the fins ${fins}. Either the fins are false and the fish holds, or a fin is true; a ${d} that sees every fin and lies in the cover rows outside the base is false both ways.` : tr`${name} on ${d}: in columns ${bases}, ${d} sits in rows ${covers} (${base}) except for the fin ${fins}. Either the fin is false and the fish holds, or the fin is true; a ${d} that sees every fin and lies in the cover rows outside the base is false both ways.`
            };
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/steps.ts
  function alternatingLinks(nodes, closure) {
    const links = [];
    for (let i = 1; i < nodes.length; i++) {
      links.push({ from: nodes[i - 1], to: nodes[i], strong: (i - 1) % 2 === 0 });
    }
    if (closure) {
      links.push({
        from: nodes[nodes.length - 1],
        to: nodes[0],
        strong: closure === "strong"
      });
    }
    return links;
  }

  // vendor/sudokui/engine/techniques/singleDigit.ts
  function strongLinks(g, d) {
    const links = [];
    const mask = bit(d);
    for (let u = 0; u < 27; u++) {
      const cells = UNITS[u].filter((c) => g.values[c] === 0 && g.cands[c] & mask);
      if (cells.length === 2) {
        links.push({
          a: cells[0],
          b: cells[1],
          type: u < 9 ? "row" : u < 18 ? "col" : "box"
        });
      }
    }
    return links;
  }
  var linkUnit = (l) => l.type === "row" ? rowOf(l.a) : l.type === "col" ? 9 + colOf(l.a) : 18 + boxOf(l.a);
  function findTurbotFamily(g, variant) {
    for (let d = 1; d <= 9; d++) {
      const links = strongLinks(g, d);
      for (let i = 0; i < links.length; i++) {
        for (let j = i + 1; j < links.length; j++) {
          const l1 = links[i];
          const l2 = links[j];
          const cells1 = [l1.a, l1.b];
          const cells2 = [l2.a, l2.b];
          if (cells1.some((c) => cells2.includes(c))) continue;
          for (const p of cells1) {
            for (const q of cells2) {
              if (!sees(p, q)) continue;
              const a = p === l1.a ? l1.b : l1.a;
              const b = q === l2.a ? l2.b : l2.a;
              if (a === b || sees(a, b)) continue;
              let kind;
              if (l1.type === "row" && l2.type === "row" || l1.type === "col" && l2.type === "col") {
                kind = "SKYSCRAPER";
              } else if ((l1.type === "row" && l2.type === "col" || l1.type === "col" && l2.type === "row") && boxOf(p) === boxOf(q)) {
                kind = "TWO_STRING_KITE";
              } else {
                kind = "TURBOT_FISH";
              }
              if (kind !== variant) continue;
              const pattern = [...cells1, ...cells2];
              const elims = [];
              for (let c = 0; c < 81; c++) {
                if (pattern.includes(c) || g.values[c] !== 0) continue;
                if (!(g.cands[c] & bit(d))) continue;
                if (sees(c, a) && sees(c, b)) elims.push({ cell: c, digit: d });
              }
              if (!elims.length) continue;
              const names = {
                SKYSCRAPER: tr`Skyscraper`,
                TWO_STRING_KITE: tr`2-String Kite`,
                TURBOT_FISH: tr`Turbot Fish`
              };
              return {
                tech: variant,
                placements: [],
                eliminations: elims,
                primary: pattern.map((cell) => ({ cell, digit: d })),
                labels: { primary: tr`the two strong links on ${d}` },
                links: alternatingLinks([a, p, q, b].map((cell) => [{ cell, digit: d }])),
                // each link named by the house it is a conjugate pair in: a
                // box link's two cells may share a line that holds more
                description: tr`${names[variant]} on ${d}: ${cellName(l1.a)} and ${cellName(l1.b)} are the only places for ${d} in ${unitName(linkUnit(l1))}, as are ${cellName(l2.a)} and ${cellName(l2.b)} in ${unitName(linkUnit(l2))}, and ${cellName(p)} sees ${cellName(q)}. If ${cellName(a)} is not ${d}, ${cellName(p)} is, so ${cellName(q)} is not, so ${cellName(b)} is: one of ${cellName(a)} and ${cellName(b)} is ${d}, and ${d} is removed from every cell that sees both.`
              };
            }
          }
        }
      }
    }
    return null;
  }
  function findEmptyRectangle(g) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      for (let b = 0; b < 9; b++) {
        const boxCells = UNITS[18 + b].filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        if (boxCells.length < 2) continue;
        const rows = [...new Set(boxCells.map(rowOf))];
        const cols = [...new Set(boxCells.map(colOf))];
        if (rows.length < 2 && cols.length < 2) continue;
        const boxRows = [Math.floor(b / 3) * 3, Math.floor(b / 3) * 3 + 1, Math.floor(b / 3) * 3 + 2];
        const boxCols = [b % 3 * 3, b % 3 * 3 + 1, b % 3 * 3 + 2];
        for (const erRow of boxRows) {
          for (const erCol of boxCols) {
            if (!boxCells.every((c) => rowOf(c) === erRow || colOf(c) === erCol)) continue;
            if (!boxCells.some((c) => rowOf(c) === erRow && colOf(c) !== erCol)) continue;
            if (!boxCells.some((c) => colOf(c) === erCol && rowOf(c) !== erRow)) continue;
            for (let x = 0; x < 9; x++) {
              if (Math.floor(x / 3) === b % 3) continue;
              const colCells = UNITS[9 + x].filter(
                (c) => g.values[c] === 0 && g.cands[c] & mask
              );
              if (colCells.length !== 2) continue;
              const inErRow = colCells.find((c) => rowOf(c) === erRow);
              const other = colCells.find((c) => rowOf(c) !== erRow);
              if (!inErRow || !other) continue;
              if (Math.floor(rowOf(other) / 3) === Math.floor(b / 3)) continue;
              const target = rowOf(other) * 9 + erCol;
              if (g.values[target] === 0 && g.cands[target] & mask) {
                return erStep(g, d, b, boxCells, [inErRow, other], target, "col");
              }
            }
            for (let r = 0; r < 9; r++) {
              if (Math.floor(r / 3) === Math.floor(b / 3)) continue;
              const rowCells = UNITS[r].filter((c) => g.values[c] === 0 && g.cands[c] & mask);
              if (rowCells.length !== 2) continue;
              const inErCol = rowCells.find((c) => colOf(c) === erCol);
              const other = rowCells.find((c) => colOf(c) !== erCol);
              if (!inErCol || !other) continue;
              if (Math.floor(colOf(other) / 3) === b % 3) continue;
              const target = erRow * 9 + colOf(other);
              if (g.values[target] === 0 && g.cands[target] & mask) {
                return erStep(g, d, b, boxCells, [inErCol, other], target, "row");
              }
            }
          }
        }
      }
    }
    return null;
  }
  function erStep(g, d, box, boxCells, pair, target, pairLine) {
    return {
      tech: "EMPTY_RECTANGLE",
      placements: [],
      eliminations: [{ cell: target, digit: d }],
      primary: boxCells.map((cell) => ({ cell, digit: d })),
      secondary: pair.map((cell) => ({ cell, digit: d })),
      units: [{ unit: 18 + box, role: "primary" }],
      labels: {
        primary: tr`${unitName(18 + box)}: every ${d} in it lies on one row and one column`,
        secondary: tr`the conjugate pair on ${d}`
      },
      description: pairLine === "col" ? tr`Empty Rectangle on ${d}: in ${unitName(18 + box)} every ${d} lies on one row and one column, and ${cellNames(pair)} are the only two places for ${d} in their line. If ${cellName(pair[1])} is ${d}, ${cellName(target)} in its row is not. If not, ${cellName(pair[0])} is ${d}, so the box's ${d} cannot share its row and must lie on the column through ${cellName(target)}, which again is not ${d}. So ${d} is removed from ${cellName(target)}.` : tr`Empty Rectangle on ${d}: in ${unitName(18 + box)} every ${d} lies on one row and one column, and ${cellNames(pair)} are the only two places for ${d} in their line. If ${cellName(pair[1])} is ${d}, ${cellName(target)} in its column is not. If not, ${cellName(pair[0])} is ${d}, so the box's ${d} cannot share its column and must lie on the row through ${cellName(target)}, which again is not ${d}. So ${d} is removed from ${cellName(target)}.`
    };
  }

  // vendor/sudokui/engine/techniques/wings.ts
  function collectZElims(g, z, mustSee, exclude) {
    const elims = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0 || exclude.includes(c)) continue;
      if (!(g.cands[c] & bit(z))) continue;
      if (mustSee.every((m) => sees(c, m))) elims.push({ cell: c, digit: z });
    }
    return elims;
  }
  function findXYWing(g) {
    const bivalue = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 2) bivalue.push(c);
    }
    for (const pivot of bivalue) {
      const [x, y] = digitsOf(g.cands[pivot]);
      const wings = bivalue.filter((c) => c !== pivot && sees(c, pivot));
      for (const w1 of wings) {
        if (!(g.cands[w1] & bit(x)) || g.cands[w1] === g.cands[pivot]) continue;
        const z = digitsOf(g.cands[w1]).find((d) => d !== x);
        if (z === y) continue;
        for (const w2 of wings) {
          if (w2 === w1) continue;
          if (g.cands[w2] !== (bit(y) | bit(z))) continue;
          const elims = collectZElims(g, z, [w1, w2], [pivot, w1, w2]);
          if (!elims.length) continue;
          return {
            tech: "XY_WING",
            placements: [],
            eliminations: elims,
            primary: [{ cell: pivot, digit: x }, { cell: pivot, digit: y }],
            secondary: [{ cell: w1, digit: z }, { cell: w2, digit: z }],
            labels: { primary: tr`pivot`, secondary: tr`pincers` },
            description: tr`XY-Wing: pivot ${cellName(pivot)} (${x}${y}) with pincers ${cellName(w1)} (${x}${z}) and ${cellName(w2)} (${y}${z}); one pincer must be ${z}, so ${z} is removed from cells seeing both.`
          };
        }
      }
    }
    return null;
  }
  function findXYZWing(g) {
    for (let pivot = 0; pivot < 81; pivot++) {
      if (g.values[pivot] !== 0 || popcount(g.cands[pivot]) !== 3) continue;
      const pivotMask = g.cands[pivot];
      const wings = PEERS[pivot].filter(
        (c) => g.values[c] === 0 && popcount(g.cands[c]) === 2 && (g.cands[c] & pivotMask) === g.cands[c]
      );
      for (let i = 0; i < wings.length; i++) {
        for (let j = i + 1; j < wings.length; j++) {
          const shared = g.cands[wings[i]] & g.cands[wings[j]];
          if (popcount(shared) !== 1) continue;
          if ((g.cands[wings[i]] | g.cands[wings[j]]) !== pivotMask) continue;
          const z = digitsOf(shared)[0];
          const elims = collectZElims(g, z, [pivot, wings[i], wings[j]], [pivot, wings[i], wings[j]]);
          if (!elims.length) continue;
          return {
            tech: "XYZ_WING",
            placements: [],
            eliminations: elims,
            primary: digitsOf(pivotMask).map((digit) => ({ cell: pivot, digit })),
            secondary: [
              { cell: wings[i], digit: z },
              { cell: wings[j], digit: z }
            ],
            labels: { primary: tr`pivot`, secondary: tr`pincers` },
            description: tr`XYZ-Wing: pivot ${cellName(pivot)} (${digitsOf(pivotMask).join("")}) with pincers ${cellName(wings[i])} (${digitsOf(g.cands[wings[i]]).join("")}) and ${cellName(wings[j])} (${digitsOf(g.cands[wings[j]]).join("")}). Whichever digit the pivot takes, one of the three cells is ${z}, so ${z} is removed from every cell that sees all three.`
          };
        }
      }
    }
    return null;
  }
  function findWWing(g) {
    const bivalue = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 2) bivalue.push(c);
    }
    for (let i = 0; i < bivalue.length; i++) {
      for (let j = i + 1; j < bivalue.length; j++) {
        const A = bivalue[i];
        const B = bivalue[j];
        if (g.cands[A] !== g.cands[B] || sees(A, B)) continue;
        const [x, y] = digitsOf(g.cands[A]);
        for (const [linkDigit, elimDigit] of [
          [x, y],
          [y, x]
        ]) {
          for (const link of strongLinks(g, linkDigit)) {
            const ends = [link.a, link.b];
            if (ends.includes(A) || ends.includes(B)) continue;
            const [e1, e2] = ends;
            const connects = sees(e1, A) && sees(e2, B) || sees(e1, B) && sees(e2, A);
            if (!connects) continue;
            const elims = collectZElims(g, elimDigit, [A, B], [A, B, e1, e2]);
            if (!elims.length) continue;
            return {
              tech: "W_WING",
              placements: [],
              eliminations: elims,
              primary: [
                { cell: A, digit: elimDigit },
                { cell: B, digit: elimDigit }
              ],
              secondary: [
                { cell: e1, digit: linkDigit },
                { cell: e2, digit: linkDigit }
              ],
              labels: { primary: tr`cells holding ${x} and ${y}`, secondary: tr`strong link on ${linkDigit}` },
              // full AIC: z@A =s= w@A -w- w@e1 =s= w@e2 -w- w@B =s= z@B
              links: alternatingLinks(
                (sees(e1, A) ? [
                  { cell: A, digit: elimDigit },
                  { cell: A, digit: linkDigit },
                  { cell: e1, digit: linkDigit },
                  { cell: e2, digit: linkDigit },
                  { cell: B, digit: linkDigit },
                  { cell: B, digit: elimDigit }
                ] : [
                  { cell: A, digit: elimDigit },
                  { cell: A, digit: linkDigit },
                  { cell: e2, digit: linkDigit },
                  { cell: e1, digit: linkDigit },
                  { cell: B, digit: linkDigit },
                  { cell: B, digit: elimDigit }
                ]).map((cd2) => [cd2])
              ),
              description: tr`W-Wing: ${cellName(A)} and ${cellName(B)} both hold ${x}${y}; the strong link on ${linkDigit} (${cellName(e1)}–${cellName(e2)}) forces one of them to be ${elimDigit}, removing ${elimDigit} from cells seeing both.`
            };
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/chains.ts
  function bivalueCellLinks(g, path, entry) {
    const nodes = [];
    let inDigit = entry;
    for (const cell of path) {
      const outDigit = digitsOf(g.cands[cell]).find((x) => x !== inDigit);
      nodes.push([{ cell, digit: inDigit }], [{ cell, digit: outDigit }]);
      inDigit = outDigit;
    }
    return alternatingLinks(nodes);
  }
  function findRemotePair(g) {
    const byMask = /* @__PURE__ */ new Map();
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 2) {
        const list = byMask.get(g.cands[c]) ?? [];
        list.push(c);
        byMask.set(g.cands[c], list);
      }
    }
    for (const [mask, cells] of byMask) {
      if (cells.length < 4) continue;
      const digits = digitsOf(mask);
      const color = /* @__PURE__ */ new Map();
      for (const start of cells) {
        if (color.has(start)) continue;
        const component = [];
        const queue = [start];
        color.set(start, 0);
        let bipartite = true;
        while (queue.length) {
          const cur = queue.shift();
          component.push(cur);
          for (const next of cells) {
            if (next === cur || !sees(cur, next)) continue;
            if (!color.has(next)) {
              color.set(next, 1 - color.get(cur));
              queue.push(next);
            } else if (color.get(next) === color.get(cur)) {
              bipartite = false;
            }
          }
        }
        if (!bipartite || component.length < 4) continue;
        const elims = [];
        for (let c = 0; c < 81; c++) {
          if (g.values[c] !== 0 || component.includes(c)) continue;
          if (!(g.cands[c] & mask)) continue;
          const seesColor = [false, false];
          for (const cc of component) {
            if (sees(c, cc)) seesColor[color.get(cc)] = true;
          }
          if (seesColor[0] && seesColor[1]) {
            for (const d of digitsOf(g.cands[c] & mask)) elims.push({ cell: c, digit: d });
          }
        }
        if (!elims.length) continue;
        const path = orderAsPath(component, sees);
        return {
          tech: "REMOTE_PAIR",
          labels: { primary: tr`the chain of ${digits.join("")} pairs` },
          placements: [],
          eliminations: elims,
          primary: component.flatMap(
            (cell) => digits.map((digit) => ({ cell, digit }))
          ),
          links: path ? bivalueCellLinks(g, path, digits[0]) : void 0,
          description: tr`Remote Pair: the cells ${cellNames(component)} form a chain of ${digits.join("")} pairs; cells seeing both "colors" of the chain lose ${joinAnd(digits)}.`
        };
      }
    }
    return null;
  }
  function orderAsPath(component, seesFn) {
    const degree = (c) => component.filter((o) => o !== c && seesFn(c, o)).length;
    const start = component.find((c) => degree(c) === 1);
    if (start === void 0) return null;
    const path = [start];
    const used = /* @__PURE__ */ new Set([start]);
    while (path.length < component.length) {
      const cur = path[path.length - 1];
      const nexts = component.filter((c) => !used.has(c) && seesFn(cur, c));
      if (nexts.length !== 1) return null;
      path.push(nexts[0]);
      used.add(nexts[0]);
    }
    return path;
  }
  function findXChain(g, maxLen = 9) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const cells = [];
      for (let c = 0; c < 81; c++) if (g.values[c] === 0 && g.cands[c] & mask) cells.push(c);
      if (cells.length < 4) continue;
      const strong = /* @__PURE__ */ new Map();
      for (const c of cells) strong.set(c, /* @__PURE__ */ new Set());
      for (const [ui, unit] of UNITS.entries()) {
        const uc = unit.filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        if (uc.length === 2) {
          strong.get(uc[0]).add(uc[1]);
          strong.get(uc[1]).add(uc[0]);
        }
      }
      for (const start of cells) {
        if (strong.get(start).size === 0) continue;
        const queue = [{ cell: start, parity: 0, path: [start] }];
        while (queue.length) {
          const { cell, parity, path } = queue.shift();
          if (path.length > maxLen) continue;
          const nexts = parity === 0 ? [...strong.get(cell)] : cells.filter((c) => sees(c, cell) && !path.includes(c));
          for (const next of nexts) {
            if (path.includes(next)) continue;
            const newPath = [...path, next];
            if (parity === 0 && newPath.length >= 4 && newPath.length % 2 === 0) {
              const elims = [];
              for (const c of cells) {
                if (newPath.includes(c)) continue;
                if (sees(c, start) && sees(c, next)) elims.push({ cell: c, digit: d });
              }
              if (elims.length) {
                return {
                  tech: "X_CHAIN",
                  labels: { primary: tr`the chain on ${d}` },
                  placements: [],
                  eliminations: elims,
                  primary: newPath.map((cell2) => ({ cell: cell2, digit: d })),
                  links: alternatingLinks(newPath.map((cell2) => [{ cell: cell2, digit: d }])),
                  description: tr`X-Chain on ${d}: ${newPath.map(cellName).join(" \u2192 ")}; one end must be ${d}, so ${d} is removed from cells seeing both ends.`
                };
              }
            }
            queue.push({ cell: next, parity: 1 - parity, path: newPath });
          }
        }
      }
    }
    return null;
  }
  function findXYChain(g, maxLen = 10) {
    const bivalue = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 2) bivalue.push(c);
    }
    if (bivalue.length < 3) return null;
    for (const start of bivalue) {
      for (const z of digitsOf(g.cands[start])) {
        const linkStart = digitsOf(g.cands[start]).find((x) => x !== z);
        const queue = [{ cell: start, linkDigit: linkStart, path: [start] }];
        while (queue.length) {
          const { cell, linkDigit, path } = queue.shift();
          if (path.length > maxLen) continue;
          for (const next of bivalue) {
            if (path.includes(next) || !sees(next, cell)) continue;
            if (!(g.cands[next] & bit(linkDigit))) continue;
            const exit = digitsOf(g.cands[next]).find((x) => x !== linkDigit);
            const newPath = [...path, next];
            if (exit === z && newPath.length >= 3) {
              const elims = [];
              for (let c = 0; c < 81; c++) {
                if (g.values[c] !== 0 || newPath.includes(c)) continue;
                if (!(g.cands[c] & bit(z))) continue;
                if (sees(c, start) && sees(c, next)) elims.push({ cell: c, digit: z });
              }
              if (elims.length) {
                return {
                  tech: "XY_CHAIN",
                  labels: { primary: tr`the chain of bivalue cells` },
                  placements: [],
                  eliminations: elims,
                  primary: newPath.map((cell2) => ({
                    cell: cell2,
                    digit: cell2 === start || cell2 === next ? z : 0
                  })).filter((cd2) => cd2.digit !== 0),
                  links: bivalueCellLinks(g, newPath, z),
                  description: tr`XY-Chain: ${newPath.map(cellName).join(" \u2192 ")}; whichever way the chain resolves, one end is ${z}, so ${z} is removed from cells seeing both ends.`
                };
              }
            }
            queue.push({ cell: next, linkDigit: exit, path: newPath });
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/coloring.ts
  function clusters(g, d) {
    const mask = bit(d);
    const adj = /* @__PURE__ */ new Map();
    for (const unit of UNITS) {
      const uc = unit.filter((c) => g.values[c] === 0 && g.cands[c] & mask);
      if (uc.length === 2) {
        if (!adj.has(uc[0])) adj.set(uc[0], /* @__PURE__ */ new Set());
        if (!adj.has(uc[1])) adj.set(uc[1], /* @__PURE__ */ new Set());
        adj.get(uc[0]).add(uc[1]);
        adj.get(uc[1]).add(uc[0]);
      }
    }
    const out = [];
    const visited = /* @__PURE__ */ new Set();
    for (const start of adj.keys()) {
      if (visited.has(start)) continue;
      const color = /* @__PURE__ */ new Map();
      const queue = [start];
      color.set(start, 0);
      visited.add(start);
      const cells = [];
      const edges = [];
      while (queue.length) {
        const cur = queue.shift();
        cells.push(cur);
        for (const next of adj.get(cur)) {
          if (!color.has(next)) {
            color.set(next, 1 - color.get(cur));
            visited.add(next);
            edges.push([cur, next]);
            queue.push(next);
          }
        }
      }
      if (cells.length >= 3) out.push({ cells, color, edges });
    }
    return out;
  }
  var treeLinks = (cl, d) => cl.edges.map(([a, b]) => ({
    from: [{ cell: a, digit: d }],
    to: [{ cell: b, digit: d }],
    strong: true,
    undirected: true
  }));
  var witness = (from, to, d, text) => ({
    from: [{ cell: from, digit: d }],
    to: [{ cell: to, digit: d }],
    strong: false,
    text
  });
  function simpleColorsStep(cl, d, eliminations, reason, witnesses = []) {
    return {
      tech: "SIMPLE_COLORS",
      placements: [],
      eliminations,
      primary: cl.cells.filter((c) => cl.color.get(c) === 0).map((cell) => ({ cell, digit: d })),
      secondary: cl.cells.filter((c) => cl.color.get(c) === 1).map((cell) => ({ cell, digit: d })),
      labels: {
        primary: tr`blue: one colour of the conjugate pairs on ${d}, all true or all false together`,
        secondary: tr`gold: the other colour, true exactly when blue is false`
      },
      links: [...treeLinks(cl, d), ...witnesses],
      description: tr`Simple Colors on ${d}: its conjugate pairs (the solid links) are coloured blue and gold, and either every blue ${d} is true or every gold one is. ${reason}.`
    };
  }
  function findSimpleColors(g) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      for (const cl of clusters(g, d)) {
        for (let u = 0; u < 27; u++) {
          const colored = UNITS[u].filter((c) => cl.color.has(c));
          for (const col of [0, 1]) {
            const same = colored.filter((c) => cl.color.get(c) === col);
            if (same.length >= 2) {
              const elims2 = cl.cells.filter((c) => cl.color.get(c) === col).map((cell) => ({ cell, digit: d }));
              const unit = unitName(u);
              const a = cellName(same[0]);
              const b = cellName(same[1]);
              return simpleColorsStep(
                cl,
                d,
                elims2,
                col === 0 ? tr`Blue puts ${d} twice in ${unit} (${a} and ${b}), so blue is false: all its ${d}s are removed (circled red) and every gold ${d} is true` : tr`Gold puts ${d} twice in ${unit} (${a} and ${b}), so gold is false: all its ${d}s are removed (circled red) and every blue ${d} is true`,
                [
                  witness(
                    same[0],
                    same[1],
                    d,
                    col === 0 ? tr`Blue puts ${d} in both ${a} and ${b} of ${unit}. A digit appears once per house, so blue cannot be true.` : tr`Gold puts ${d} in both ${a} and ${b} of ${unit}. A digit appears once per house, so gold cannot be true.`
                  )
                ]
              );
            }
          }
        }
        const elims = [];
        let why = "";
        const witnesses = [];
        for (let c = 0; c < 81; c++) {
          if (g.values[c] !== 0 || cl.color.has(c) || !(g.cands[c] & mask)) continue;
          const seen = [void 0, void 0];
          for (const cc of cl.cells) if (sees(c, cc)) seen[cl.color.get(cc)] ??= cc;
          if (seen[0] !== void 0 && seen[1] !== void 0) {
            elims.push({ cell: c, digit: d });
            if (!why) {
              why = tr`The ${d} in ${cellName(c)} sees a blue ${d} in ${cellName(seen[0])} and a gold ${d} in ${cellName(seen[1])}, so it is false either way`;
              witnesses.push(
                witness(seen[0], c, d, tr`If blue is true, the ${d} in ${cellName(seen[0])} is placed, and the ${d} in ${cellName(c)} goes.`),
                witness(
                  seen[1],
                  c,
                  d,
                  tr`If gold is true, the ${d} in ${cellName(seen[1])} is placed, and the ${d} in ${cellName(c)} goes. Either way it is false.`
                )
              );
            }
          }
        }
        if (elims.length) {
          return simpleColorsStep(
            cl,
            d,
            elims,
            why + (elims.length > 1 ? tr`; ${elims.length} ${d}s fall this way` : ""),
            witnesses
          );
        }
      }
    }
    return null;
  }
  function findMultiColors(g) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const cls = clusters(g, d);
      for (let i = 0; i < cls.length; i++) {
        for (let j = 0; j < cls.length; j++) {
          if (i === j) continue;
          const c1 = cls[i];
          const c2 = cls[j];
          for (const colA of [0, 1]) {
            const aCells = c1.cells.filter((c) => c1.color.get(c) === colA);
            for (const colB of [0, 1]) {
              const bCells = c2.cells.filter((c) => c2.color.get(c) === colB);
              let bridgeA = -1;
              let bridgeB = -1;
              for (const a of aCells) {
                for (const b of bCells) {
                  if (sees(a, b)) {
                    bridgeA = a;
                    bridgeB = b;
                    break;
                  }
                }
                if (bridgeA >= 0) break;
              }
              if (bridgeA < 0) continue;
              const aOther = c1.cells.filter((c) => c1.color.get(c) === 1 - colA);
              const bOther = c2.cells.filter((c) => c2.color.get(c) === 1 - colB);
              const bridge = {
                from: [{ cell: bridgeA, digit: d }],
                to: [{ cell: bridgeB, digit: d }],
                strong: false
              };
              let bridgeA2 = -1;
              let bridgeB2 = -1;
              for (const a of aCells) {
                for (const b of bOther) {
                  if (sees(a, b)) {
                    bridgeA2 = a;
                    bridgeB2 = b;
                    break;
                  }
                }
                if (bridgeA2 >= 0) break;
              }
              if (bridgeA2 >= 0) {
                return {
                  tech: "MULTI_COLORS",
                  placements: [],
                  eliminations: aCells.map((cell) => ({ cell, digit: d })),
                  primary: bCells.map((cell) => ({ cell, digit: d })),
                  secondary: bOther.map((cell) => ({ cell, digit: d })),
                  fins: aOther.map((cell) => ({ cell, digit: d })),
                  labels: {
                    primary: tr`blue: one colour of the second cluster`,
                    secondary: tr`gold: its partner colour`,
                    fins: tr`purple: the partner colour of the red one, in the first cluster`
                  },
                  links: [
                    ...treeLinks(c1, d),
                    ...treeLinks(c2, d),
                    bridge,
                    {
                      from: [{ cell: bridgeA2, digit: d }],
                      to: [{ cell: bridgeB2, digit: d }],
                      strong: false
                    }
                  ],
                  description: tr`Multi Colors on ${d}: two conjugate-pair clusters of ${d}, one coloured blue and gold. If the red ${d}s were all true, ${cellName(bridgeA)} would kill the blue ${d} in ${cellName(bridgeB)}, making gold entirely true; but ${cellName(bridgeA2)} also sees the gold ${d} in ${cellName(bridgeB2)}. So the red colour is false and every purple ${d} (its partner colour) is true.`
                };
              }
              const elims = [];
              let why = "";
              const witnesses = [];
              for (let c = 0; c < 81; c++) {
                if (g.values[c] !== 0 || !(g.cands[c] & mask)) continue;
                if (c1.color.has(c) || c2.color.has(c)) continue;
                const x = aOther.find((a) => sees(c, a));
                const y = bOther.find((b) => sees(c, b));
                if (x !== void 0 && y !== void 0) {
                  elims.push({ cell: c, digit: d });
                  if (!why) {
                    why = tr`The ${d} in ${cellName(c)} sees the blue ${d} in ${cellName(x)} and the gold ${d} in ${cellName(y)}, so it is false either way`;
                    witnesses.push(
                      witness(x, c, d, tr`If blue is true, the ${d} in ${cellName(x)} is placed, and the ${d} in ${cellName(c)} goes.`),
                      witness(y, c, d, tr`If gold is true, the ${d} in ${cellName(y)} is placed, and the ${d} in ${cellName(c)} goes. Either way it is false.`)
                    );
                  }
                }
              }
              if (elims.length) {
                const reason = why + (elims.length > 1 ? tr`; ${elims.length} ${d}s fall this way` : "");
                return {
                  tech: "MULTI_COLORS",
                  placements: [],
                  eliminations: elims,
                  primary: aOther.map((cell) => ({ cell, digit: d })),
                  secondary: bOther.map((cell) => ({ cell, digit: d })),
                  fins: aCells.concat(bCells).map((cell) => ({ cell, digit: d })),
                  labels: {
                    primary: tr`blue: a colour of the first cluster`,
                    secondary: tr`gold: a colour of the second cluster`,
                    fins: tr`purple: the two colours that see each other across the bridge; at most one is true`
                  },
                  links: [...treeLinks(c1, d), ...treeLinks(c2, d), bridge, ...witnesses],
                  description: tr`Multi Colors on ${d}: two conjugate-pair clusters of ${d}. The purple ${d}s in ${cellName(bridgeA)} and ${cellName(bridgeB)} see each other (the dashed link), so they cannot both be true, and at least one of blue and gold is entirely true. ${reason}.`
                };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/uniqueness.ts
  function* rectangles(g) {
    for (let r1 = 0; r1 < 8; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        const sameBand = Math.floor(r1 / 3) === Math.floor(r2 / 3);
        for (let c1 = 0; c1 < 8; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const sameStack = Math.floor(c1 / 3) === Math.floor(c2 / 3);
            if (sameBand === sameStack) continue;
            const cells = [
              r1 * 9 + c1,
              r1 * 9 + c2,
              r2 * 9 + c1,
              r2 * 9 + c2
            ];
            if (cells.some((c) => g.values[c] !== 0)) continue;
            const common = cells.reduce((m, c) => m & g.cands[c], 511);
            if (popcount(common) < 2) continue;
            const pairs = digitsOf(common);
            for (let i = 0; i < pairs.length; i++) {
              for (let j = i + 1; j < pairs.length; j++) {
                yield { cells, x: pairs[i], y: pairs[j] };
              }
            }
          }
        }
      }
    }
  }
  function findUniqueness(g, type) {
    for (const rect of rectangles(g)) {
      const { cells, x, y } = rect;
      const pairMask = bit(x) | bit(y);
      const exact = cells.filter((c) => g.cands[c] === pairMask);
      const extra = cells.filter((c) => g.cands[c] !== pairMask);
      if (type === 3 && exact.length === 2 && extra.length === 2) {
        const step = uniqueness3(g, rect, pairMask, extra);
        if (step) return step;
      }
      if (type === 5 && exact.length <= 2 && extra.length >= 2) {
        const step = uniqueness5(g, rect, pairMask, exact, extra);
        if (step) return step;
      }
      if (type === 6 && exact.length === 2 && extra.length === 2) {
        const step = uniqueness6(g, rect, pairMask, exact, extra);
        if (step) return step;
      }
      if (type === 1 && exact.length === 3 && extra.length === 1) {
        const target = extra[0];
        const elims = digitsOf(g.cands[target] & pairMask).map((digit) => ({
          cell: target,
          digit
        }));
        if (elims.length) {
          return {
            tech: "UNIQUENESS_1",
            placements: [],
            eliminations: elims,
            primary: exact.flatMap((cell) => [
              { cell, digit: x },
              { cell, digit: y }
            ]),
            labels: { primary: tr`the three corners holding only ${x}/${y}: the fourth must not join them` },
            description: tr`Unique Rectangle Type 1: ${cellNames(cells)} would form a deadly pattern on ${x}/${y}; ${cellName(target)} cannot be ${x} or ${y}.`
          };
        }
      }
      if (type === 2 && exact.length === 2 && extra.length === 2) {
        const [e1, e2] = extra;
        const extras1 = g.cands[e1] & ~pairMask;
        const extras2 = g.cands[e2] & ~pairMask;
        if (extras1 !== extras2 || popcount(extras1) !== 1) continue;
        const z = digitsOf(extras1)[0];
        const elims = [];
        for (let c = 0; c < 81; c++) {
          if (g.values[c] !== 0 || cells.includes(c)) continue;
          if (!(g.cands[c] & bit(z))) continue;
          if (sees(c, e1) && sees(c, e2)) elims.push({ cell: c, digit: z });
        }
        if (elims.length) {
          return {
            tech: "UNIQUENESS_2",
            placements: [],
            eliminations: elims,
            primary: cells.flatMap((cell) => [
              { cell, digit: x },
              { cell, digit: y }
            ]),
            secondary: [
              { cell: e1, digit: z },
              { cell: e2, digit: z }
            ],
            labels: {
              primary: tr`the rectangle: ${x}/${y} in all four corners`,
              secondary: tr`${z}, the roof's extra candidate: one of the two roof cells must be it`
            },
            description: tr`Unique Rectangle Type 2: to avoid the deadly pattern on ${x}/${y}, one of ${cellName(e1)}/${cellName(e2)} must be ${z}, so ${z} is removed from cells seeing both.`
          };
        }
      }
      if (type === 4 && exact.length === 2 && extra.length === 2) {
        const [e1, e2] = extra;
        const shared = CELL_UNITS[e1].filter((u) => CELL_UNITS[e2].includes(u));
        for (const [keep, kill] of [
          [x, y],
          [y, x]
        ]) {
          const confined = shared.some(
            (u) => UNITS[u].every(
              (c) => c === e1 || c === e2 || g.values[c] !== 0 || !(g.cands[c] & bit(keep))
            )
          );
          if (!confined) continue;
          const elims = [e1, e2].filter((c) => g.cands[c] & bit(kill)).map((cell) => ({ cell, digit: kill }));
          if (elims.length) {
            return {
              tech: "UNIQUENESS_4",
              placements: [],
              eliminations: elims,
              primary: cells.flatMap((cell) => [
                { cell, digit: x },
                { cell, digit: y }
              ]),
              labels: { primary: tr`the rectangle: ${x}/${y} in all four corners, with ${keep} locked into the roof` },
              description: tr`Unique Rectangle Type 4: ${keep} is locked into ${cellName(e1)}/${cellName(e2)}; keeping ${kill} there would force the deadly pattern, so ${kill} is removed from both.`
            };
          }
        }
      }
    }
    return null;
  }
  function uniqueness3(g, rect, pairMask, extra) {
    const [e1, e2] = extra;
    const E = (g.cands[e1] | g.cands[e2]) & ~pairMask;
    if (popcount(E) < 2) return null;
    const shared = CELL_UNITS[e1].filter((u) => CELL_UNITS[e2].includes(u));
    for (const u of shared) {
      const others = UNITS[u].filter(
        (c) => g.values[c] === 0 && !rect.cells.includes(c)
      );
      for (const k of [1, 2, 3]) {
        if (others.length < k + 1) continue;
        for (const S of combinations(others, k)) {
          let mask = E;
          for (const c of S) mask |= g.cands[c];
          if (popcount(mask) !== k + 1) continue;
          const elims = [];
          for (const c of others) {
            if (S.includes(c)) continue;
            for (const d of digitsOf(g.cands[c] & mask)) elims.push({ cell: c, digit: d });
          }
          if (!elims.length) continue;
          return {
            tech: "UNIQUENESS_3",
            placements: [],
            eliminations: elims,
            primary: rect.cells.flatMap((cell) => [
              { cell, digit: rect.x },
              { cell, digit: rect.y }
            ]),
            secondary: S.flatMap(
              (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
            ),
            labels: {
              primary: tr`the rectangle: ${rect.x}/${rect.y} in all four corners`,
              secondary: tr`the cells that form a locked set with the roof extras`
            },
            description: tr`Unique Rectangle Type 3: the roof extras of ${cellNames(rect.cells)} act as one pseudo-cell and form a locked set with ${cellNames(S)}, clearing those digits from the rest of the unit.`
          };
        }
      }
    }
    return null;
  }
  function uniqueness5(g, rect, pairMask, exact, extra) {
    if (exact.length !== 1 || extra.length !== 3) return null;
    const zMasks = extra.map((c) => g.cands[c] & ~pairMask);
    if (zMasks.some((m) => popcount(m) !== 1)) return null;
    if (zMasks[0] !== zMasks[1] || zMasks[1] !== zMasks[2]) return null;
    const z = digitsOf(zMasks[0])[0];
    const elims = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0 || rect.cells.includes(c)) continue;
      if (!(g.cands[c] & bit(z))) continue;
      if (extra.every((e) => sees(c, e))) elims.push({ cell: c, digit: z });
    }
    if (!elims.length) return null;
    return {
      tech: "UNIQUENESS_5",
      placements: [],
      eliminations: elims,
      primary: rect.cells.flatMap((cell) => [
        { cell, digit: rect.x },
        { cell, digit: rect.y }
      ]),
      secondary: extra.map((cell) => ({ cell, digit: z })),
      labels: {
        primary: tr`the rectangle: ${rect.x}/${rect.y} in all four corners`,
        secondary: tr`${z} in the roof cells: one of them must be it`
      },
      description: tr`Unique Rectangle Type 5: one of ${cellNames(extra)} must be ${z} to avoid the deadly pattern, so ${z} is removed from cells seeing all of them.`
    };
  }
  function uniqueness6(g, rect, pairMask, exact, extra) {
    const [f1, f2] = exact;
    if (rowOf(f1) === rowOf(f2) || colOf(f1) === colOf(f2)) return null;
    const rows = [rowOf(rect.cells[0]), rowOf(rect.cells[2])];
    const cols = [colOf(rect.cells[0]), colOf(rect.cells[1])];
    for (const d of [rect.x, rect.y]) {
      const confined = (units) => units.every(
        (u) => UNITS[u].every(
          (c) => rect.cells.includes(c) || g.values[c] !== 0 || !(g.cands[c] & bit(d))
        )
      );
      const rowsStrong = confined(rows);
      const colsStrong = confined(cols.map((c) => 9 + c));
      if (!rowsStrong && !colsStrong) continue;
      const elims = extra.filter((c) => g.cands[c] & bit(d)).map((cell) => ({ cell, digit: d }));
      if (!elims.length) continue;
      return {
        tech: "UNIQUENESS_6",
        placements: [],
        eliminations: elims,
        primary: rect.cells.flatMap((cell) => [
          { cell, digit: rect.x },
          { cell, digit: rect.y }
        ]),
        labels: {
          primary: rowsStrong ? tr`the rectangle: ${rect.x}/${rect.y} in all four corners, with ${d} confined to it in both rows` : tr`the rectangle: ${rect.x}/${rect.y} in all four corners, with ${d} confined to it in both columns`
        },
        description: rowsStrong ? tr`Unique Rectangle Type 6: ${d} is confined to the rectangle in both rows; placing it in a roof corner would force the deadly pattern, so ${d} is removed from ${cellNames(extra)}.` : tr`Unique Rectangle Type 6: ${d} is confined to the rectangle in both columns; placing it in a roof corner would force the deadly pattern, so ${d} is removed from ${cellNames(extra)}.`
      };
    }
    return null;
  }
  function findHiddenRectangle(g) {
    for (const rect of rectangles(g)) {
      const { cells, x, y } = rect;
      const pairMask = bit(x) | bit(y);
      for (const [ai, bi] of [
        [0, 3],
        [3, 0],
        [1, 2],
        [2, 1]
      ]) {
        const A = cells[ai];
        const B = cells[bi];
        if (g.cands[A] !== pairMask) continue;
        const rowMate = cells.find((c) => c !== B && rowOf(c) === rowOf(B));
        const colMate = cells.find((c) => c !== B && colOf(c) === colOf(B));
        for (const [strong, weak] of [
          [x, y],
          [y, x]
        ]) {
          const sb = bit(strong);
          const rowConfined = UNITS[rowOf(B)].every(
            (c) => c === B || c === rowMate || g.values[c] !== 0 || !(g.cands[c] & sb)
          );
          const colConfined = UNITS[9 + colOf(B)].every(
            (c) => c === B || c === colMate || g.values[c] !== 0 || !(g.cands[c] & sb)
          );
          if (!rowConfined || !colConfined) continue;
          if (!(g.cands[B] & bit(weak))) continue;
          return {
            tech: "HIDDEN_RECTANGLE",
            placements: [],
            eliminations: [{ cell: B, digit: weak }],
            primary: cells.flatMap((cell) => [
              { cell, digit: x },
              { cell, digit: y }
            ]),
            secondary: [{ cell: A, digit: strong }],
            labels: {
              primary: tr`the rectangle: ${x}/${y} in all four corners`,
              secondary: tr`${strong} in the bivalue corner: confined to the rectangle in ${cellName(B)}'s row and column`
            },
            description: tr`Hidden Rectangle: ${cellName(A)} holds only ${x}${y}, and ${strong} is confined to the rectangle in ${cellName(B)}'s row and column; ${cellName(B)} cannot be ${weak} or the deadly pattern appears.`
          };
        }
      }
    }
    return null;
  }
  function findAvoidableRectangle(g, type) {
    for (let r1 = 0; r1 < 8; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        const sameBand = Math.floor(r1 / 3) === Math.floor(r2 / 3);
        for (let c1 = 0; c1 < 8; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            const sameStack = Math.floor(c1 / 3) === Math.floor(c2 / 3);
            if (sameBand === sameStack) continue;
            const cells = [r1 * 9 + c1, r1 * 9 + c2, r2 * 9 + c1, r2 * 9 + c2];
            const solved = cells.filter((c) => g.values[c] !== 0);
            if (solved.some((c) => g.given[c])) continue;
            const unsolved = cells.filter((c) => g.values[c] === 0);
            const diagOf = (c) => cells.find((d) => rowOf(d) !== rowOf(c) && colOf(d) !== colOf(c));
            if (type === 1 && solved.length === 3 && unsolved.length === 1) {
              const U = unsolved[0];
              const D = diagOf(U);
              const adj = solved.filter((c) => c !== D);
              const a = g.values[D];
              if (g.values[adj[0]] !== g.values[adj[1]] || g.values[adj[0]] === a) continue;
              if (!(g.cands[U] & bit(a))) continue;
              return {
                tech: "AVOIDABLE_RECTANGLE_1",
                placements: [],
                eliminations: [{ cell: U, digit: a }],
                // the three solved corners, shown by their digits
                primary: solved.map((cell) => ({ cell, digit: g.values[cell] })),
                secondary: [{ cell: U, digit: a }],
                labels: {
                  primary: tr`the three solved corners, none of them a given`,
                  secondary: tr`the cell that would complete the rectangle with ${a}`
                },
                description: tr`Avoidable Rectangle Type 1: setting ${cellName(U)} to ${a} would complete an interchangeable rectangle of solved (non-given) cells, contradicting the puzzle's unique solution.`
              };
            }
            if (type === 2 && solved.length === 2 && unsolved.length === 2) {
              const [p1, p2] = solved;
              if (rowOf(p1) !== rowOf(p2) && colOf(p1) !== colOf(p2)) continue;
              if (g.values[p1] === g.values[p2]) continue;
              const [u1, u2] = unsolved;
              const dv1 = g.values[diagOf(u1)];
              const dv2 = g.values[diagOf(u2)];
              const extra1 = g.cands[u1] & ~bit(dv1);
              const extra2 = g.cands[u2] & ~bit(dv2);
              if (!(g.cands[u1] & bit(dv1)) || !(g.cands[u2] & bit(dv2))) continue;
              if (popcount(extra1) !== 1 || extra1 !== extra2) continue;
              const cDigit = digitsOf(extra1)[0];
              const elims = [];
              for (let c = 0; c < 81; c++) {
                if (g.values[c] !== 0 || c === u1 || c === u2) continue;
                if (!(g.cands[c] & bit(cDigit))) continue;
                if (sees(c, u1) && sees(c, u2)) elims.push({ cell: c, digit: cDigit });
              }
              if (!elims.length) continue;
              return {
                tech: "AVOIDABLE_RECTANGLE_2",
                placements: [],
                eliminations: elims,
                primary: [
                  { cell: u1, digit: cDigit },
                  { cell: u2, digit: cDigit }
                ],
                // the two solved corners, shown by their digits
                secondary: solved.map((cell) => ({ cell, digit: g.values[cell] })),
                labels: {
                  primary: tr`${cDigit} in the two unsolved corners: one of them must be it`,
                  secondary: tr`the two solved corners, neither of them a given`
                },
                description: tr`Avoidable Rectangle Type 2: to avoid an interchangeable rectangle with the solved cells ${cellNames(solved)}, one of ${cellName(u1)}/${cellName(u2)} must be ${cDigit}, so ${cDigit} is removed from cells seeing both.`
              };
            }
          }
        }
      }
    }
    return null;
  }
  function findBugPlus1(g) {
    let triCell = -1;
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0) continue;
      const n = popcount(g.cands[c]);
      if (n === 2) continue;
      if (n === 3 && triCell === -1) triCell = c;
      else return null;
    }
    if (triCell === -1) return null;
    for (const d of digitsOf(g.cands[triCell])) {
      const counts = CELL_UNITS[triCell].map(
        (u) => UNITS[u].filter((c) => g.values[c] === 0 && g.cands[c] & bit(d)).length
      );
      if (counts.every((n) => n === 3)) {
        return {
          tech: "BUG_PLUS_1",
          placements: [{ cell: triCell, digit: d }],
          eliminations: [],
          primary: [{ cell: triCell, digit: d }],
          units: CELL_UNITS[triCell].map((unit) => ({ unit, role: "secondary" })),
          labels: {
            primary: tr`the one cell with three candidates; ${d} is the extra`,
            secondary: tr`its row, column and box, each holding ${d} three times`
          },
          description: tr`BUG+1: removing ${d} from ${cellName(triCell)} would leave a bivalue grid with two solutions, so ${cellName(triCell)} must be ${d}.`
        };
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/als.ts
  function collectAls(g, maxSize = 4, cap = 600) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const unit of UNITS) {
      const empty = unit.filter((c) => g.values[c] === 0);
      for (let size = 1; size <= Math.min(maxSize, empty.length); size++) {
        for (const combo of combinations(empty, size)) {
          let mask = 0;
          for (const c of combo) mask |= g.cands[c];
          if (popcount(mask) !== size + 1) continue;
          const key = combo.join(",");
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ cells: combo, mask });
          if (out.length >= cap) return out;
        }
      }
    }
    return out;
  }
  function restrictedCommon(g, A, B, x) {
    const ax = A.cells.filter((c) => g.cands[c] & bit(x));
    const bx = B.cells.filter((c) => g.cands[c] & bit(x));
    if (!ax.length || !bx.length) return false;
    return ax.every((a) => bx.every((b) => sees(a, b)));
  }
  function alsXzStep(g, A, B, x, z, tech) {
    const zCells = [
      ...A.cells.filter((c) => g.cands[c] & bit(z)),
      ...B.cells.filter((c) => g.cands[c] & bit(z))
    ];
    const elims = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0) continue;
      if (A.cells.includes(c) || B.cells.includes(c)) continue;
      if (!(g.cands[c] & bit(z))) continue;
      if (zCells.every((zc) => sees(c, zc))) elims.push({ cell: c, digit: z });
    }
    if (!elims.length) return null;
    if (tech === "WXYZ_WING") return wxyzStep(g, A, B, x, z, elims);
    return {
      tech,
      placements: [],
      eliminations: elims,
      primary: allCands(g, A.cells),
      secondary: allCands(g, B.cells),
      labels: {
        primary: tr`set A: one digit short of locked; ${x} is its restricted common with set B`,
        secondary: tr`set B: whichever set loses ${x} locks and places ${z}`
      },
      // the restricted common: every x of one set sees every x of the other
      links: [
        {
          from: A.cells.filter((c) => g.cands[c] & bit(x)).map((cell) => ({ cell, digit: x })),
          to: B.cells.filter((c) => g.cands[c] & bit(x)).map((cell) => ({ cell, digit: x })),
          strong: false
        }
      ],
      description: tr`ALS-XZ: sets ${cellNames(A.cells)} and ${cellNames(B.cells)} share restricted common ${x}; digit ${z} can be removed from cells seeing every ${z} of both sets.`
    };
  }
  var allCands = (g, cells) => cells.flatMap((cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit })));
  function wxyzStep(g, A, B, x, z, elims) {
    const [linked] = (A.cells.length === 1 ? A : B).cells;
    const set = A.cells.length === 1 ? B : A;
    const seen = set.cells.filter((c) => g.cands[c] & bit(x));
    const rest = set.cells.filter((c) => !(g.cands[c] & bit(x)));
    const unit = unitName(UNITS.findIndex((u) => set.cells.every((c) => u.includes(c))));
    const three = [...set.cells].sort((a, b) => a - b).map(cellName);
    const others = digitsOf(set.mask & ~bit(x)).map(String);
    const name = cellName(linked);
    return {
      tech: "WXYZ_WING",
      placements: [],
      eliminations: elims,
      primary: allCands(g, seen),
      secondary: allCands(g, rest),
      fins: allCands(g, [linked]),
      labels: {
        primary: seen.length === 1 ? tr`cell whose ${x} the bivalue cell sees` : tr`cells whose ${x} the bivalue cell sees`,
        ...rest.length > 0 && { secondary: rest.length === 1 ? tr`other cell of the three` : tr`other cells of the three` },
        fins: tr`bivalue cell`
      },
      description: tr`WXYZ-Wing: bivalue cell ${name} (${digitsOf(g.cands[linked]).join("")}) and the three cells ${listAnd(three)} in ${unit}, which hold ${digitsOf(set.mask).join("")} between them. The ${x} in ${name} sees every ${x} in the three cells. Either ${name} is ${z}, or it is ${x} and the three cells in ${unit} must be ${listAnd(others)}. At least one of the four cells is therefore ${z}, so ${z} is removed from every other cell that sees all the ${z}s among them.`
    };
  }
  function findAlsXzPairs(g, accept, tech) {
    const alses = collectAls(g);
    for (let i = 0; i < alses.length; i++) {
      for (let j = i + 1; j < alses.length; j++) {
        const A = alses[i];
        const B = alses[j];
        if (!accept(A, B)) continue;
        if (A.cells.some((c) => B.cells.includes(c))) continue;
        const common = A.mask & B.mask;
        if (popcount(common) < 2) continue;
        for (const x of digitsOf(common)) {
          if (!restrictedCommon(g, A, B, x)) continue;
          for (const z of digitsOf(common)) {
            if (z === x) continue;
            const step = alsXzStep(g, A, B, x, z, tech);
            if (step) return step;
          }
        }
      }
    }
    return null;
  }
  function findWxyzWing(g) {
    return findAlsXzPairs(
      g,
      (A, B) => Math.min(A.cells.length, B.cells.length) === 1 && Math.max(A.cells.length, B.cells.length) === 3 && popcount(A.mask | B.mask) === 4,
      "WXYZ_WING"
    );
  }
  function findAlsXz(g) {
    return findAlsXzPairs(g, () => true, "ALS_XZ");
  }
  function buildAlsLinks(g, alses) {
    const byAls = /* @__PURE__ */ new Map();
    for (let i = 0; i < alses.length; i++) {
      for (let j = i + 1; j < alses.length; j++) {
        const A = alses[i];
        const B = alses[j];
        if (A.cells.some((c) => B.cells.includes(c))) continue;
        for (const x of digitsOf(A.mask & B.mask)) {
          if (!restrictedCommon(g, A, B, x)) continue;
          const link = { a: i, b: j, x };
          for (const k of [i, j]) {
            if (!byAls.has(k)) byAls.set(k, []);
            byAls.get(k).push(link);
          }
        }
      }
    }
    return byAls;
  }
  function findAlsXyWing(g) {
    const alses = collectAls(g, 4, 400);
    const byAls = buildAlsLinks(g, alses);
    for (const [hinge, hingeLinks] of byAls) {
      for (let li = 0; li < hingeLinks.length; li++) {
        for (let lj = li + 1; lj < hingeLinks.length; lj++) {
          const l1 = hingeLinks[li];
          const l2 = hingeLinks[lj];
          if (l1.x === l2.x) continue;
          const ai = l1.a === hinge ? l1.b : l1.a;
          const bi = l2.a === hinge ? l2.b : l2.a;
          if (ai === bi || ai === hinge || bi === hinge) continue;
          const A = alses[ai];
          const B = alses[bi];
          const C = alses[hinge];
          if (A.cells.some((c) => B.cells.includes(c))) continue;
          const zMask = A.mask & B.mask & ~bit(l1.x) & ~bit(l2.x);
          for (const z of digitsOf(zMask)) {
            const zCells = [
              ...A.cells.filter((c) => g.cands[c] & bit(z)),
              ...B.cells.filter((c) => g.cands[c] & bit(z))
            ];
            const inPattern = /* @__PURE__ */ new Set([...A.cells, ...B.cells, ...C.cells]);
            const elims = [];
            for (let c = 0; c < 81; c++) {
              if (g.values[c] !== 0 || inPattern.has(c)) continue;
              if (!(g.cands[c] & bit(z))) continue;
              if (zCells.every((zc) => sees(c, zc))) elims.push({ cell: c, digit: z });
            }
            if (!elims.length) continue;
            return {
              tech: "ALS_XY_WING",
              placements: [],
              eliminations: elims,
              primary: A.cells.flatMap(
                (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
              ),
              secondary: B.cells.flatMap(
                (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
              ),
              fins: C.cells.flatMap(
                (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
              ),
              labels: { primary: tr`set linked via ${l1.x}`, secondary: tr`set linked via ${l2.x}`, fins: tr`hinge` },
              links: [
                {
                  from: A.cells.filter((c) => g.cands[c] & bit(l1.x)).map((cell) => ({ cell, digit: l1.x })),
                  to: C.cells.filter((c) => g.cands[c] & bit(l1.x)).map((cell) => ({ cell, digit: l1.x })),
                  strong: false
                },
                {
                  from: C.cells.filter((c) => g.cands[c] & bit(l2.x)).map((cell) => ({ cell, digit: l2.x })),
                  to: B.cells.filter((c) => g.cands[c] & bit(l2.x)).map((cell) => ({ cell, digit: l2.x })),
                  strong: false
                }
              ],
              description: tr`ALS-XY-Wing: hinge ${cellNames(C.cells)} links ${cellNames(A.cells)} (via ${l1.x}) and ${cellNames(B.cells)} (via ${l2.x}); digit ${z} can be removed from cells seeing every ${z} of both outer sets.`
            };
          }
        }
      }
    }
    return null;
  }
  function findAlsXyChain(g) {
    const alses = collectAls(g, 4, 300);
    const byAls = buildAlsLinks(g, alses);
    let budget = 2e4;
    for (const [bIdx, bLinks] of byAls) {
      for (const l1 of bLinks) {
        const aIdx = l1.a === bIdx ? l1.b : l1.a;
        for (const l2 of bLinks) {
          if (l2 === l1 || l2.x === l1.x) continue;
          const cIdx = l2.a === bIdx ? l2.b : l2.a;
          if (cIdx === aIdx) continue;
          const cLinks = byAls.get(cIdx) ?? [];
          for (const l3 of cLinks) {
            if (budget-- <= 0) return null;
            if (l3.x === l2.x) continue;
            const dIdx = l3.a === cIdx ? l3.b : l3.a;
            if (dIdx === aIdx || dIdx === bIdx || dIdx === cIdx) continue;
            if (l3.a !== cIdx && l3.b !== cIdx) continue;
            const A = alses[aIdx];
            const B = alses[bIdx];
            const C = alses[cIdx];
            const D = alses[dIdx];
            const zMask = A.mask & D.mask & ~bit(l1.x) & ~bit(l3.x);
            for (const z of digitsOf(zMask)) {
              const zCells = [
                ...A.cells.filter((c) => g.cands[c] & bit(z)),
                ...D.cells.filter((c) => g.cands[c] & bit(z))
              ];
              const inPattern = /* @__PURE__ */ new Set([...A.cells, ...B.cells, ...C.cells, ...D.cells]);
              const elims = [];
              for (let c = 0; c < 81; c++) {
                if (g.values[c] !== 0 || inPattern.has(c)) continue;
                if (!(g.cands[c] & bit(z))) continue;
                if (zCells.every((zc) => sees(c, zc))) elims.push({ cell: c, digit: z });
              }
              if (!elims.length) continue;
              return {
                tech: "ALS_XY_CHAIN",
                placements: [],
                eliminations: elims,
                primary: [...A.cells, ...D.cells].flatMap(
                  (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
                ),
                secondary: [...B.cells, ...C.cells].flatMap(
                  (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
                ),
                labels: {
                  primary: tr`the end sets, which both hold ${z}`,
                  secondary: tr`the middle sets, each linked to its neighbours by a restricted common digit`
                },
                links: [
                  [A, B, l1.x],
                  [B, C, l2.x],
                  [C, D, l3.x]
                ].map(([P, Q, x]) => ({
                  from: P.cells.filter((c) => g.cands[c] & bit(x)).map((cell) => ({ cell, digit: x })),
                  to: Q.cells.filter((c) => g.cands[c] & bit(x)).map((cell) => ({ cell, digit: x })),
                  strong: false
                })),
                description: tr`ALS-XY-Chain: ${cellNames(A.cells)} –${l1.x}– ${cellNames(B.cells)} –${l2.x}– ${cellNames(C.cells)} –${l3.x}– ${cellNames(D.cells)}; digit ${z} falls from cells seeing every ${z} of both end sets.`
              };
            }
          }
        }
      }
    }
    return null;
  }
  function findDeathBlossom(g) {
    const alses = collectAls(g);
    for (let stem = 0; stem < 81; stem++) {
      if (g.values[stem] !== 0) continue;
      const stemDigits = digitsOf(g.cands[stem]);
      if (stemDigits.length < 2 || stemDigits.length > 3) continue;
      const petals = stemDigits.map(
        (p) => alses.filter(
          (A) => !A.cells.includes(stem) && A.mask & bit(p) && A.cells.filter((c) => g.cands[c] & bit(p)).every((c) => sees(c, stem))
        ).slice(0, 16)
      );
      if (petals.some((list) => list.length === 0)) continue;
      const pick = (idx, chosen) => {
        if (idx === stemDigits.length) {
          let common = 511 & ~g.cands[stem];
          for (const A of chosen) common &= A.mask;
          for (const z of digitsOf(common)) {
            const zCells = chosen.flatMap(
              (A) => A.cells.filter((c) => g.cands[c] & bit(z))
            );
            if (!zCells.length) continue;
            const inPattern = /* @__PURE__ */ new Set([stem, ...chosen.flatMap((A) => A.cells)]);
            const elims = [];
            for (let c = 0; c < 81; c++) {
              if (g.values[c] !== 0 || inPattern.has(c)) continue;
              if (!(g.cands[c] & bit(z))) continue;
              if (zCells.every((zc) => sees(c, zc))) elims.push({ cell: c, digit: z });
            }
            if (elims.length) {
              return {
                tech: "DEATH_BLOSSOM",
                placements: [],
                eliminations: elims,
                primary: digitsOf(g.cands[stem]).map((digit) => ({ cell: stem, digit })),
                secondary: chosen.flatMap(
                  (A) => A.cells.flatMap(
                    (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
                  )
                ),
                labels: {
                  primary: tr`the stem: each of its candidates leads to a petal`,
                  secondary: tr`the petals: one set per stem digit, all holding ${z}`
                },
                // each stem digit reaches the petal that holds it
                links: stemDigits.map((p, i) => ({
                  from: [{ cell: stem, digit: p }],
                  to: chosen[i].cells.filter((c) => g.cands[c] & bit(p)).map((cell) => ({ cell, digit: p })),
                  strong: false
                })),
                description: tr`Death Blossom: stem ${cellName(stem)} links each of its candidates to a petal set; whichever digit the stem takes, some petal locks and places ${z}, so ${z} is removed from cells seeing every ${z} of all petals.`
              };
            }
          }
          return null;
        }
        for (const A of petals[idx]) {
          if (chosen.some((B) => B.cells.some((c) => A.cells.includes(c)))) continue;
          const res = pick(idx + 1, [...chosen, A]);
          if (res) return res;
        }
        return null;
      };
      const step = pick(0, []);
      if (step) return step;
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/complexFish.ts
  function findFrankenFish(g, size) {
    const tech = size === 2 ? "FRANKEN_X_WING" : "FRANKEN_SWORDFISH";
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const unitCells = UNITS.map(
        (u) => u.filter((c) => g.values[c] === 0 && g.cands[c] & mask)
      );
      for (const rowsAsBase of [true, false]) {
        const baseUnits = [
          ...rowsAsBase ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 13, 14, 15, 16, 17],
          ...[18, 19, 20, 21, 22, 23, 24, 25, 26]
        ].filter((u) => unitCells[u].length >= 2);
        const coverUnits = [
          ...rowsAsBase ? [9, 10, 11, 12, 13, 14, 15, 16, 17] : [0, 1, 2, 3, 4, 5, 6, 7, 8],
          ...[18, 19, 20, 21, 22, 23, 24, 25, 26]
        ].filter((u) => unitCells[u].length >= 1);
        for (const base of combinations(baseUnits, size)) {
          const baseCells = /* @__PURE__ */ new Set();
          let disjoint = true;
          for (const u of base) {
            for (const c of unitCells[u]) {
              if (baseCells.has(c)) {
                disjoint = false;
                break;
              }
              baseCells.add(c);
            }
            if (!disjoint) break;
          }
          if (!disjoint) continue;
          const relevant = coverUnits.filter(
            (u) => !base.includes(u) && unitCells[u].some((c) => baseCells.has(c))
          );
          if (relevant.length < size) continue;
          for (const cover of combinations(relevant, size)) {
            const coverCells = /* @__PURE__ */ new Set();
            let ok = true;
            for (const u of cover) {
              for (const c of unitCells[u]) {
                if (coverCells.has(c)) {
                  ok = false;
                  break;
                }
                coverCells.add(c);
              }
              if (!ok) break;
            }
            if (!ok) continue;
            if (![...baseCells].every((c) => coverCells.has(c))) continue;
            if (![...base, ...cover].some((u) => u >= 18)) continue;
            const elims = [];
            for (const c of coverCells) {
              if (!baseCells.has(c)) elims.push({ cell: c, digit: d });
            }
            if (!elims.length) continue;
            const name = size === 2 ? tr`Franken X-Wing` : tr`Franken Swordfish`;
            return {
              tech,
              placements: [],
              eliminations: elims,
              primary: [...baseCells].map((cell) => ({ cell, digit: d })),
              units: [
                ...base.map((unit) => ({ unit, role: "primary" })),
                ...cover.map((unit) => ({ unit, role: "secondary" }))
              ],
              labels: {
                primary: tr`base sets (${base.map(unitName).join(", ")}): the ${d}s of the fish`,
                secondary: tr`cover sets (${cover.map(unitName).join(", ")}): where the base's ${d}s must land`
              },
              description: tr`${name}: digit ${d}'s candidates in ${base.map(unitName).join(" + ")} are confined to ${cover.map(unitName).join(" + ")}; the ${size} true cells use up the covers, so ${d} falls from ${cellNames(elims.map((e) => e.cell))}.`
            };
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/ape.ts
  function findAlignedPairExclusion(g) {
    const alses = collectAls(g, 4, 400);
    const peerSets = PEERS.map((p) => new Set(p));
    for (let a = 0; a < 81; a++) {
      if (g.values[a] !== 0) continue;
      for (const b of PEERS[a]) {
        if (b <= a || g.values[b] !== 0) continue;
        const shared = alses.filter(
          (S) => !S.cells.includes(a) && !S.cells.includes(b) && S.cells.every((c) => peerSets[a].has(c) && peerSets[b].has(c))
        );
        if (!shared.length) continue;
        const dsA = digitsOf(g.cands[a]);
        const dsB = digitsOf(g.cands[b]);
        const validA = /* @__PURE__ */ new Set();
        const validB = /* @__PURE__ */ new Set();
        let killers = [];
        for (const da of dsA) {
          for (const db of dsB) {
            if (da === db) continue;
            const both = bit(da) | bit(db);
            const killer = shared.find((S) => (S.mask & both) === both);
            if (killer) {
              if (!killers.includes(killer)) killers.push(killer);
              continue;
            }
            validA.add(da);
            validB.add(db);
          }
        }
        const elims = [];
        for (const da of dsA) if (!validA.has(da)) elims.push({ cell: a, digit: da });
        for (const db of dsB) if (!validB.has(db)) elims.push({ cell: b, digit: db });
        if (!elims.length) continue;
        return {
          tech: "ALIGNED_PAIR_EXCLUSION",
          placements: [],
          eliminations: elims,
          primary: [
            ...dsA.map((digit) => ({ cell: a, digit })),
            ...dsB.map((digit) => ({ cell: b, digit }))
          ],
          secondary: killers.flatMap(
            (S) => S.cells.flatMap((cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit })))
          ),
          labels: {
            primary: tr`the aligned pair`,
            secondary: tr`the almost locked sets both cells see, which rule out pairings`
          },
          description: elims.length > 1 ? tr`Aligned Pair Exclusion: every candidate pairing of ${cellName(a)} and ${cellName(b)} that survives the sets they both see leaves no place for the removed candidates.` : tr`Aligned Pair Exclusion: every candidate pairing of ${cellName(a)} and ${cellName(b)} that survives the sets they both see leaves no place for the removed candidate.`
        };
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/templates.ts
  function digitTemplates(g, d, cap = 2e4) {
    const mask = bit(d);
    const rowChoices = [];
    for (let r = 0; r < 9; r++) {
      const cells = [];
      for (let c = 0; c < 9; c++) {
        const i = r * 9 + c;
        if (g.values[i] === d) {
          cells.length = 0;
          cells.push(i);
          break;
        }
        if (g.values[i] === 0 && g.cands[i] & mask) cells.push(i);
      }
      if (cells.length === 0) return [];
      rowChoices.push(cells);
    }
    const out = [];
    let overflow = false;
    const current = [];
    const rec = (row, colMask, boxMask) => {
      if (overflow) return;
      if (row === 9) {
        out.push([...current]);
        if (out.length > cap) overflow = true;
        return;
      }
      for (const cell of rowChoices[row]) {
        const cb = 1 << cell % 9;
        const bb = 1 << boxOf(cell);
        if (colMask & cb || boxMask & bb) continue;
        current.push(cell);
        rec(row + 1, colMask | cb, boxMask | bb);
        current.pop();
        if (overflow) return;
      }
    };
    rec(0, 0, 0);
    return overflow ? null : out;
  }
  function findPatternOverlay(g, maxTemplates = 2e4) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const rowChoices = [];
      let solvedCount = 0;
      for (let r = 0; r < 9; r++) {
        const cells = [];
        for (let c = 0; c < 9; c++) {
          const i = r * 9 + c;
          if (g.values[i] === d) {
            cells.length = 0;
            cells.push(i);
            solvedCount++;
            break;
          }
          if (g.values[i] === 0 && g.cands[i] & mask) cells.push(i);
        }
        rowChoices.push(cells);
      }
      if (solvedCount === 9) continue;
      if (rowChoices.some((cells) => cells.length === 0)) continue;
      const inAll = new Uint8Array(81).fill(1);
      const inAny = new Uint8Array(81);
      let count = 0;
      let overflow = false;
      const current = [];
      const rec = (row, colMask, boxMask) => {
        if (overflow) return;
        if (row === 9) {
          count++;
          if (count > maxTemplates) {
            overflow = true;
            return;
          }
          const used = new Uint8Array(81);
          for (const c of current) used[c] = 1;
          for (let i = 0; i < 81; i++) {
            if (used[i]) inAny[i] = 1;
            else inAll[i] = 0;
          }
          return;
        }
        for (const cell of rowChoices[row]) {
          const cb = 1 << cell % 9;
          const bb = 1 << boxOf(cell);
          if (colMask & cb || boxMask & bb) continue;
          current.push(cell);
          rec(row + 1, colMask | cb, boxMask | bb);
          current.pop();
          if (overflow) return;
        }
      };
      rec(0, 0, 0);
      if (overflow || count === 0) continue;
      const elims = [];
      const places = [];
      for (let i = 0; i < 81; i++) {
        if (g.values[i] !== 0) continue;
        const isCand = (g.cands[i] & mask) !== 0;
        if (isCand && !inAny[i]) elims.push({ cell: i, digit: d });
        else if (isCand && inAll[i]) places.push({ cell: i, digit: d });
      }
      if (!elims.length && !places.length) continue;
      return {
        tech: "PATTERN_OVERLAY",
        placements: places,
        eliminations: elims,
        primary: places.length ? places : elims,
        labels: {
          primary: places.length ? tr`cells every complete placement of ${d} uses` : tr`cells no complete placement of ${d} uses`
        },
        // a single complete placement (which always places) is a sentence of
        // its own; with none placed there are always at least two
        description: places.length ? count === 1 ? tr`Pattern Overlay: the only complete placement possible for digit ${d} uses ${places.map((p) => cellName(p.cell)).join(", ")}.` : tr`Pattern Overlay: of the ${count} complete placements possible for digit ${d}, every one uses ${places.map((p) => cellName(p.cell)).join(", ")}.` : tr`Pattern Overlay: of the ${count} complete placements possible for digit ${d}, none uses ${elims.map((e) => cellName(e.cell)).join(", ")}.`
      };
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/exocet.ts
  function collectExocets(g, needElims) {
    const out = [];
    const templateCache = /* @__PURE__ */ new Map();
    const templatesOf = (d) => {
      if (!templateCache.has(d)) templateCache.set(d, digitTemplates(g, d, 2e4));
      return templateCache.get(d);
    };
    for (const rows of [true, false]) {
      const cellAt2 = (line, cross) => rows ? line * 9 + cross : cross * 9 + line;
      for (let band = 0; band < 3; band++) {
        const lines = [band * 3, band * 3 + 1, band * 3 + 2];
        for (const baseLine of lines) {
          for (let baseBoxSlot = 0; baseBoxSlot < 3; baseBoxSlot++) {
            const mini = [0, 1, 2].map((k) => cellAt2(baseLine, baseBoxSlot * 3 + k));
            for (let skip = 0; skip < 3; skip++) {
              const B1 = mini[(skip + 1) % 3];
              const B2 = mini[(skip + 2) % 3];
              if (g.values[B1] !== 0 || g.values[B2] !== 0) continue;
              if (popcount(g.cands[B1]) < 2 || popcount(g.cands[B2]) < 2) continue;
              const S = g.cands[B1] | g.cands[B2];
              if (popcount(S) < 3 || popcount(S) > 4) continue;
              const otherLines = lines.filter((l) => l !== baseLine);
              const otherSlots = [0, 1, 2].filter((s) => s !== baseBoxSlot);
              for (const [slotA, slotB] of [
                [otherSlots[0], otherSlots[1]],
                [otherSlots[1], otherSlots[0]]
              ]) {
                for (const lineA of otherLines) {
                  const lineB = otherLines.find((l) => l !== lineA);
                  for (let ka = 0; ka < 3; ka++) {
                    const T1 = cellAt2(lineA, slotA * 3 + ka);
                    if (g.values[T1] !== 0 || !(g.cands[T1] & S)) continue;
                    for (let kb = 0; kb < 3; kb++) {
                      const T2 = cellAt2(lineB, slotB * 3 + kb);
                      if (g.values[T2] !== 0 || !(g.cands[T2] & S)) continue;
                      if (needElims) {
                        const nonBaseInTargets = (g.cands[T1] & ~S) !== 0 || (g.cands[T2] & ~S) !== 0;
                        const deadBase = digitsOf(S).some(
                          (d) => !((g.cands[T1] | g.cands[T2]) & bit(d))
                        );
                        if (!nonBaseInTargets && !deadBase) continue;
                      }
                      let proven = true;
                      for (const d of digitsOf(S)) {
                        const templates = templatesOf(d);
                        if (templates === null) {
                          proven = false;
                          break;
                        }
                        for (const t2 of templates) {
                          const throughBase = t2.includes(B1) || t2.includes(B2);
                          if (throughBase && !t2.includes(T1) && !t2.includes(T2)) {
                            proven = false;
                            break;
                          }
                        }
                        if (!proven) break;
                      }
                      if (!proven) continue;
                      out.push({
                        rows,
                        line: baseLine,
                        boxSlot: baseBoxSlot,
                        S,
                        base: [B1, B2],
                        targets: [T1, T2]
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return out;
  }
  function findExocet(g) {
    for (const ex of collectExocets(g, true)) {
      const { S, base, targets } = ex;
      const elims = [];
      for (const T of targets) {
        for (const d of digitsOf(g.cands[T] & ~S)) elims.push({ cell: T, digit: d });
      }
      for (const d of digitsOf(S)) {
        if ((g.cands[targets[0]] | g.cands[targets[1]]) & bit(d)) continue;
        for (const B of base) {
          if (g.cands[B] & bit(d)) elims.push({ cell: B, digit: d });
        }
      }
      if (!elims.length) continue;
      return {
        tech: "EXOCET",
        placements: [],
        eliminations: elims,
        primary: base.flatMap(
          (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
        ),
        secondary: targets.flatMap(
          (cell) => digitsOf(g.cands[cell] & S).map((digit) => ({ cell, digit }))
        ),
        labels: {
          primary: tr`the base cells, holding ${digitsOf(S).join("")}`,
          secondary: tr`the target cells: the base digits must land here`
        },
        description: tr`Exocet: base ${cellNames(base)} (${digitsOf(S).join("")}) with targets ${cellName(targets[0])} and ${cellName(targets[1])}: a complete placement analysis proves the base digits must land in the targets, so the targets keep only base candidates.`
      };
    }
    return null;
  }
  function findDoubleExocet(g) {
    const all = collectExocets(g, false);
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (a.rows !== b.rows || a.line !== b.line) continue;
        if (a.boxSlot === b.boxSlot) continue;
        if (a.S !== b.S || popcount(a.S) !== 4) continue;
        const baseCells = /* @__PURE__ */ new Set([...a.base, ...b.base]);
        if (baseCells.size !== 4) continue;
        const lineCells = a.rows ? [0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => a.line * 9 + c) : [0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => r * 9 + a.line);
        const elims = [];
        for (const c of lineCells) {
          if (baseCells.has(c) || g.values[c] !== 0) continue;
          for (const d of digitsOf(g.cands[c] & a.S)) elims.push({ cell: c, digit: d });
        }
        if (!elims.length) continue;
        return {
          tech: "DOUBLE_EXOCET",
          placements: [],
          eliminations: elims,
          primary: [...baseCells].flatMap(
            (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
          ),
          secondary: [...a.targets, ...b.targets].flatMap(
            (cell) => digitsOf(g.cands[cell] & a.S).map((digit) => ({ cell, digit }))
          ),
          description: tr`Double Exocet: two proven exocets on the same line share the base set ${digitsOf(a.S).join("")}: the four base cells ${cellNames([...baseCells])} must hold exactly those four digits, so they fall from the rest of the line.`
        };
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/forcingTrail.ts
  function propagateWithTrail(start, cell, digit, on) {
    const g = cloneGrid(start);
    const removedBy = new Int16Array(729).fill(-1);
    const placedBy = new Int16Array(81).fill(-1);
    const steps = [{ cell, digit, because: [] }];
    const place = (c, d, index) => {
      for (const e of digitsOf(g.cands[c])) if (e !== d) removedBy[c * 9 + e - 1] = index;
      const b = bit(d);
      for (const p of PEERS[c]) if (g.values[p] === 0 && g.cands[p] & b) removedBy[p * 9 + d - 1] = index;
      g.values[c] = d;
      g.cands[c] = 0;
      for (const p of PEERS[c]) g.cands[p] &= ~b;
      placedBy[c] = index;
    };
    const uniq = (xs) => [...new Set(xs.filter((x) => x >= 0))].sort((a, b) => a - b);
    if (on) place(cell, digit, 0);
    else {
      g.cands[cell] &= ~bit(digit);
      removedBy[cell * 9 + digit - 1] = 0;
    }
    const done = (broken) => ({ steps, broken, grid: g, removedBy, placedBy });
    for (let guard = 0; guard < 81; guard++) {
      let placed = false;
      for (let i = 0; i < 81; i++) {
        if (g.values[i] !== 0) continue;
        const n = popcount(g.cands[i]);
        if (n === 0) {
          const because = uniq(digitsOf(start.cands[i]).map((e) => removedBy[i * 9 + e - 1]));
          return done({ kind: "cell", cell: i, because });
        }
        if (n === 1) {
          const d = digitsOf(g.cands[i])[0];
          const because = uniq(digitsOf(start.cands[i]).filter((e) => e !== d).map((e) => removedBy[i * 9 + e - 1]));
          steps.push({ cell: i, digit: d, because, how: "naked" });
          place(i, d, steps.length - 1);
          placed = true;
        }
      }
      for (let u = 0; u < 27; u++) {
        const unit = UNITS[u];
        for (let d = 1; d <= 9; d++) {
          const b = bit(d);
          let pos = -1;
          let count = 0;
          let solved = false;
          for (const c of unit) {
            if (g.values[c] === d) {
              solved = true;
              break;
            }
            if (g.values[c] === 0 && g.cands[c] & b) {
              pos = c;
              count++;
            }
          }
          if (solved) continue;
          const lost = () => uniq(
            unit.filter((c) => c !== pos && start.values[c] === 0 && start.cands[c] & b).map((c) => removedBy[c * 9 + d - 1])
          );
          if (count === 0) return done({ kind: "unit", unit: u, digit: d, because: lost() });
          if (count === 1) {
            steps.push({ cell: pos, digit: d, because: lost(), how: "hidden", unit: u });
            place(pos, d, steps.length - 1);
            placed = true;
          }
        }
      }
      if (!placed) return done(null);
    }
    return done(null);
  }
  function spine(trail, last) {
    const path = [];
    let i = last;
    while (i >= 0 && !path.includes(i)) {
      path.push(i);
      const because = trail.steps[i].because;
      i = because.length ? Math.max(...because) : -1;
    }
    return path.reverse();
  }
  var latest = (because) => because.length ? Math.max(...because) : 0;
  function linkText(from, to, off) {
    const a = cellName(from.cell);
    const b = cellName(to.cell);
    if (to.how === "hidden") {
      const u = unitName(to.unit);
      return off ? tr`If ${a} is not ${from.digit}, then ${b} must be ${to.digit}: the only place left for ${to.digit} in ${u}.` : tr`${a} = ${from.digit}, then ${b} must be ${to.digit}: the only place left for ${to.digit} in ${u}.`;
    }
    return off ? tr`If ${a} is not ${from.digit}, then ${b} must be ${to.digit}: the only candidate left in ${b}.` : tr`${a} = ${from.digit}, then ${b} must be ${to.digit}: the only candidate left in ${b}.`;
  }
  var node = (s) => ({ cell: s.cell, digit: s.digit });
  function alreadyLinkText(s, to) {
    const a = cellName(s.cell);
    const b = cellName(to.cell);
    if (s.how === "hidden") {
      const su = unitName(s.unit);
      if (to.how === "hidden") {
        const u = unitName(to.unit);
        return tr`In ${su}, ${s.digit} already fits only in ${a}, so ${b} must be ${to.digit}: the only place left for ${to.digit} in ${u}.`;
      }
      return tr`In ${su}, ${s.digit} already fits only in ${a}, so ${b} must be ${to.digit}: the only candidate left in ${b}.`;
    }
    if (to.how === "hidden") {
      const u = unitName(to.unit);
      return tr`${a} already has only one candidate, ${s.digit}, so ${b} must be ${to.digit}: the only place left for ${to.digit} in ${u}.`;
    }
    return tr`${a} already has only one candidate, ${s.digit}, so ${b} must be ${to.digit}: the only candidate left in ${b}.`;
  }
  function opening(trail, start, on, fromAssumption, fromSingle) {
    if (start === 0) return fromAssumption();
    const a = trail.steps[0];
    const x = cellName(a.cell);
    const assume = on ? tr`Assume ${x} = ${a.digit}.` : tr`Assume ${x} is not ${a.digit}.`;
    return `${assume} ${fromSingle(trail.steps[start])}`;
  }
  function spineLinks(trail, path, on) {
    const links = [];
    for (let k = 1; k < path.length; k++) {
      const from = trail.steps[path[k - 1]];
      const to = trail.steps[path[k]];
      links.push({
        from: [node(from)],
        to: [node(to)],
        strong: true,
        text: k === 1 ? opening(trail, path[0], on, () => linkText(from, to, !on), (s) => alreadyLinkText(s, to)) : linkText(from, to, false)
      });
    }
    return links;
  }
  function brokenCells(g, broken) {
    if (broken.kind === "cell") return digitsOf(g.cands[broken.cell]).map((digit) => ({ cell: broken.cell, digit }));
    return UNITS[broken.unit].filter((c) => g.values[c] === 0 && g.cands[c] & bit(broken.digit)).map((cell) => ({ cell, digit: broken.digit }));
  }
  function brokenText(broken, from, off) {
    const a = cellName(from.cell);
    if (broken.kind === "cell") {
      const c = cellName(broken.cell);
      return off ? tr`If ${a} is not ${from.digit}, then ${c} would have no candidate left: a contradiction.` : tr`${a} = ${from.digit}, then ${c} would have no candidate left: a contradiction.`;
    }
    const u = unitName(broken.unit);
    return off ? tr`If ${a} is not ${from.digit}, then ${u} would have no place left for ${broken.digit}: a contradiction.` : tr`${a} = ${from.digit}, then ${u} would have no place left for ${broken.digit}: a contradiction.`;
  }
  function alreadyBrokenText(broken, s) {
    const a = cellName(s.cell);
    if (s.how === "hidden") {
      const su = unitName(s.unit);
      return broken.kind === "cell" ? tr`In ${su}, ${s.digit} already fits only in ${a}, so ${cellName(broken.cell)} would have no candidate left: a contradiction.` : tr`In ${su}, ${s.digit} already fits only in ${a}, so ${unitName(broken.unit)} would have no place left for ${broken.digit}: a contradiction.`;
    }
    return broken.kind === "cell" ? tr`${a} already has only one candidate, ${s.digit}, so ${cellName(broken.cell)} would have no candidate left: a contradiction.` : tr`${a} already has only one candidate, ${s.digit}, so ${unitName(broken.unit)} would have no place left for ${broken.digit}: a contradiction.`;
  }
  function contradictionDrawing(g, cell, digit, on) {
    const trail = propagateWithTrail(g, cell, digit, on);
    if (!trail.broken) return null;
    const path = spine(trail, latest(trail.broken.because));
    const links = spineLinks(trail, path, on);
    const last = trail.steps[path[path.length - 1]];
    const broken = trail.broken;
    const fins = brokenCells(g, broken);
    if (fins.length) {
      links.push({
        from: [node(last)],
        to: fins,
        strong: false,
        // with no forced single before it, this link opens the line
        text: path.length === 1 ? opening(trail, path[0], on, () => brokenText(broken, node(last), !on), (s) => alreadyBrokenText(broken, s)) : brokenText(broken, node(last), false)
      });
    }
    return { links, fins, unit: trail.broken.kind === "unit" ? trail.broken.unit : void 0 };
  }
  function conclusionDrawing(g, cell, digit, on, conclusion) {
    const trail = propagateWithTrail(g, cell, digit, on);
    if (conclusion.place) {
      const k2 = trail.placedBy[conclusion.place.cell];
      if (k2 < 0) return [];
      return spineLinks(trail, spine(trail, k2), on);
    }
    const { cell: c, digit: e } = conclusion.elim;
    const k = trail.removedBy[c * 9 + e - 1];
    if (k < 0) return [];
    const path = spine(trail, k);
    const links = spineLinks(trail, path, on);
    const last = trail.steps[k];
    const placed = () => tr`${cellName(last.cell)} = ${last.digit}, so ${e} is removed from ${cellName(c)}.`;
    links.push({
      from: [node(last)],
      to: [{ cell: c, digit: e }],
      strong: false,
      // with no forced single before it, this link opens the line
      text: path.length === 1 ? opening(
        trail,
        k,
        on,
        () => on ? placed() : tr`If ${cellName(cell)} is not ${digit}, so ${e} is removed from ${cellName(c)}.`,
        (s) => alreadyElimText(s, e, c)
      ) : placed()
    });
    return links;
  }
  function alreadyElimText(s, e, c) {
    const a = cellName(s.cell);
    return s.how === "hidden" ? tr`In ${unitName(s.unit)}, ${s.digit} already fits only in ${a}, so ${e} is removed from ${cellName(c)}.` : tr`${a} already has only one candidate, ${s.digit}, so ${e} is removed from ${cellName(c)}.`;
  }

  // vendor/sudokui/engine/techniques/forcing.ts
  var forcingLabels = () => ({
    primary: tr`the assumption and the singles it forces: one line of the reasoning, read along the arrows`,
    secondary: tr`the house that would be left with no place for a digit`,
    fins: tr`where the board would break`
  });
  function propagate(g) {
    for (let guard = 0; guard < 81; guard++) {
      let placed = false;
      for (let i = 0; i < 81; i++) {
        if (g.values[i] !== 0) continue;
        const n = popcount(g.cands[i]);
        if (n === 0) return false;
        if (n === 1) {
          setValue(g, i, digitsOf(g.cands[i])[0]);
          placed = true;
        }
      }
      for (const unit of UNITS) {
        for (let d = 1; d <= 9; d++) {
          const b = bit(d);
          let pos = -1;
          let count = 0;
          let solved = false;
          for (const c of unit) {
            if (g.values[c] === d) {
              solved = true;
              break;
            }
            if (g.values[c] === 0 && g.cands[c] & b) {
              pos = c;
              count++;
            }
          }
          if (solved) continue;
          if (count === 0) return false;
          if (count === 1) {
            setValue(g, pos, d);
            placed = true;
          }
        }
      }
      if (!placed) return true;
    }
    return true;
  }
  function propagateNet(g) {
    for (let guard = 0; guard < 200; guard++) {
      if (!propagate(g)) return false;
      let changed = false;
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        for (let b = 0; b < 9; b++) {
          const cells = UNITS[18 + b].filter((c) => g.values[c] === 0 && g.cands[c] & m);
          if (cells.length < 2) continue;
          for (const axis of [0, 1]) {
            const lineOf = (c) => axis === 0 ? Math.floor(c / 9) : c % 9;
            const l = lineOf(cells[0]);
            if (!cells.every((c) => lineOf(c) === l)) continue;
            for (const c of UNITS[axis === 0 ? l : 9 + l]) {
              if (g.values[c] === 0 && g.cands[c] & m && !UNITS[18 + b].includes(c)) {
                g.cands[c] &= ~m;
                changed = true;
              }
            }
          }
        }
        for (let u = 0; u < 18; u++) {
          const cells = UNITS[u].filter((c) => g.values[c] === 0 && g.cands[c] & m);
          if (cells.length < 2) continue;
          const box = Math.floor(cells[0] / 27) * 3 + Math.floor(cells[0] % 9 / 3);
          const boxOfC = (c) => Math.floor(c / 27) * 3 + Math.floor(c % 9 / 3);
          if (!cells.every((c) => boxOfC(c) === box)) continue;
          for (const c of UNITS[18 + box]) {
            if (g.values[c] === 0 && g.cands[c] & m && !UNITS[u].includes(c)) {
              g.cands[c] &= ~m;
              changed = true;
            }
          }
        }
      }
      if (!changed) return true;
    }
    return true;
  }
  function findForcingNet(g) {
    for (let cell = 0; cell < 81; cell++) {
      if (g.values[cell] !== 0) continue;
      for (const d of digitsOf(g.cands[cell])) {
        const b = cloneGrid(g);
        setValue(b, cell, d);
        if (!propagateNet(b)) {
          return {
            tech: "FORCING_NET",
            placements: [],
            eliminations: [{ cell, digit: d }],
            primary: [{ cell, digit: d }],
            labels: { primary: tr`the assumption; the net it sets off is search, not a pattern, and is not drawn` },
            description: tr`Forcing net: assuming ${cellName(cell)} = ${d} and following singles plus box/line intersections leads to a contradiction, so ${d} is impossible there.`
          };
        }
      }
    }
    return null;
  }
  function branch(g, cell, digit) {
    const b = cloneGrid(g);
    setValue(b, cell, digit);
    return propagate(b) ? b : null;
  }
  function contradictionStep(g, cell, d) {
    if (g.values[cell] !== 0 || !(g.cands[cell] & bit(d))) return null;
    const drawn = contradictionDrawing(g, cell, d, true);
    if (!drawn) return null;
    return {
      tech: "NISHIO_FORCING_CHAIN",
      placements: [],
      eliminations: [{ cell, digit: d }],
      primary: [{ cell, digit: d }],
      fins: drawn.fins,
      links: drawn.links,
      units: drawn.unit !== void 0 ? [{ unit: drawn.unit, role: "secondary" }] : void 0,
      labels: forcingLabels(),
      description: tr`Nishio: assuming ${cellName(cell)} = ${d} and following the forced singles leads to a contradiction, so ${d} is impossible there.`
    };
  }
  function findNishio(g) {
    for (let cell = 0; cell < 81; cell++) {
      if (g.values[cell] !== 0) continue;
      for (const d of digitsOf(g.cands[cell])) {
        if (branch(g, cell, d) === null) {
          const step = contradictionStep(g, cell, d);
          if (step) return step;
        }
      }
    }
    return null;
  }
  function intersectBranches(g, branches) {
    const places = [];
    const elims = [];
    for (let i = 0; i < 81; i++) {
      if (g.values[i] !== 0) continue;
      const first = branches[0].values[i];
      if (first !== 0 && branches.every((br) => br.values[i] === first)) {
        places.push({ cell: i, digit: first });
        continue;
      }
      for (const d of digitsOf(g.cands[i])) {
        const gone = branches.every(
          (br) => br.values[i] !== 0 && br.values[i] !== d || br.values[i] === 0 && !(br.cands[i] & bit(d))
        );
        if (gone) elims.push({ cell: i, digit: d });
      }
    }
    return { places, elims };
  }
  function verityText(over, many) {
    if ("cell" in over) {
      const c = cellName(over.cell);
      return {
        primary: tr`every possibility for ${c}, each followed along its own line to the same conclusion`,
        description: many ? tr`Cell forcing: every possibility for ${c} leads, via forced singles, to the same conclusions.` : tr`Cell forcing: every possibility for ${c} leads, via forced singles, to the same conclusion.`
      };
    }
    const d = over.digit;
    const u = unitName(over.unit);
    return {
      primary: tr`every possibility for digit ${d} in ${u}, each followed along its own line to the same conclusion`,
      description: many ? tr`Unit forcing: every possibility for digit ${d} in ${u} leads, via forced singles, to the same conclusions.` : tr`Unit forcing: every possibility for digit ${d} in ${u} leads, via forced singles, to the same conclusion.`
    };
  }
  function verityStep(g, origin, branches, over) {
    const tech = "cell" in over ? "CELL_FORCING_CHAIN" : "UNIT_FORCING_CHAIN";
    const { places, elims } = intersectBranches(g, branches);
    if (!places.length && !elims.length) return null;
    const conclusion = places.length ? { place: places[0] } : { elim: elims[0] };
    const links = origin.flatMap((o) => conclusionDrawing(g, o.cell, o.digit, true, conclusion));
    const { primary, description } = verityText(over, places.length + elims.length > 1);
    return {
      tech,
      placements: places,
      eliminations: elims,
      primary: origin,
      links: links.length ? links : void 0,
      labels: { primary },
      description
    };
  }
  function findDigitForcing(g) {
    for (let cell = 0; cell < 81; cell++) {
      if (g.values[cell] !== 0) continue;
      for (const d of digitsOf(g.cands[cell])) {
        const on = branch(g, cell, d);
        const off = cloneGrid(g);
        off.cands[cell] &= ~bit(d);
        const offOk = propagate(off);
        if (!offOk && on) {
          const drawn = contradictionDrawing(g, cell, d, false);
          return {
            tech: "DIGIT_FORCING_CHAIN",
            placements: [{ cell, digit: d }],
            eliminations: [],
            primary: [{ cell, digit: d }],
            fins: drawn?.fins,
            links: drawn?.links,
            units: drawn?.unit !== void 0 ? [{ unit: drawn.unit, role: "secondary" }] : void 0,
            labels: forcingLabels(),
            description: tr`Digit forcing: removing ${d} from ${cellName(cell)} collapses the puzzle via forced singles, so ${cellName(cell)} must be ${d}.`
          };
        }
        if (!on || !offOk) continue;
        const { places, elims } = intersectBranches(g, [on, off]);
        if (!places.length && !elims.length) continue;
        const conclusion = places.length ? { place: places[0] } : { elim: elims[0] };
        const links = [
          ...conclusionDrawing(g, cell, d, true, conclusion),
          ...conclusionDrawing(g, cell, d, false, conclusion)
        ];
        return {
          tech: "DIGIT_FORCING_CHAIN",
          placements: places,
          eliminations: elims,
          primary: [{ cell, digit: d }],
          links: links.length ? links : void 0,
          labels: {
            primary: tr`${cellName(cell)} = ${d} and its opposite, each followed along its own line to the same conclusion`
          },
          description: places.length + elims.length > 1 ? tr`Digit forcing: whether ${cellName(cell)} is ${d} or not, the forced singles agree on the same conclusions.` : tr`Digit forcing: whether ${cellName(cell)} is ${d} or not, the forced singles agree on the same conclusion.`
        };
      }
    }
    return null;
  }
  function findCellForcing(g) {
    for (let cell = 0; cell < 81; cell++) {
      if (g.values[cell] !== 0) continue;
      const ds = digitsOf(g.cands[cell]);
      if (ds.length < 2 || ds.length > 4) continue;
      const branches = [];
      let contradiction = false;
      for (const d of ds) {
        const br = branch(g, cell, d);
        if (!br) {
          contradiction = true;
          break;
        }
        branches.push(br);
      }
      if (contradiction) continue;
      const step = verityStep(
        g,
        ds.map((digit) => ({ cell, digit })),
        branches,
        { cell }
      );
      if (step) return step;
    }
    return null;
  }
  function findUnitForcing(g) {
    for (const [ui, unit] of UNITS.entries()) {
      for (let d = 1; d <= 9; d++) {
        if (unit.some((c) => g.values[c] === d)) continue;
        const spots = unit.filter((c) => g.values[c] === 0 && g.cands[c] & bit(d));
        if (spots.length < 2 || spots.length > 4) continue;
        const branches = [];
        let contradiction = false;
        for (const c of spots) {
          const br = branch(g, c, d);
          if (!br) {
            contradiction = true;
            break;
          }
          branches.push(br);
        }
        if (contradiction) continue;
        const step = verityStep(
          g,
          spots.map((cell) => ({ cell, digit: d })),
          branches,
          { digit: d, unit: ui }
        );
        if (step) return step;
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/sueDeCoq.ts
  function findSueDeCoq(g) {
    for (let line = 0; line < 18; line++) {
      const lineCells = UNITS[line];
      const boxes = [...new Set(lineCells.map(boxOf))];
      for (const b of boxes) {
        const inter = lineCells.filter(
          (c) => boxOf(c) === b && g.values[c] === 0
        );
        if (inter.length < 2) continue;
        for (const size of [2, 3]) {
          if (inter.length < size) continue;
          for (const C of combinations(inter, size)) {
            let V = 0;
            for (const c of C) V |= g.cands[c];
            if (popcount(V) !== size + 2) continue;
            const lineRest = lineCells.filter(
              (c) => boxOf(c) !== b && g.values[c] === 0
            );
            const boxRest = UNITS[18 + b].filter(
              (c) => !lineCells.includes(c) && g.values[c] === 0
            );
            for (const D of lineRest) {
              const dMask = g.cands[D];
              if (popcount(dMask) !== 2 || (dMask & ~V) !== 0) continue;
              for (const E of boxRest) {
                const eMask = g.cands[E];
                if (popcount(eMask) !== 2 || (eMask & ~V) !== 0) continue;
                if (dMask & eMask) continue;
                const lineDigits = dMask | V & ~eMask;
                const boxDigits = eMask | V & ~dMask;
                const elims = [];
                for (const c of lineRest) {
                  if (c === D) continue;
                  for (const d of digitsOf(g.cands[c] & lineDigits))
                    elims.push({ cell: c, digit: d });
                }
                for (const c of boxRest) {
                  if (c === E) continue;
                  for (const d of digitsOf(g.cands[c] & boxDigits))
                    elims.push({ cell: c, digit: d });
                }
                if (!elims.length) continue;
                return {
                  tech: "SUE_DE_COQ",
                  placements: [],
                  eliminations: elims,
                  primary: C.flatMap(
                    (cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))
                  ),
                  secondary: [
                    ...digitsOf(dMask).map((digit) => ({ cell: D, digit })),
                    ...digitsOf(eMask).map((digit) => ({ cell: E, digit }))
                  ],
                  labels: {
                    primary: tr`the intersection cells, holding ${digitsOf(V).join("")}`,
                    secondary: tr`the line cell and the box cell that complete the locked set`
                  },
                  description: tr`Sue de Coq: ${cellNames(C)} (${digitsOf(V).join("")}) with ${cellName(D)} in the line and ${cellName(E)} in the box form a locked set; line digits are cleared from the rest of the line, box digits from the rest of the box.`
                };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/medusa.ts
  var nid = (cell, digit) => cell * 9 + digit - 1;
  var nCell = (id) => Math.floor(id / 9);
  var nDigit = (id) => id % 9 + 1;
  var cd = (id) => ({ cell: nCell(id), digit: nDigit(id) });
  function buildClusters(g) {
    const adj = /* @__PURE__ */ new Map();
    const link = (a, b) => {
      if (!adj.has(a)) adj.set(a, /* @__PURE__ */ new Set());
      if (!adj.has(b)) adj.set(b, /* @__PURE__ */ new Set());
      adj.get(a).add(b);
      adj.get(b).add(a);
    };
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const cells = unit.filter((c) => g.values[c] === 0 && g.cands[c] & bit(d));
        if (cells.length === 2) link(nid(cells[0], d), nid(cells[1], d));
      }
    }
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 2) {
        const [d1, d2] = digitsOf(g.cands[c]);
        link(nid(c, d1), nid(c, d2));
      }
    }
    const clusters3 = [];
    const visited = /* @__PURE__ */ new Set();
    for (const start of adj.keys()) {
      if (visited.has(start)) continue;
      const color = /* @__PURE__ */ new Map();
      const nodes = [];
      const edges = [];
      const queue = [start];
      color.set(start, 0);
      visited.add(start);
      while (queue.length) {
        const cur = queue.shift();
        nodes.push(cur);
        for (const next of adj.get(cur)) {
          if (!color.has(next)) {
            color.set(next, 1 - color.get(cur));
            visited.add(next);
            edges.push([cur, next]);
            queue.push(next);
          }
        }
      }
      if (nodes.length >= 4) clusters3.push({ nodes, color, edges });
    }
    return clusters3;
  }
  function findMedusa3d(g) {
    for (const cl of clusters2(g)) {
      const colored = (col) => cl.nodes.filter((n) => cl.color.get(n) === col);
      for (const col of [0, 1]) {
        const nodes = colored(col);
        const byCell = /* @__PURE__ */ new Map();
        for (const n of nodes) {
          const ds = byCell.get(nCell(n)) ?? [];
          ds.push(nDigit(n));
          byCell.set(nCell(n), ds);
        }
        for (const [cell, ds] of byCell) {
          if (ds.length >= 2) {
            const name = cellName(cell);
            return medusaStep(
              cl,
              nodes.map(cd),
              col === 0 ? tr`Blue colours both ${ds[0]} and ${ds[1]} in ${name}, so blue is false: all its candidates are removed (circled red) and every gold candidate is true` : tr`Gold colours both ${ds[0]} and ${ds[1]} in ${name}, so gold is false: all its candidates are removed (circled red) and every blue candidate is true`,
              [
                witness2(
                  { cell, digit: ds[0] },
                  { cell, digit: ds[1] },
                  col === 0 ? tr`Blue colours both the ${ds[0]} and the ${ds[1]} in ${name}. A cell holds one digit, so blue cannot be true.` : tr`Gold colours both the ${ds[0]} and the ${ds[1]} in ${name}. A cell holds one digit, so gold cannot be true.`
                )
              ]
            );
          }
        }
        for (let u = 0; u < 27; u++) {
          for (let d = 1; d <= 9; d++) {
            const twice = UNITS[u].filter((c) => cl.color.get(nid(c, d)) === col);
            if (twice.length >= 2) {
              const unit = unitName(u);
              const a = cellName(twice[0]);
              const b = cellName(twice[1]);
              return medusaStep(
                cl,
                nodes.map(cd),
                col === 0 ? tr`Blue puts ${d} twice in ${unit} (${a} and ${b}), so blue is false: all its candidates are removed (circled red) and every gold candidate is true` : tr`Gold puts ${d} twice in ${unit} (${a} and ${b}), so gold is false: all its candidates are removed (circled red) and every blue candidate is true`,
                [
                  witness2(
                    { cell: twice[0], digit: d },
                    { cell: twice[1], digit: d },
                    col === 0 ? tr`Blue puts ${d} in both ${a} and ${b} of ${unit}. A digit appears once per house, so blue cannot be true.` : tr`Gold puts ${d} in both ${a} and ${b} of ${unit}. A digit appears once per house, so gold cannot be true.`
                  )
                ]
              );
            }
          }
        }
      }
      const elims3 = [];
      let why3 = "";
      const witnesses3 = [];
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0) continue;
        const colorDigit = [void 0, void 0];
        for (const d of digitsOf(g.cands[c])) {
          const col = cl.color.get(nid(c, d));
          if (col !== void 0) colorDigit[col] = d;
        }
        if (colorDigit[0] === void 0 || colorDigit[1] === void 0) continue;
        const before = elims3.length;
        for (const d of digitsOf(g.cands[c])) {
          if (!cl.color.has(nid(c, d))) elims3.push({ cell: c, digit: d });
        }
        if (elims3.length > before && !why3) {
          why3 = tr`${cellName(c)} holds both a blue ${colorDigit[0]} and a gold ${colorDigit[1]}; one of those two is true, so the cell's other candidates are removed`;
          const first = elims3[before];
          witnesses3.push(
            witness2(
              { cell: c, digit: colorDigit[0] },
              first,
              tr`If blue is true, ${cellName(c)} is ${colorDigit[0]}, and its ${first.digit} goes.`
            ),
            witness2(
              { cell: c, digit: colorDigit[1] },
              first,
              tr`If gold is true, ${cellName(c)} is ${colorDigit[1]}, and its ${first.digit} goes. Either way the ${first.digit} is false.`
            )
          );
        }
      }
      if (elims3.length) {
        const cellsHit = new Set(elims3.map((e) => e.cell)).size;
        return medusaStep(
          cl,
          elims3,
          why3 + (cellsHit > 1 ? tr` (${cellsHit} cells are narrowed to their blue and gold candidates this way)` : ""),
          witnesses3
        );
      }
      const elims45 = [];
      let why45 = "";
      const witnesses45 = [];
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0) continue;
        const colorDigit = [void 0, void 0];
        for (const d of digitsOf(g.cands[c])) {
          const col = cl.color.get(nid(c, d));
          if (col !== void 0) colorDigit[col] = d;
        }
        for (const d of digitsOf(g.cands[c])) {
          if (cl.color.has(nid(c, d))) continue;
          const seen = [void 0, void 0];
          for (const n of cl.nodes) {
            if (nDigit(n) === d && sees(c, nCell(n))) seen[cl.color.get(n)] ??= nCell(n);
          }
          if (seen[0] !== void 0 && seen[1] !== void 0) {
            elims45.push({ cell: c, digit: d });
            if (!why45) {
              why45 = tr`The ${d} in ${cellName(c)} sees a blue ${d} in ${cellName(seen[0])} and a gold ${d} in ${cellName(seen[1])}, so it is false either way`;
              witnesses45.push(
                witness2(
                  { cell: seen[0], digit: d },
                  { cell: c, digit: d },
                  tr`If blue is true, the ${d} in ${cellName(seen[0])} is placed, and the ${d} in ${cellName(c)} goes.`
                ),
                witness2(
                  { cell: seen[1], digit: d },
                  { cell: c, digit: d },
                  tr`If gold is true, the ${d} in ${cellName(seen[1])} is placed, and the ${d} in ${cellName(c)} goes. Either way it is false.`
                )
              );
            }
            continue;
          }
          for (const A of [0, 1]) {
            if (seen[A] !== void 0 && colorDigit[1 - A] !== void 0) {
              elims45.push({ cell: c, digit: d });
              if (!why45) {
                const here = cellName(c);
                const there = cellName(seen[A]);
                const own = colorDigit[1 - A];
                why45 = A === 0 ? tr`The ${d} in ${here} sees a blue ${d} in ${there} while its own cell holds a gold ${own}, so whichever colour is true removes it` : tr`The ${d} in ${here} sees a gold ${d} in ${there} while its own cell holds a blue ${own}, so whichever colour is true removes it`;
                witnesses45.push(
                  witness2(
                    { cell: seen[A], digit: d },
                    { cell: c, digit: d },
                    A === 0 ? tr`If blue is true, the ${d} in ${there} is placed, and the ${d} in ${here} goes.` : tr`If gold is true, the ${d} in ${there} is placed, and the ${d} in ${here} goes.`
                  ),
                  witness2(
                    { cell: c, digit: colorDigit[1 - A] },
                    { cell: c, digit: d },
                    A === 0 ? tr`If gold is true, ${here} is ${own}, and its ${d} goes. Either way the ${d} is false.` : tr`If blue is true, ${here} is ${own}, and its ${d} goes. Either way the ${d} is false.`
                  )
                );
              }
              break;
            }
          }
        }
      }
      if (elims45.length) {
        return medusaStep(
          cl,
          elims45,
          why45 + (elims45.length > 1 ? tr`; ${elims45.length} candidates fall this way` : ""),
          witnesses45
        );
      }
      for (const A of [0, 1]) {
        for (let c = 0; c < 81; c++) {
          if (g.values[c] !== 0) continue;
          const ds = digitsOf(g.cands[c]);
          if (ds.length === 0) continue;
          if (ds.some((d) => cl.color.has(nid(c, d)))) continue;
          const emptied = ds.every(
            (d) => cl.nodes.some((n) => nDigit(n) === d && cl.color.get(n) === A && sees(c, nCell(n)))
          );
          if (emptied) {
            const target = cellName(c);
            const witnesses6 = ds.map((d, k) => {
              const n = cl.nodes.find((x) => nDigit(x) === d && cl.color.get(x) === A && sees(c, nCell(x)));
              const last = k === ds.length - 1;
              const from = cellName(nCell(n));
              let text;
              if (A === 0) {
                text = last ? tr`If blue is true, the ${d} in ${from} is placed, and ${target} loses its ${d}. ${target} would then be empty, so blue is false.` : tr`If blue is true, the ${d} in ${from} is placed, and ${target} loses its ${d}.`;
              } else {
                text = last ? tr`If gold is true, the ${d} in ${from} is placed, and ${target} loses its ${d}. ${target} would then be empty, so gold is false.` : tr`If gold is true, the ${d} in ${from} is placed, and ${target} loses its ${d}.`;
              }
              return witness2(cd(n), { cell: c, digit: d }, text);
            });
            return medusaStep(
              cl,
              colored(A).map(cd),
              A === 0 ? tr`If blue were true, ${target} would lose every one of its candidates (${ds.join(", ")}), so blue is false: all its candidates are removed (circled red) and every gold candidate is true` : tr`If gold were true, ${target} would lose every one of its candidates (${ds.join(", ")}), so gold is false: all its candidates are removed (circled red) and every blue candidate is true`,
              witnesses6
            );
          }
        }
      }
    }
    return null;
  }
  var clusters2 = buildClusters;
  var witness2 = (from, to, text) => ({ from: [from], to: [to], strong: false, text });
  function medusaStep(cl, eliminations, reason, witnesses = []) {
    const links = [
      ...cl.edges.map(([a, b]) => ({
        from: [cd(a)],
        to: [cd(b)],
        strong: true,
        undirected: true
      })),
      ...witnesses
    ];
    return {
      tech: "MEDUSA_3D",
      placements: [],
      eliminations,
      primary: cl.nodes.filter((n) => cl.color.get(n) === 0).map(cd),
      secondary: cl.nodes.filter((n) => cl.color.get(n) === 1).map(cd),
      labels: {
        primary: tr`blue: one colour, all its candidates true or all false together`,
        secondary: tr`gold: the other colour, true exactly when blue is false`
      },
      links,
      description: tr`3D Medusa: candidates joined by conjugate pairs and bivalue cells (the solid links) are coloured blue and gold, and either every blue candidate is true or every gold one is. ${reason}.`
    };
  }

  // vendor/sudokui/engine/techniques/chuteRemotePair.ts
  function findChuteRemotePair(g) {
    const bivalue = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 2) bivalue.push(c);
    }
    for (let i = 0; i < bivalue.length; i++) {
      for (let j = i + 1; j < bivalue.length; j++) {
        const c1 = bivalue[i];
        const c2 = bivalue[j];
        if (g.cands[c1] !== g.cands[c2] || sees(c1, c2)) continue;
        const pairMask = g.cands[c1];
        for (const horizontal of [true, false]) {
          const lineOf = horizontal ? rowOf : colOf;
          const bandOf = (c) => Math.floor(lineOf(c) / 3);
          if (bandOf(c1) !== bandOf(c2)) continue;
          const l1 = lineOf(c1);
          const l2 = lineOf(c2);
          if (l1 === l2) continue;
          const band = bandOf(c1);
          const l3 = [band * 3, band * 3 + 1, band * 3 + 2].find((l) => l !== l1 && l !== l2);
          const b1 = boxOf(c1);
          const b2 = boxOf(c2);
          if (b1 === b2) continue;
          const boxesInChute = horizontal ? [band * 3, band * 3 + 1, band * 3 + 2] : [band, 3 + band, 6 + band];
          const b3 = boxesInChute.find((b) => b !== b1 && b !== b2);
          if (b3 === void 0) continue;
          const mini = [];
          for (let k = 0; k < 9; k++) {
            const cell = horizontal ? l3 * 9 + k : k * 9 + l3;
            if (boxOf(cell) === b3) mini.push(cell);
          }
          let present = 0;
          for (const cell of mini) {
            if (g.values[cell]) present |= bit(g.values[cell]) & pairMask;
            else present |= g.cands[cell] & pairMask;
          }
          if (popcount(present & pairMask) === 2) continue;
          const elimMask = present === 0 ? pairMask : present;
          const elims = [];
          for (let c = 0; c < 81; c++) {
            if (c === c1 || c === c2 || g.values[c] !== 0) continue;
            if (!(g.cands[c] & elimMask)) continue;
            if (sees(c, c1) && sees(c, c2)) {
              for (const d of digitsOf(g.cands[c] & elimMask)) elims.push({ cell: c, digit: d });
            }
          }
          if (!elims.length) continue;
          const digits = digitsOf(pairMask);
          const missing = digitsOf(pairMask & ~present);
          const removed = digitsOf(elimMask);
          const description = present === 0 ? tr`Chute Remote Pair: ${cellName(c1)} and ${cellName(c2)} both hold ${digits.join("")} in one chute, and neither digit appears in ${cellNames(mini)}. Each absent digit forces one pair cell to the other digit, so the pair cells hold opposite digits, and both ${removed[0]} and ${removed[1]} can be removed from cells seeing both pair cells.` : horizontal ? tr`Chute Remote Pair: ${cellName(c1)} and ${cellName(c2)} both hold ${digits.join("")} in one chute; ${missing[0]} appears nowhere in ${cellNames(mini)}, so the chute's third box must place its ${missing[0]} in a row shared with a pair cell, forcing that cell to ${removed[0]}. One pair cell is therefore ${removed[0]}, so ${removed[0]} can be removed from cells seeing both pair cells.` : tr`Chute Remote Pair: ${cellName(c1)} and ${cellName(c2)} both hold ${digits.join("")} in one chute; ${missing[0]} appears nowhere in ${cellNames(mini)}, so the chute's third box must place its ${missing[0]} in a column shared with a pair cell, forcing that cell to ${removed[0]}. One pair cell is therefore ${removed[0]}, so ${removed[0]} can be removed from cells seeing both pair cells.`;
          return {
            tech: "CHUTE_REMOTE_PAIR",
            placements: [],
            eliminations: elims,
            primary: [c1, c2].flatMap((cell) => digits.map((digit) => ({ cell, digit }))),
            labels: {
              primary: tr`the pair: ${digits.join("")} in both cells, one chute apart`,
              secondary: missing.length === 1 ? tr`the third box's mini-line, where ${missing[0]} is missing` : missing.length ? tr`the third box's mini-line, where ${joinAnd(missing)} are missing` : tr`the third box's mini-line, where the pair digits are missing`
            },
            secondary: mini.filter((c) => g.values[c] === 0).flatMap((cell) => digitsOf(g.cands[cell] & pairMask).map((digit) => ({ cell, digit }))),
            description
          };
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/extendedRectangle.ts
  function findExtendedRectangle(g) {
    for (const columns of [true, false]) {
      for (let chute = 0; chute < 3; chute++) {
        for (const [l1, l2] of [
          [0, 1],
          [0, 2],
          [1, 2]
        ]) {
          const lineA = chute * 3 + l1;
          const lineB = chute * 3 + l2;
          for (let p0 = 0; p0 < 3; p0++) {
            for (let p1 = 3; p1 < 6; p1++) {
              for (let p2 = 6; p2 < 9; p2++) {
                const cells = [];
                for (const cross of [p0, p1, p2]) {
                  for (const line of [lineA, lineB]) {
                    cells.push(columns ? cross * 9 + line : line * 9 + cross);
                  }
                }
                if (cells.some((c) => g.values[c] !== 0)) continue;
                const step = checkFormation(g, cells);
                if (step) return step;
              }
            }
          }
        }
      }
    }
    return null;
  }
  function checkFormation(g, cells) {
    let union = 0;
    for (const c of cells) union |= g.cands[c];
    if (popcount(union) < 4) return null;
    for (const extrasCell of cells) {
      let trio = 0;
      for (const c of cells) if (c !== extrasCell) trio |= g.cands[c];
      if (popcount(trio) !== 3) continue;
      if (!(g.cands[extrasCell] & trio)) continue;
      const elims = digitsOf(g.cands[extrasCell] & trio).map((digit) => ({
        cell: extrasCell,
        digit
      }));
      if (!elims.length || !(g.cands[extrasCell] & ~trio)) continue;
      return {
        tech: "EXTENDED_RECTANGLE",
        placements: [],
        eliminations: elims,
        primary: cells.filter((c) => c !== extrasCell).flatMap((cell) => digitsOf(g.cands[cell]).map((digit) => ({ cell, digit }))),
        labels: { primary: tr`the cells that would form a deadly ${digitsOf(trio).join("")} loop` },
        description: tr`Extended Rectangle Type 1: ${cellNames(cells)} would form a deadly ${digitsOf(trio).join("")} loop; ${cellName(extrasCell)} must take one of its extra candidates.`
      };
    }
    for (const z of digitsOf(union)) {
      const trio = union & ~bit(z);
      if (popcount(trio) !== 3) continue;
      if (!cells.every((c) => (g.cands[c] & ~(trio | bit(z))) === 0)) continue;
      const zCells = cells.filter((c) => g.cands[c] & bit(z));
      if (zCells.length < 2) continue;
      const elims = [];
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0 || cells.includes(c)) continue;
        if (!(g.cands[c] & bit(z))) continue;
        if (zCells.every((zc) => sees(c, zc))) elims.push({ cell: c, digit: z });
      }
      if (!elims.length) continue;
      return {
        tech: "EXTENDED_RECTANGLE",
        placements: [],
        eliminations: elims,
        primary: cells.flatMap(
          (cell) => digitsOf(g.cands[cell] & trio).map((digit) => ({ cell, digit }))
        ),
        secondary: zCells.map((cell) => ({ cell, digit: z })),
        labels: {
          primary: tr`the cells that would form a deadly ${digitsOf(trio).join("")} loop`,
          secondary: tr`${z}, the extra candidate: one of these cells must be it`
        },
        description: tr`Extended Rectangle Type 2: to avoid a deadly ${digitsOf(trio).join("")} loop in ${cellNames(cells)}, one of ${cellNames(zCells)} must be ${z}, so ${z} is removed from cells seeing all of them.`
      };
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/xCycles.ts
  function findXCycles(g, maxLen = 12) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const cells = [];
      for (let c = 0; c < 81; c++) if (g.values[c] === 0 && g.cands[c] & mask) cells.push(c);
      if (cells.length < 4) continue;
      const strong = /* @__PURE__ */ new Map();
      for (const c of cells) strong.set(c, []);
      for (const unit of UNITS) {
        const uc = unit.filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        if (uc.length === 2) {
          strong.get(uc[0]).push(uc[1]);
          strong.get(uc[1]).push(uc[0]);
        }
      }
      const isStrong = (a, b) => strong.get(a).includes(b);
      let budget = 3e4;
      const dfs = (path, nextType) => {
        if (budget-- <= 0 || path.length > maxLen) return null;
        const cur = path[path.length - 1];
        const start = path[0];
        if (path.length >= 3) {
          const lastWasStrong = nextType === "weak";
          if (!lastWasStrong && isStrong(cur, start)) {
            const step = rule2(g, d, path);
            if (step) return step;
          }
          if (lastWasStrong && sees(cur, start) && path.length % 2 === 0) {
            const step = rule1(g, d, path);
            if (step) return step;
          }
        }
        const nexts = nextType === "strong" ? strong.get(cur) : cells.filter((c) => sees(c, cur));
        for (const next of nexts) {
          if (path.includes(next)) continue;
          const res = dfs([...path, next], nextType === "strong" ? "weak" : "strong");
          if (res) return res;
        }
        return null;
      };
      for (const start of cells) {
        if (strong.get(start).length === 0) continue;
        const res = dfs([start], "strong");
        if (res) return res;
      }
    }
    return null;
  }
  function rule2(g, d, path) {
    const start = path[0];
    return {
      tech: "X_CYCLES",
      labels: { primary: tr`the loop on ${d}` },
      placements: [{ cell: start, digit: d }],
      eliminations: [],
      primary: path.map((cell) => ({ cell, digit: d })),
      links: alternatingLinks(path.map((cell) => [{ cell, digit: d }]), "strong"),
      description: tr`X-Cycle on ${d}: the loop ${path.map(cellName).join(" \u2192 ")} closes with two strong links at ${cellName(start)}: if it were not ${d}, the loop would force it to be ${d}. So ${cellName(start)} is ${d}.`
    };
  }
  function rule1(g, d, path) {
    const mask = bit(d);
    const weakLinks = [];
    for (let i = 1; i < path.length; i += 2) {
      weakLinks.push([path[i], path[(i + 1) % path.length]]);
    }
    const elims = [];
    const seen = /* @__PURE__ */ new Set();
    for (const [a, b] of weakLinks) {
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0 || path.includes(c) || seen.has(c)) continue;
        if (!(g.cands[c] & mask)) continue;
        if (sees(c, a) && sees(c, b)) {
          seen.add(c);
          elims.push({ cell: c, digit: d });
        }
      }
    }
    if (!elims.length) return null;
    return {
      tech: "X_CYCLES",
      labels: { primary: tr`the loop on ${d}` },
      placements: [],
      eliminations: elims,
      primary: path.map((cell) => ({ cell, digit: d })),
      links: alternatingLinks(path.map((cell) => [{ cell, digit: d }]), "weak"),
      description: tr`X-Cycle on ${d}: the continuous loop ${cellNames(path)} alternates perfectly: along each weak link one end is ${d}, so ${d} falls from every outside cell seeing both ends of a weak link.`
    };
  }

  // vendor/sudokui/engine/techniques/aic.ts
  var nid2 = (cell, digit) => cell * 9 + digit - 1;
  var nCell2 = (id) => Math.floor(id / 9);
  var nDigit2 = (id) => id % 9 + 1;
  function buildGraph(g) {
    const strong = /* @__PURE__ */ new Map();
    const candidates = [];
    const add = (a, b) => {
      if (!strong.has(a)) strong.set(a, []);
      strong.get(a).push(b);
    };
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0) continue;
      const ds = digitsOf(g.cands[c]);
      for (const d of ds) candidates.push(nid2(c, d));
      if (ds.length === 2) {
        add(nid2(c, ds[0]), nid2(c, ds[1]));
        add(nid2(c, ds[1]), nid2(c, ds[0]));
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const uc = unit.filter((c) => g.values[c] === 0 && g.cands[c] & bit(d));
        if (uc.length === 2) {
          add(nid2(uc[0], d), nid2(uc[1], d));
          add(nid2(uc[1], d), nid2(uc[0], d));
        }
      }
    }
    return { strong, candidates };
  }
  function conflictsOf(g, id) {
    const out = /* @__PURE__ */ new Set();
    const cell = nCell2(id);
    const digit = nDigit2(id);
    for (const d of digitsOf(g.cands[cell])) {
      if (d !== digit) out.add(nid2(cell, d));
    }
    for (let c = 0; c < 81; c++) {
      if (c === cell || g.values[c] !== 0) continue;
      if (g.cands[c] & bit(digit) && sees(c, cell)) out.add(nid2(c, digit));
    }
    return out;
  }
  function findAic(g, maxNodes = 12) {
    return searchAic(g, "chain", maxNodes);
  }
  function findNiceLoop(g, maxNodes = 12) {
    return searchAic(g, "loop", maxNodes);
  }
  function searchAic(g, mode, maxNodes) {
    const { strong, candidates } = buildGraph(g);
    if (!strong.size) return null;
    let budget = 6e4;
    const weakLinked = (a, b) => nCell2(a) === nCell2(b) ? nDigit2(a) !== nDigit2(b) : nDigit2(a) === nDigit2(b) && sees(nCell2(a), nCell2(b));
    const weakNbrs = (id) => {
      const cell = nCell2(id);
      const digit = nDigit2(id);
      const out = [];
      for (const d of digitsOf(g.cands[cell])) if (d !== digit) out.push(nid2(cell, d));
      for (let c = 0; c < 81; c++) {
        if (c === cell || g.values[c] !== 0) continue;
        if (g.cands[c] & bit(digit) && sees(c, cell)) out.push(nid2(c, digit));
      }
      return out;
    };
    for (const start of candidates) {
      if (!strong.has(start)) continue;
      const startConf = conflictsOf(g, start);
      const dfs = (path, nextType) => {
        if (budget-- <= 0 || path.length > maxNodes) return null;
        const cur = path[path.length - 1];
        const start2 = path[0];
        if (mode === "chain" && nextType === "weak" && path.length >= 4) {
          const endConf = conflictsOf(g, cur);
          const elims = [];
          for (const id of startConf) {
            if (!endConf.has(id) || path.includes(id)) continue;
            elims.push({ cell: nCell2(id), digit: nDigit2(id) });
          }
          if (elims.length) {
            const a = path[0];
            const b = cur;
            return {
              tech: "AIC",
              labels: { primary: tr`the chain` },
              placements: [],
              eliminations: elims,
              primary: path.map((id) => ({ cell: nCell2(id), digit: nDigit2(id) })),
              links: alternatingLinks(path.map((id) => [{ cell: nCell2(id), digit: nDigit2(id) }])),
              description: tr`AIC: ${path.map((id) => `${nDigit2(id)}@${cellName(nCell2(id))}`).join(" \u2192 ")}; at least one of ${nDigit2(a)}@${cellName(nCell2(a))} and ${nDigit2(b)}@${cellName(nCell2(b))} is true, so candidates conflicting with both are removed.`
            };
          }
        }
        if (mode === "loop" && path.length >= 4) {
          const lastWasStrong = nextType === "weak";
          if (!lastWasStrong && (strong.get(cur) ?? []).includes(start2)) {
            return {
              tech: "NICE_LOOP",
              labels: { primary: tr`the loop` },
              placements: [{ cell: nCell2(start2), digit: nDigit2(start2) }],
              eliminations: [],
              primary: path.map((id) => ({ cell: nCell2(id), digit: nDigit2(id) })),
              links: alternatingLinks(
                path.map((id) => [{ cell: nCell2(id), digit: nDigit2(id) }]),
                "strong"
              ),
              description: tr`Nice Loop: the loop ${path.map((id) => `${nDigit2(id)}@${cellName(nCell2(id))}`).join(" \u2192 ")} closes with two strong links at ${nDigit2(start2)}@${cellName(nCell2(start2))}; denying it forces it, so it is placed.`
            };
          }
          if (lastWasStrong && weakLinked(cur, start2) && path.length % 2 === 0) {
            const step = continuousLoop(g, path);
            if (step) return step;
          }
        }
        const nexts = nextType === "strong" ? strong.get(cur) ?? [] : weakNbrs(cur);
        for (const next of nexts) {
          if (path.includes(next)) continue;
          const res2 = dfs([...path, next], nextType === "strong" ? "weak" : "strong");
          if (res2) return res2;
        }
        return null;
      };
      const res = dfs([start], "strong");
      if (res) return res;
      if (budget <= 0) return null;
    }
    return null;
  }
  function continuousLoop(g, path) {
    const inPath = new Set(path);
    const elims = [];
    const seen = /* @__PURE__ */ new Set();
    const add = (cell, digit) => {
      const key = `${cell}-${digit}`;
      if (!seen.has(key)) {
        seen.add(key);
        elims.push({ cell, digit });
      }
    };
    for (let i = 1; i < path.length; i += 2) {
      const u = path[i];
      const v = path[(i + 1) % path.length];
      if (nCell2(u) === nCell2(v)) {
        for (const d of digitsOf(g.cands[nCell2(u)])) {
          if (d !== nDigit2(u) && d !== nDigit2(v)) add(nCell2(u), d);
        }
      } else {
        const d = nDigit2(u);
        for (let c = 0; c < 81; c++) {
          if (g.values[c] !== 0 || !(g.cands[c] & bit(d))) continue;
          if (inPath.has(nid2(c, d))) continue;
          if (sees(c, nCell2(u)) && sees(c, nCell2(v))) add(c, d);
        }
      }
    }
    if (!elims.length) return null;
    return {
      tech: "NICE_LOOP",
      labels: { primary: tr`the loop` },
      placements: [],
      eliminations: elims,
      primary: path.map((id) => ({ cell: nCell2(id), digit: nDigit2(id) })),
      links: alternatingLinks(
        path.map((id) => [{ cell: nCell2(id), digit: nDigit2(id) }]),
        "weak"
      ),
      description: tr`Nice Loop: the continuous loop ${path.map((id) => `${nDigit2(id)}@${cellName(nCell2(id))}`).join(" \u2192 ")} alternates perfectly; every weak link has exactly one true side, clearing other candidates along it.`
    };
  }

  // vendor/sudokui/engine/techniques/groupedXCycles.ts
  var nodeCds = (nodes, path, d) => path.map((n) => nodes[n].cells.map((cell) => ({ cell, digit: d })));
  function findGroupedXCycles(g, maxLen = 10) {
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const has = (c) => g.values[c] === 0 && (g.cands[c] & mask) !== 0;
      const candCells = [];
      for (let c = 0; c < 81; c++) if (has(c)) candCells.push(c);
      if (candCells.length < 5) continue;
      const nodes = candCells.map((c) => ({ cells: [c] }));
      for (let b = 0; b < 9; b++) {
        const inBox = UNITS[18 + b].filter(has);
        for (const lineOf of [rowOf, colOf]) {
          const byLine = /* @__PURE__ */ new Map();
          for (const c of inBox) {
            const l = lineOf(c);
            if (!byLine.has(l)) byLine.set(l, []);
            byLine.get(l).push(c);
          }
          for (const seg of byLine.values()) {
            if (seg.length >= 2) nodes.push({ cells: seg });
          }
        }
      }
      const disjoint = (a, b) => !a.cells.some((c) => b.cells.includes(c));
      const weakLinked = (a, b) => disjoint(a, b) && a.cells.every((ca) => b.cells.every((cb) => sees(ca, cb)));
      const strong = /* @__PURE__ */ new Map();
      const addStrong = (i, j) => {
        if (!strong.has(i)) strong.set(i, /* @__PURE__ */ new Set());
        if (!strong.has(j)) strong.set(j, /* @__PURE__ */ new Set());
        strong.get(i).add(j);
        strong.get(j).add(i);
      };
      for (const unit of UNITS) {
        const uc = unit.filter(has);
        if (uc.length < 2) continue;
        const inUnit = [];
        for (let n = 0; n < nodes.length; n++) {
          if (nodes[n].cells.every((c) => unit.includes(c))) inUnit.push(n);
        }
        for (let x = 0; x < inUnit.length; x++) {
          for (let y = x + 1; y < inUnit.length; y++) {
            const A = nodes[inUnit[x]];
            const B = nodes[inUnit[y]];
            if (!disjoint(A, B)) continue;
            if (A.cells.length + B.cells.length !== uc.length) continue;
            addStrong(inUnit[x], inUnit[y]);
          }
        }
      }
      if (!strong.size) continue;
      let budget = 25e3;
      const pathHasCellOverlap = (path, n) => path.some((p) => !disjoint(nodes[p], nodes[n]));
      const dfs = (path, nextType, firstWeak) => {
        if (budget-- <= 0 || path.length > maxLen) return null;
        const cur = path[path.length - 1];
        const start = path[0];
        if (path.length >= 3) {
          const lastWasStrong = nextType === "weak";
          if (!firstWeak) {
            if (!lastWasStrong && strong.get(cur)?.has(start)) {
              const step = rule22(g, d, nodes, path);
              if (step) return step;
            }
            if (lastWasStrong && weakLinked(nodes[cur], nodes[start]) && path.length % 2 === 0) {
              const step = rule12(g, d, nodes, path);
              if (step) return step;
            }
          } else if (lastWasStrong && weakLinked(nodes[cur], nodes[start]) && path.length % 2 === 1) {
            const startCells = nodes[start].cells;
            if (startCells.length >= 2) {
              return {
                tech: "GROUPED_X_CYCLES",
                labels: { primary: tr`the loop on ${d}, with grouped nodes` },
                placements: [],
                eliminations: startCells.map((cell) => ({ cell, digit: d })),
                primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: d }))),
                // rule 3 paths start with a WEAK link (inverted alternation)
                // and also close weak
                links: [
                  ...alternatingLinks(nodeCds(nodes, path, d)).map((l) => ({
                    ...l,
                    strong: !l.strong
                  })),
                  {
                    from: nodes[path[path.length - 1]].cells.map((cell) => ({ cell, digit: d })),
                    to: nodes[path[0]].cells.map((cell) => ({ cell, digit: d })),
                    strong: false
                  }
                ],
                description: tr`Grouped X-Cycle on ${d}: the loop closes with two weak links at the group ${cellNames(startCells)}, so none of those cells can be ${d}.`
              };
            }
          }
        }
        const nexts = [];
        if (nextType === "strong") {
          for (const n of strong.get(cur) ?? []) nexts.push(n);
        } else {
          for (let n = 0; n < nodes.length; n++) {
            if (n !== cur && weakLinked(nodes[cur], nodes[n])) nexts.push(n);
          }
        }
        for (const next of nexts) {
          if (path.includes(next) || pathHasCellOverlap(path, next)) continue;
          const res = dfs([...path, next], nextType === "strong" ? "weak" : "strong", firstWeak);
          if (res) return res;
        }
        return null;
      };
      for (let start = 0; start < nodes.length; start++) {
        if (strong.has(start)) {
          const res = dfs([start], "strong", false);
          if (res) return res;
        }
        if (nodes[start].cells.length >= 2) {
          const res = dfs([start], "weak", true);
          if (res) return res;
        }
      }
    }
    return null;
  }
  function rule22(g, d, nodes, path) {
    const start = nodes[path[0]];
    const inPath = new Set(path.flatMap((n) => nodes[n].cells));
    if (start.cells.length === 1) {
      return {
        tech: "GROUPED_X_CYCLES",
        labels: { primary: tr`the loop on ${d}, with grouped nodes` },
        placements: [{ cell: start.cells[0], digit: d }],
        eliminations: [],
        primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: d }))),
        links: alternatingLinks(nodeCds(nodes, path, d), "strong"),
        description: tr`Grouped X-Cycle on ${d}: the loop closes with two strong links at ${cellNames(start.cells)}, forcing it to be ${d}.`
      };
    }
    const elims = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0 || inPath.has(c)) continue;
      if (!(g.cands[c] & bit(d))) continue;
      if (start.cells.every((sc) => sees(c, sc))) elims.push({ cell: c, digit: d });
    }
    if (!elims.length) return null;
    return {
      tech: "GROUPED_X_CYCLES",
      labels: { primary: tr`the loop on ${d}, with grouped nodes` },
      placements: [],
      eliminations: elims,
      primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: d }))),
      links: alternatingLinks(nodeCds(nodes, path, d), "strong"),
      description: tr`Grouped X-Cycle on ${d}: two strong links meet at the group ${cellNames(start.cells)}, so ${d} lives there and falls from every cell seeing the whole group.`
    };
  }
  function rule12(g, d, nodes, path) {
    const inPath = new Set(path.flatMap((n) => nodes[n].cells));
    const elims = [];
    const seen = /* @__PURE__ */ new Set();
    for (let i = 1; i < path.length; i += 2) {
      const A = nodes[path[i]];
      const B = nodes[path[(i + 1) % path.length]];
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0 || inPath.has(c) || seen.has(c)) continue;
        if (!(g.cands[c] & bit(d))) continue;
        if (A.cells.every((a) => sees(c, a)) && B.cells.every((b) => sees(c, b))) {
          seen.add(c);
          elims.push({ cell: c, digit: d });
        }
      }
    }
    if (!elims.length) return null;
    return {
      tech: "GROUPED_X_CYCLES",
      labels: { primary: tr`the loop on ${d}, with grouped nodes` },
      placements: [],
      eliminations: elims,
      primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: d }))),
      links: alternatingLinks(nodeCds(nodes, path, d), "weak"),
      description: tr`Grouped X-Cycle on ${d}: a continuous loop through ${path.length} nodes (groups included); along each weak link one side is ${d}, so ${d} falls from outside cells seeing both sides.`
    };
  }

  // vendor/sudokui/engine/techniques/groupedAic.ts
  var nodeCds2 = (nodes, path) => path.map((n) => nodes[n].cells.map((cell) => ({ cell, digit: nodes[n].digit })));
  function findGroupedAic(g, maxNodes = 10) {
    return search(g, "chain", maxNodes);
  }
  function findGroupedNiceLoop(g, maxNodes = 10) {
    return search(g, "loop", maxNodes);
  }
  function search(g, mode, maxNodes) {
    const nodes = [];
    const candId = /* @__PURE__ */ new Map();
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0) continue;
      for (const d of digitsOf(g.cands[c])) {
        candId.set(c * 9 + d - 1, nodes.length);
        nodes.push({ cells: [c], digit: d });
      }
    }
    const firstGroup = nodes.length;
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      for (let b = 0; b < 9; b++) {
        const inBox = UNITS[18 + b].filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        for (const lineOf of [rowOf, colOf]) {
          const byLine = /* @__PURE__ */ new Map();
          for (const c of inBox) {
            const l = lineOf(c);
            if (!byLine.has(l)) byLine.set(l, []);
            byLine.get(l).push(c);
          }
          for (const seg of byLine.values()) {
            if (seg.length >= 2) nodes.push({ cells: seg, digit: d });
          }
        }
      }
    }
    const alsPairs = [];
    if (mode === "chain") {
      const alses = collectAls(g, 3, 90);
      for (let a = 0; a < alses.length; a++) {
        const ids = [];
        for (const d of digitsOf(alses[a].mask)) {
          const cells = alses[a].cells.filter((c) => g.cands[c] & bit(d));
          if (!cells.length) continue;
          ids.push(nodes.length);
          nodes.push({ cells, digit: d, als: a });
        }
        for (let x = 0; x < ids.length; x++) {
          for (let y = x + 1; y < ids.length; y++) alsPairs.push([ids[x], ids[y]]);
        }
      }
    }
    if (firstGroup === nodes.length) return null;
    const disjoint = (a, b) => !a.cells.some((c) => b.cells.includes(c));
    const sameDigitWeak = (a, b) => a.digit === b.digit && disjoint(a, b) && a.cells.every((ca) => b.cells.every((cb) => sees(ca, cb)));
    const weakLinked = (a, b) => {
      if (a.digit === b.digit) return sameDigitWeak(a, b);
      return a.cells.length === 1 && b.cells.length === 1 && a.cells[0] === b.cells[0];
    };
    const strong = /* @__PURE__ */ new Map();
    const addStrong = (i, j) => {
      if (!strong.has(i)) strong.set(i, []);
      if (!strong.has(j)) strong.set(j, []);
      strong.get(i).push(j);
      strong.get(j).push(i);
    };
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0) continue;
      const ds = digitsOf(g.cands[c]);
      if (ds.length === 2) {
        addStrong(candId.get(c * 9 + ds[0] - 1), candId.get(c * 9 + ds[1] - 1));
      }
    }
    for (const [x, y] of alsPairs) addStrong(x, y);
    for (let d = 1; d <= 9; d++) {
      const mask = bit(d);
      const digitNodes = [];
      for (let n = 0; n < nodes.length; n++) {
        if (nodes[n].digit === d && nodes[n].als === void 0) digitNodes.push(n);
      }
      for (const unit of UNITS) {
        const uc = unit.filter((c) => g.values[c] === 0 && g.cands[c] & mask);
        if (uc.length < 2) continue;
        const inUnit = digitNodes.filter((n) => nodes[n].cells.every((c) => unit.includes(c)));
        for (let x = 0; x < inUnit.length; x++) {
          for (let y = x + 1; y < inUnit.length; y++) {
            const A = nodes[inUnit[x]];
            const B = nodes[inUnit[y]];
            if (!disjoint(A, B)) continue;
            if (A.cells.length + B.cells.length !== uc.length) continue;
            addStrong(inUnit[x], inUnit[y]);
          }
        }
      }
    }
    if (!strong.size) return null;
    const conflictsOf2 = (n) => {
      const out = /* @__PURE__ */ new Set();
      const node2 = nodes[n];
      if (node2.cells.length === 1) {
        const cell = node2.cells[0];
        for (const d of digitsOf(g.cands[cell])) {
          if (d !== node2.digit) out.add(cell * 9 + d - 1);
        }
      }
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0 || node2.cells.includes(c)) continue;
        if (!(g.cands[c] & bit(node2.digit))) continue;
        if (node2.cells.every((nc) => sees(c, nc))) out.add(c * 9 + node2.digit - 1);
      }
      return out;
    };
    const coveredByPath = (path, cell, digit) => path.some((p) => nodes[p].digit === digit && nodes[p].cells.includes(cell));
    const overlapsPath = (path, n) => path.some((p) => nodes[p].digit === nodes[n].digit && !disjoint(nodes[p], nodes[n]));
    const label = (n) => `${nodes[n].digit}@${nodes[n].cells.length === 1 ? cellName(nodes[n].cells[0]) : `[${cellNames(nodes[n].cells)}]`}`;
    let budget = 4e4;
    const weakNbrs = (n) => {
      const out = [];
      for (let m = 0; m < nodes.length; m++) {
        if (m !== n && weakLinked(nodes[n], nodes[m])) out.push(m);
      }
      return out;
    };
    for (let start = 0; start < nodes.length; start++) {
      if (!strong.has(start)) continue;
      const startConf = mode === "chain" ? conflictsOf2(start) : null;
      const dfs = (path, nextType) => {
        if (budget-- <= 0 || path.length > maxNodes) return null;
        const cur = path[path.length - 1];
        const groupInPath = path.some((p) => nodes[p].cells.length > 1);
        const alsInPath = path.some((p) => nodes[p].als !== void 0);
        if (mode === "chain" && nextType === "weak" && path.length >= 4 && (groupInPath || alsInPath)) {
          const endConf = conflictsOf2(cur);
          const elims = [];
          for (const id of startConf) {
            if (!endConf.has(id)) continue;
            const cell = Math.floor(id / 9);
            const digit = id % 9 + 1;
            if (coveredByPath(path, cell, digit)) continue;
            elims.push({ cell, digit });
          }
          if (elims.length) {
            const chain = path.map(label).join(" \u2192 ");
            return {
              tech: alsInPath ? "AIC_ALS" : "AIC_GROUPED",
              placements: [],
              eliminations: elims,
              primary: path.flatMap(
                (n) => nodes[n].cells.map((cell) => ({ cell, digit: nodes[n].digit }))
              ),
              links: alternatingLinks(nodeCds2(nodes, path)),
              description: alsInPath ? tr`AIC with ALS: ${chain}; at least one end is true, so candidates conflicting with both ends are removed.` : tr`Grouped AIC: ${chain}; at least one end is true, so candidates conflicting with both ends are removed.`
            };
          }
        }
        if (mode === "loop" && path.length >= 4 && groupInPath) {
          const lastWasStrong = nextType === "weak";
          if (!lastWasStrong && (strong.get(cur) ?? []).includes(path[0])) {
            const step = loopRule2(g, nodes, path, label);
            if (step) return step;
          }
          if (lastWasStrong && weakLinked(nodes[cur], nodes[path[0]]) && path.length % 2 === 0) {
            const step = loopRule1(g, nodes, path, coveredByPath, label);
            if (step) return step;
          }
        }
        const nexts = nextType === "strong" ? strong.get(cur) ?? [] : weakNbrs(cur);
        for (const next of nexts) {
          if (path.includes(next) || overlapsPath(path, next)) continue;
          const res2 = dfs([...path, next], nextType === "strong" ? "weak" : "strong");
          if (res2) return res2;
        }
        return null;
      };
      const res = dfs([start], "strong");
      if (res) return res;
      if (budget <= 0) return null;
    }
    return null;
  }
  function loopRule2(g, nodes, path, label) {
    const start = nodes[path[0]];
    const chain = path.map(label).join(" \u2192 ");
    if (start.cells.length === 1) {
      return {
        tech: "GROUPED_NICE_LOOP",
        labels: { primary: tr`the loop, with grouped nodes` },
        placements: [{ cell: start.cells[0], digit: start.digit }],
        eliminations: [],
        primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: nodes[n].digit }))),
        links: alternatingLinks(nodeCds2(nodes, path), "strong"),
        description: tr`Grouped Nice Loop: ${chain} closes with two strong links at the start: denying it forces it, so it is placed.`
      };
    }
    const inPath = new Set(path.flatMap((n) => nodes[n].cells.map((c) => c * 9 + nodes[n].digit - 1)));
    const elims = [];
    for (let c = 0; c < 81; c++) {
      if (g.values[c] !== 0 || !(g.cands[c] & bit(start.digit))) continue;
      if (inPath.has(c * 9 + start.digit - 1)) continue;
      if (start.cells.every((sc) => sees(c, sc))) elims.push({ cell: c, digit: start.digit });
    }
    if (!elims.length) return null;
    return {
      tech: "GROUPED_NICE_LOOP",
      labels: { primary: tr`the loop, with grouped nodes` },
      placements: [],
      eliminations: elims,
      primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: nodes[n].digit }))),
      links: alternatingLinks(nodeCds2(nodes, path), "strong"),
      description: tr`Grouped Nice Loop: ${chain} closes with two strong links at the start group, so the digit lives there and falls from every cell seeing the whole group.`
    };
  }
  function loopRule1(g, nodes, path, coveredByPath, label) {
    const elims = [];
    const seen = /* @__PURE__ */ new Set();
    const add = (cell, digit) => {
      const key = `${cell}-${digit}`;
      if (!seen.has(key)) {
        seen.add(key);
        elims.push({ cell, digit });
      }
    };
    for (let i = 1; i < path.length; i += 2) {
      const U = nodes[path[i]];
      const V = nodes[path[(i + 1) % path.length]];
      if (U.digit !== V.digit) {
        const cell = U.cells[0];
        for (const d of digitsOf(g.cands[cell])) {
          if (d !== U.digit && d !== V.digit) add(cell, d);
        }
      } else {
        const d = U.digit;
        for (let c = 0; c < 81; c++) {
          if (g.values[c] !== 0 || !(g.cands[c] & bit(d))) continue;
          if (coveredByPath(path, c, d)) continue;
          if (U.cells.every((u) => sees(c, u)) && V.cells.every((v) => sees(c, v))) add(c, d);
        }
      }
    }
    if (!elims.length) return null;
    return {
      tech: "GROUPED_NICE_LOOP",
      labels: { primary: tr`the loop, with grouped nodes` },
      placements: [],
      eliminations: elims,
      primary: path.flatMap((n) => nodes[n].cells.map((cell) => ({ cell, digit: nodes[n].digit }))),
      links: alternatingLinks(nodeCds2(nodes, path), "weak"),
      description: tr`Grouped Nice Loop: the continuous loop ${path.map(label).join(" \u2192 ")} alternates perfectly; every weak link has exactly one true side, clearing candidates along it.`
    };
  }

  // vendor/sudokui/engine/techniques/fireworks.ts
  function findFireworks(g) {
    for (let b = 0; b < 9; b++) {
      for (const A of UNITS[18 + b]) {
        if (g.values[A] !== 0) continue;
        const r = rowOf(A);
        const c = colOf(A);
        const rowOutside = UNITS[r].filter((x) => boxOf(x) !== b);
        const colOutside = UNITS[9 + c].filter((x) => boxOf(x) !== b);
        for (const B of rowOutside) {
          if (g.values[B] !== 0) continue;
          for (const C of colOutside) {
            if (g.values[C] !== 0) continue;
            let dMask = 0;
            for (let d = 1; d <= 9; d++) {
              const m = bit(d);
              if (UNITS[r].some((x) => g.values[x] === d)) continue;
              if (UNITS[9 + c].some((x) => g.values[x] === d)) continue;
              if (rowOutside.some((x) => x !== B && g.values[x] === 0 && g.cands[x] & m)) continue;
              if (colOutside.some((x) => x !== C && g.values[x] === 0 && g.cands[x] & m)) continue;
              dMask |= m;
            }
            if (popcount(dMask) !== 3) continue;
            const cells = [A, B, C];
            if (digitsOf(dMask).some((d) => !cells.some((x) => g.cands[x] & bit(d)))) {
              continue;
            }
            const elims = [];
            for (const x of cells) {
              for (const d of digitsOf(g.cands[x] & ~dMask)) elims.push({ cell: x, digit: d });
            }
            if (!elims.length) continue;
            return {
              tech: "FIREWORKS",
              placements: [],
              eliminations: elims,
              primary: cells.flatMap(
                (cell) => digitsOf(g.cands[cell] & dMask).map((digit) => ({ cell, digit }))
              ),
              labels: { primary: tr`the cross and its two wings: the only cells ${digitsOf(dMask).join("/")} can land on` },
              description: tr`Fireworks: digits ${digitsOf(dMask).join("/")} each must land on one of ${cellName(A)} (cross), ${cellName(B)} (row wing) or ${cellName(C)} (column wing), locking those three cells, so all other candidates there are removed.`
            };
          }
        }
      }
    }
    return null;
  }

  // vendor/sudokui/engine/techniques/tridagon.ts
  function findTridagon(g) {
    const trios = /* @__PURE__ */ new Set();
    for (let c = 0; c < 81; c++) {
      if (g.values[c] === 0 && popcount(g.cands[c]) === 3) trios.add(g.cands[c]);
    }
    for (const T of trios) {
      const pure = Array.from({ length: 9 }, () => []);
      const near = Array.from({ length: 9 }, () => []);
      for (let c = 0; c < 81; c++) {
        if (g.values[c] !== 0) continue;
        const m = g.cands[c];
        if ((m & ~T) === 0 && popcount(m) >= 2) pure[boxOf(c)].push(c);
        else if ((m & T) !== 0 && popcount(m & ~T) <= 2 && popcount(m & T) >= 2) {
          near[boxOf(c)].push(c);
        }
      }
      for (const bands of [[0, 1], [0, 2], [1, 2]]) {
        for (const stacks of [[0, 1], [0, 2], [1, 2]]) {
          const boxes = [
            bands[0] * 3 + stacks[0],
            bands[0] * 3 + stacks[1],
            bands[1] * 3 + stacks[0],
            bands[1] * 3 + stacks[1]
          ];
          if (!boxes.every((b) => pure[b].some((c) => g.cands[c] === T))) continue;
          for (let gi = 0; gi < 4; gi++) {
            if (!boxes.every((b, k) => pure[b].length >= (k === gi ? 2 : 3))) continue;
            for (const guardian of near[boxes[gi]]) {
              const triples = boxes.map(
                (b, k) => k === gi ? combinations(pure[b], 2).slice(0, 12).map((pair) => [guardian, ...pair]) : combinations(pure[b], 3).slice(0, 12)
              );
              let budget = 300;
              for (const t0 of triples[0]) {
                for (const t1 of triples[1]) {
                  for (const t2 of triples[2]) {
                    for (const t3 of triples[3]) {
                      if (budget-- <= 0) break;
                      const cells = [...t0, ...t1, ...t2, ...t3];
                      if (trioSatisfiable(cells)) continue;
                      const elims = digitsOf(g.cands[guardian] & T).map((digit) => ({
                        cell: guardian,
                        digit
                      }));
                      if (!elims.length) continue;
                      const fallen = elims.map((e) => e.digit).join("/");
                      return {
                        tech: "TRIDAGON",
                        placements: [],
                        eliminations: elims,
                        primary: cells.filter((c) => c !== guardian).flatMap(
                          (cell) => digitsOf(g.cands[cell] & T).map((digit) => ({ cell, digit }))
                        ),
                        secondary: digitsOf(g.cands[guardian] & ~T).map((digit) => ({
                          cell: guardian,
                          digit
                        })),
                        description: tr`Tridagon: the cells ${cellNames(cells)} cannot all take digits from ${digitsOf(T).join("")} (proven by complete case analysis), so the guardian ${cellName(guardian)} must take one of its other candidates, so ${fallen} fall from it.`
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  }
  function trioSatisfiable(cells) {
    const assign = new Array(cells.length).fill(0);
    const ok = (i, d) => {
      for (let j = 0; j < i; j++) {
        if (assign[j] === d && sees(cells[i], cells[j])) return false;
      }
      return true;
    };
    const rec = (i) => {
      if (i === cells.length) return true;
      for (let d = 1; d <= 3; d++) {
        if (ok(i, d)) {
          assign[i] = d;
          if (rec(i + 1)) return true;
        }
      }
      return false;
    };
    return rec(0);
  }

  // vendor/sudokui/engine/humanSolver.ts
  var FINDERS = {
    FULL_HOUSE: findFullHouse,
    NAKED_SINGLE: findNakedSingle,
    HIDDEN_SINGLE: findHiddenSingle,
    LOCKED_PAIR: (g) => findNakedSubset(g, 2, true),
    LOCKED_TRIPLE: (g) => findNakedSubset(g, 3, true),
    LOCKED_CANDIDATES_1: findLockedCandidates1,
    LOCKED_CANDIDATES_2: findLockedCandidates2,
    NAKED_PAIR: (g) => findNakedSubset(g, 2, false),
    NAKED_TRIPLE: (g) => findNakedSubset(g, 3, false),
    HIDDEN_PAIR: (g) => findHiddenSubset(g, 2),
    HIDDEN_TRIPLE: (g) => findHiddenSubset(g, 3),
    NAKED_QUADRUPLE: (g) => findNakedSubset(g, 4, false),
    HIDDEN_QUADRUPLE: (g) => findHiddenSubset(g, 4),
    X_WING: (g) => findBasicFish(g, 2),
    SWORDFISH: (g) => findBasicFish(g, 3),
    JELLYFISH: (g) => findBasicFish(g, 4),
    SQUIRMBAG: (g) => findBasicFish(g, 5),
    WHALE: (g) => findBasicFish(g, 6),
    LEVIATHAN: (g) => findBasicFish(g, 7),
    REMOTE_PAIR: findRemotePair,
    CHUTE_REMOTE_PAIR: findChuteRemotePair,
    BUG_PLUS_1: findBugPlus1,
    SKYSCRAPER: (g) => findTurbotFamily(g, "SKYSCRAPER"),
    TWO_STRING_KITE: (g) => findTurbotFamily(g, "TWO_STRING_KITE"),
    TURBOT_FISH: (g) => findTurbotFamily(g, "TURBOT_FISH"),
    EMPTY_RECTANGLE: findEmptyRectangle,
    W_WING: findWWing,
    XY_WING: findXYWing,
    XYZ_WING: findXYZWing,
    WXYZ_WING: findWxyzWing,
    UNIQUENESS_1: (g) => findUniqueness(g, 1),
    UNIQUENESS_2: (g) => findUniqueness(g, 2),
    UNIQUENESS_3: (g) => findUniqueness(g, 3),
    UNIQUENESS_4: (g) => findUniqueness(g, 4),
    UNIQUENESS_5: (g) => findUniqueness(g, 5),
    UNIQUENESS_6: (g) => findUniqueness(g, 6),
    HIDDEN_RECTANGLE: findHiddenRectangle,
    AVOIDABLE_RECTANGLE_1: (g) => findAvoidableRectangle(g, 1),
    AVOIDABLE_RECTANGLE_2: (g) => findAvoidableRectangle(g, 2),
    FINNED_X_WING: (g) => findFinnedFish(g, 2, false),
    SASHIMI_X_WING: (g) => findFinnedFish(g, 2, true),
    FINNED_SWORDFISH: (g) => findFinnedFish(g, 3, false),
    SASHIMI_SWORDFISH: (g) => findFinnedFish(g, 3, true),
    FINNED_JELLYFISH: (g) => findFinnedFish(g, 4, false),
    SASHIMI_JELLYFISH: (g) => findFinnedFish(g, 4, true),
    EXTENDED_RECTANGLE: findExtendedRectangle,
    SUE_DE_COQ: findSueDeCoq,
    SIMPLE_COLORS: findSimpleColors,
    MULTI_COLORS: findMultiColors,
    MEDUSA_3D: findMedusa3d,
    X_CHAIN: (g) => findXChain(g),
    X_CYCLES: (g) => findXCycles(g),
    GROUPED_X_CYCLES: (g) => findGroupedXCycles(g),
    NICE_LOOP: (g) => findNiceLoop(g),
    GROUPED_NICE_LOOP: (g) => findGroupedNiceLoop(g),
    // one engine serves both: it labels steps AIC_ALS when an ALS node takes
    // part and AIC_GROUPED otherwise, so a second call would be pure waste
    AIC_GROUPED: (g) => findGroupedAic(g),
    FIREWORKS: findFireworks,
    TRIDAGON: findTridagon,
    XY_CHAIN: (g) => findXYChain(g),
    ALS_XZ: findAlsXz,
    ALS_XY_WING: findAlsXyWing,
    ALS_XY_CHAIN: findAlsXyChain,
    AIC: (g) => findAic(g),
    DEATH_BLOSSOM: findDeathBlossom,
    FRANKEN_X_WING: (g) => findFrankenFish(g, 2),
    FRANKEN_SWORDFISH: (g) => findFrankenFish(g, 3),
    ALIGNED_PAIR_EXCLUSION: findAlignedPairExclusion,
    EXOCET: findExocet,
    DOUBLE_EXOCET: findDoubleExocet,
    // disabled by default: line elims are a naked quad
    FORCING_NET: findForcingNet,
    PATTERN_OVERLAY: (g) => findPatternOverlay(g),
    DIGIT_FORCING_CHAIN: findDigitForcing,
    NISHIO_FORCING_CHAIN: findNishio,
    CELL_FORCING_CHAIN: findCellForcing,
    UNIT_FORCING_CHAIN: findUnitForcing
  };
  function findNextStep(g, order = SOLVE_ORDER) {
    for (const tech of order) {
      const finder = FINDERS[tech];
      if (!finder) continue;
      const step = finder(g);
      if (step) return step;
    }
    return null;
  }
  function applyStep(g, step) {
    for (const { cell, digit } of step.eliminations) g.cands[cell] &= ~bit(digit);
    for (const { cell, digit } of step.placements) setValue(g, cell, digit);
  }

  // walkthrough.ts
  var ACTIVE_SOLVE_ORDER = SOLVE_ORDER.filter((tech) => tech !== "CHUTE_REMOTE_PAIR");
  function techniqueCatalog() {
    return ACTIVE_SOLVE_ORDER.map((key) => ({ key, ...TECHS[key] }));
  }
  function betweenMasks(givens) {
    const masks = Array(81).fill(511);
    for (let n = 0; n < 9; n++) for (const line of [Array.from({ length: 9 }, (_, i) => n * 9 + i), Array.from({ length: 9 }, (_, i) => i * 9 + n)]) {
      let prior = -1;
      for (let pos = 0; pos < 9; pos++) if (givens[line[pos]]) {
        if (prior >= 0) {
          const lo = Math.min(givens[line[prior]], givens[line[pos]]), hi = Math.max(givens[line[prior]], givens[line[pos]]);
          let mask = 0;
          for (let d = lo + 1; d < hi; d++) mask |= bit(d);
          for (let p = prior + 1; p < pos; p++) masks[line[p]] &= mask;
        }
        prior = pos;
      }
    }
    return masks;
  }
  function walkthrough(givens, solution) {
    const g = parseGrid(givens.map((d) => d || ".").join(""));
    if (!g) throw new Error("Invalid puzzle");
    const masks = betweenMasks(givens);
    for (let i = 0; i < 81; i++) if (!g.values[i]) g.cands[i] &= masks[i];
    const steps = [{ tech: "BETWEEN_NOTATION", placements: [], eliminations: [], description: "Snyder notation: add candidates to every blank cell, applying normal Sudoku and Between restrictions." }];
    const candidateStates = [Array.from(g.cands)];
    const techniques = { BETWEEN_NOTATION: 1 };
    let score = 0, level = "Beginner", guard = 0;
    while (!isSolved(g) && guard++ < 400) {
      let step = findNextStep(g, ACTIVE_SOLVE_ORDER);
      if (!step) {
        const cell = Array.from(g.values).findIndex((v) => !v);
        if (cell < 0) break;
        step = { tech: "BRUTE_FORCE", placements: [{ cell, digit: solution[cell] }], eliminations: [], description: `No active logical technique applies. Set r${Math.floor(cell / 9) + 1}c${cell % 9 + 1} to ${solution[cell]}. This adds 10000 to the difficulty score.` };
      }
      const before = Array.from(g.cands);
      applyStep(g, step);
      const removedCandidates = [];
      for (let cell = 0; cell < 81; cell++) {
        if (g.values[cell]) continue;
        for (let digit = 1; digit <= 9; digit++) if (before[cell] & bit(digit) && !(g.cands[cell] & bit(digit))) removedCandidates.push({ cell, digit });
      }
      step.removedCandidates = removedCandidates;
      candidateStates.push(Array.from(g.cands));
      steps.push(step);
      techniques[step.tech] = (techniques[step.tech] || 0) + 1;
      const info = TECHS[step.tech];
      score += info.score;
      level = maxLevel(level, bandFloor(info.level));
    }
    return { steps, candidateStates, techniques, score, level, solvable: !Object.hasOwn(techniques, "BRUTE_FORCE") };
  }
  return __toCommonJS(walkthrough_exports);
})();
