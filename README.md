# Between Sudoku

Open `index.html` in a browser. Select a cell and use the number buttons or keyboard to enter a given; use Clear, Backspace, or Delete to remove it. Marks automatically show the intersection of the applicable between ranges. They do not yet account for ordinary Sudoku peer restrictions.

Use **Generate puzzle** to build a random puzzle with exactly one solution. Generation runs in a background worker, can be cancelled, and uses backtracking to count up to two solutions. If one attempt reaches 1 second, its givens are discarded and the generator starts again from an empty grid. The current board is replaced only on success. Editing the board cancels generation. The reported givens and elapsed time describe the successful attempt; the generator does not guarantee minimal clues or a particular difficulty. Run `node tests/generator.test.js` to check the solution counter and generated puzzles.

**Keep givens orthogonally separate** is enabled by default. It prevents newly generated givens from sharing an edge, while diagonal givens remain valid. If no eligible cell remains before a unique puzzle is found, the generator discards the attempt and restarts with an empty grid.

Use the copy buttons to place the current givens on the clipboard as an 81-character string (`.` means blank) or as a PNG grid. Generated puzzles include a difficulty rating and walkthrough. Its first step places all Snyder candidates using the normal Sudoku and Between restrictions; move the slider to inspect each imported sudokUI technique with its highlighted pattern, supports, eliminations, and placements. Some unusual puzzles may finish with a clearly marked search placement when the imported logical catalogue has no next step.

The classic Sudoku engine in `vendor/sudokui/engine` is copied from [sudokUI](https://github.com/AImenes/sudokUI), commit `0629179bc03957497926a03eb4d09481780cbc9f`. Its GPL-3.0 license is included alongside it. The engine is retained for future integration; it is not connected to the grid.
