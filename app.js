'use strict';
const givens = Array(81).fill(0);
let selected = 0;
const grid = document.querySelector('.grid');
const mainLayout = document.querySelector('.layout');
const status = document.querySelector('#status');
const generateButton = document.querySelector('#generate');
const cancelButton = document.querySelector('#cancel-generation');
const generationStatus = document.querySelector('#generation-status');
const generationMethod = document.querySelector('#generation-method');
const noAdjacentGivens = document.querySelector('#no-adjacent-givens');
const copyStringButton = document.querySelector('#copy-string');
const copyImageButton = document.querySelector('#copy-image');
const copyCompletedStringButton = document.querySelector('#copy-completed-string');
const copyCompletedImageButton = document.querySelector('#copy-completed-image');
const walkthroughPanel = document.querySelector('#walkthrough');
const walkSlider = document.querySelector('#walk-slider');
const walkFirst = document.querySelector('#walk-first');
const walkPrev = document.querySelector('#walk-prev');
const walkNext = document.querySelector('#walk-next');
const walkLast = document.querySelector('#walk-last');
const walkNumber = document.querySelector('#walk-number');
const walkDescription = document.querySelector('#walk-description');
const difficulty = document.querySelector('#difficulty');
const techniqueSummary = document.querySelector('#technique-summary');
const aboutButton = document.querySelector('#about');
const aboutDialog = document.querySelector('#about-dialog');
const closeAbout = document.querySelector('#close-about');
const techniqueRatings = new Map(BetweenSudokuTechniques.techniqueCatalog().map(technique => [technique.key, technique.score]));
techniqueRatings.set('BETWEEN_NOTATION', 1);
function renderTechniqueSummary(target, steps, goToStep) {
  const groups = new Map();
  steps.forEach((step, index) => {
    if (!groups.has(step.tech)) groups.set(step.tech, []);
    groups.get(step.tech).push(index + 1);
  });
  target.replaceChildren();
  [...groups.entries()].sort(([left], [right]) => (techniqueRatings.get(left) ?? Infinity) - (techniqueRatings.get(right) ?? Infinity) || left.localeCompare(right)).forEach(([key, locations]) => {
    const row = document.createElement('tr');
    const technique = document.createElement('td');
    const text = key.replaceAll('_', ' ').toLowerCase();
    technique.textContent = text[0].toUpperCase() + text.slice(1);
    const stepsCell = document.createElement('td');
    locations.forEach((stepNumber, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'technique-step-link'; button.textContent = stepNumber; button.setAttribute('aria-label', `Go to step ${stepNumber}`);
      button.addEventListener('click', () => goToStep(stepNumber - 1)); stepsCell.appendChild(button);
      if (index < locations.length - 1) stepsCell.append(' ');
    });
    row.append(technique, stepsCell); target.appendChild(row);
  });
}
function walkthroughRemovedCandidates(data, index) {
  const removed = new Map();
  for (const item of data.steps[index]?.removedCandidates || []) {
    if (!removed.has(item.cell)) removed.set(item.cell, new Set());
    removed.get(item.cell).add(item.digit);
  }
  return removed;
}
function appendWalkthroughCellContent(cell, digit, candidateMask, removed) {
  if (digit) { cell.textContent = digit; return; }
  const marks = document.createElement('span'); marks.className = 'walk-marks';
  for (let value = 1; value <= 9; value++) {
    const mark = document.createElement('span'); const struck = removed?.has(value);
    mark.textContent = candidateMask & (1 << (value - 1)) || struck ? value : '';
    if (struck) mark.classList.add('removed-mark'); marks.appendChild(mark);
  }
  cell.appendChild(marks);
}
function bindWalkControls(slider, update, first, previous, next, last) {
  slider.addEventListener('input', update);
  first.addEventListener('click', () => { slider.value = 0; update(); });
  previous.addEventListener('click', () => { slider.value = Math.max(0, Number(slider.value) - 1); update(); });
  next.addEventListener('click', () => { slider.value = Math.min(Number(slider.max), Number(slider.value) + 1); update(); });
  last.addEventListener('click', () => { slider.value = slider.max; update(); });
}
let walkthrough = null;
let walkIndex = 0;
let completedSolution = null;
let generationWorker = null;
let generationWorkerUrl = null;
aboutButton.addEventListener('click', () => aboutDialog.showModal());
closeAbout.addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', event => { if (event.target === aboutDialog) aboutDialog.close(); });
function stopGeneration() {
  if (generationWorker) generationWorker.terminate();
  if (generationWorkerUrl) URL.revokeObjectURL(generationWorkerUrl);
  generationWorker = null;
  generationWorkerUrl = null;
  generateButton.disabled = false;
  cancelButton.hidden = true;
}
cancelButton.addEventListener('click', () => {
  stopGeneration();
  generationStatus.textContent = 'Generation cancelled.';
});
generateButton.addEventListener('click', () => {
  try {
    const source = `const betweenCandidates = ${betweenCandidates.toString()};\nconst createGenerator = ${createGenerator.toString()};\n` +
      `try { let last = 0; const result = createGenerator(betweenCandidates).generate({ method: ${JSON.stringify(generationMethod.value)}, timeoutMs: 120000, restartAfterMs: 1000, noOrthogonalAdjacent: ${noAdjacentGivens.checked}, onProgress: progress => { if (performance.now() - last > 200) { last = performance.now(); postMessage({ type: 'progress', ...progress }); } } }); postMessage({ type: 'done', result }); } catch (error) { postMessage({ type: 'error', message: error.message }); }`;
    generationWorkerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    generationWorker = new Worker(generationWorkerUrl);
  } catch (error) {
    if (generationWorkerUrl) URL.revokeObjectURL(generationWorkerUrl);
    generationWorkerUrl = null;
    generationStatus.textContent = 'Unable to start the generator in this browser.';
    return;
  }
  generateButton.disabled = true;
  cancelButton.hidden = false;
  generationStatus.textContent = `Generating puzzle with ${generationMethod.options[generationMethod.selectedIndex].text.toLowerCase()}…`;
  const worker = generationWorker;
  worker.onmessage = event => {
    if (worker !== generationWorker) return;
    const message = event.data;
    if (message.type === 'progress') {
      generationStatus.textContent = `Generating… ${message.givenCount} givens placed${message.restarts ? ` · restarted ${message.restarts} time${message.restarts === 1 ? '' : 's'}` : ''}`;
    } else if (message.type === 'done') {
      stopGeneration();
      givens.splice(0, 81, ...message.result.givens);
      completedSolution = message.result.solution;
      copyCompletedStringButton.disabled = false; copyCompletedImageButton.disabled = false;
      try { setWalkthrough(BetweenSudokuTechniques.walkthrough(message.result.givens, message.result.solution)); }
      catch { walkthrough = null; mainLayout.classList.remove('main-walkthrough'); walkthroughPanel.hidden = true; render(); }
      const rating = walkthrough ? ` · ${walkthrough.level} · score ${walkthrough.score}` : '';
      generationStatus.textContent = `Generated with ${message.result.givenCount} givens${rating} in ${(message.result.elapsedMs / 1000).toFixed(2)} seconds.`;
    } else if (message.type === 'error') {
      stopGeneration();
      generationStatus.textContent = message.message === 'timeout' ? 'Generation timed out after 2 minutes. Please try again.' : 'Generation failed. Please try again.';
    }
  };
  worker.onerror = () => {
    if (worker !== generationWorker) return;
    stopGeneration();
    generationStatus.textContent = 'Unable to run the generator in this browser.';
  };
  worker.postMessage({ type: 'generate' });
});
const cells = Array.from({ length: 81 }, (_, index) => {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'cell';
  cell.setAttribute('role', 'gridcell');
  cell.addEventListener('click', () => { selected = index; render(); cell.focus(); });
  grid.appendChild(cell);
  return cell;
});
function setGiven(value) {
  if (generationWorker) { stopGeneration(); generationStatus.textContent = 'Generation cancelled because the grid was edited.'; }
  else generationStatus.textContent = '';
  walkthrough = null; mainLayout.classList.remove('main-walkthrough'); completedSolution = null; walkthroughPanel.hidden = true;
  copyCompletedStringButton.disabled = true; copyCompletedImageButton.disabled = true;
  givens[selected] = value; render(); cells[selected].focus();
}
function currentStep() { return walkthrough ? walkthrough.steps[walkIndex] : null; }
function visibleCandidates() {
  if (walkthrough?.candidateStates) return walkthrough.candidateStates[walkIndex].map((mask, index) => {
    if (displayValues()[index]) return [];
    return Array.from({ length: 9 }, (_, digit) => digit + 1).filter(digit => mask & (1 << (digit - 1)));
  });
  const between = betweenCandidates(givens);
  return givens.map((given, i) => {
    if (given) return [];
    const used = new Set(); const row = Math.floor(i / 9), col = i % 9, boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
    for (let n = 0; n < 9; n++) { used.add(givens[row * 9 + n]); used.add(givens[n * 9 + col]); used.add(givens[(boxRow + Math.floor(n / 3)) * 9 + boxCol + n % 3]); }
    return (between[i] === null ? [1,2,3,4,5,6,7,8,9] : between[i]).filter(d => !used.has(d));
  });
}
function removedWalkCandidates() {
  const removed = new Map();
  for (const item of currentStep()?.removedCandidates || []) {
    if (!removed.has(item.cell)) removed.set(item.cell, new Set());
    removed.get(item.cell).add(item.digit);
  }
  return removed;
}
function displayValues() {
  const values = givens.slice();
  if (walkthrough) for (let i = 1; i <= walkIndex; i++) for (const placement of walkthrough.steps[i].placements) values[placement.cell] = placement.digit;
  return values;
}
function setWalkthrough(data) {
  walkthrough = data; walkIndex = 0; mainLayout.classList.add('main-walkthrough'); walkthroughPanel.hidden = false;
  walkSlider.max = data.steps.length - 1; walkSlider.value = 0;
  difficulty.textContent = `Difficulty: ${data.level} · score ${data.score}${data.solvable ? '' : ' · includes a final search placement'}`;
  renderTechniqueSummary(techniqueSummary, data.steps, index => { walkSlider.value = index; updateWalkthrough(); });
  updateWalkthrough();
}
function updateWalkthrough() {
  walkIndex = Number(walkSlider.value); const step = currentStep();
  walkNumber.textContent = `${walkIndex + 1} of ${walkthrough.steps.length}`;
  walkDescription.textContent = step.description; render();
}
bindWalkControls(walkSlider, updateWalkthrough, walkFirst, walkPrev, walkNext, walkLast);
function render() {
  const values = displayValues();
  const between = betweenCandidates(givens);
  const candidates = visibleCandidates();
  const removedCandidates = removedWalkCandidates();
  const issues = findContradictions(givens, between);
  const affected = new Set(issues.flatMap(issue => issue.cells));
  const stepCells = new Map();
  const step = currentStep();
  if (step) for (const [prop, name] of [['primary', 'step-primary'], ['secondary', 'step-secondary'], ['fins', 'step-fin'], ['eliminations', 'step-elimination'], ['placements', 'step-placement']]) for (const item of step[prop] || []) stepCells.set(item.cell, name);
  cells.forEach((cell, i) => {
    const marks = candidates[i];
    cell.classList.toggle('selected', i === selected);
    cell.classList.toggle('impossible', affected.has(i));
    cell.classList.remove('step-primary', 'step-secondary', 'step-fin', 'step-elimination', 'step-placement', 'solution');
    if (stepCells.has(i)) cell.classList.add(stepCells.get(i)); else if (values[i] && !givens[i]) cell.classList.add('solution');
    cell.setAttribute('aria-selected', String(i === selected));
    cell.tabIndex = i === selected ? 0 : -1;
    const description = givens[i] ? `given ${givens[i]}` : values[i] ? `solution digit ${values[i]}` : marks.length ? `candidates ${marks.join(', ')}` : 'no possible digit';
    cell.setAttribute('aria-label', `Row ${Math.floor(i / 9) + 1}, column ${i % 9 + 1}, ${description}${affected.has(i) ? ', involved in a contradiction' : ''}`);
    cell.replaceChildren();
    if (values[i]) {
      const digit = document.createElement('span'); digit.className = 'given'; digit.textContent = values[i]; cell.appendChild(digit);
    } else {
      const container = document.createElement('span'); container.className = 'marks'; container.setAttribute('aria-hidden', 'true');
      for (let digit = 1; digit <= 9; digit++) { const mark = document.createElement('span'); const removed = removedCandidates.get(i)?.has(digit); mark.textContent = marks.includes(digit) || removed ? digit : ''; if (removed) mark.classList.add('removed-mark'); container.appendChild(mark); }
      cell.appendChild(container);
    }
  });
  status.replaceChildren();
  if (issues.length) {
    const heading = document.createElement('strong'); heading.textContent = 'Contradiction detected';
    const list = document.createElement('ul');
    for (const issue of issues) { const item = document.createElement('li'); item.textContent = issue.message; list.appendChild(item); }
    status.append(heading, list);
  }
}
grid.addEventListener('keydown', event => {
  if (/^[1-9]$/.test(event.key)) { event.preventDefault(); setGiven(Number(event.key)); return; }
  if (['Backspace', 'Delete', '0'].includes(event.key)) { event.preventDefault(); setGiven(0); return; }
  const row = Math.floor(selected / 9), col = selected % 9;
  const moves = { ArrowUp: [Math.max(0, row - 1), col], ArrowDown: [Math.min(8, row + 1), col], ArrowLeft: [row, Math.max(0, col - 1)], ArrowRight: [row, Math.min(8, col + 1)] };
  if (moves[event.key]) { event.preventDefault(); selected = moves[event.key][0] * 9 + moves[event.key][1]; render(); cells[selected].focus(); }
});
render();

function puzzleString() { return givens.map(d => d || '.').join(''); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); generationStatus.textContent = 'Copied the 81-character string.'; }
  catch { generationStatus.textContent = 'Clipboard access was unavailable.'; }
}
copyStringButton.addEventListener('click', () => copyText(puzzleString()));
copyCompletedStringButton.addEventListener('click', () => { if (completedSolution) copyText(completedSolution.join('')); });
function makeGridImage(values = givens, finalGivens = values) {
  const size = 900, cell = 100, canvas = document.createElement('canvas');
  canvas.width = canvas.height = size; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 56px system-ui';
  for (let i = 0; i < 81; i++) if (values[i]) { ctx.fillStyle = finalGivens[i] ? '#202923' : '#1d5eac'; ctx.fillText(values[i], (i % 9 + .5) * cell, (Math.floor(i / 9) + .54) * cell); }
  ctx.strokeStyle = '#263b30';
  for (let i = 0; i <= 9; i++) { ctx.lineWidth = i % 3 === 0 ? 5 : 1; ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke(); }
  return canvas;
}
async function copyGridImage(values, finalGivens = values) {
  try {
    const blob = await new Promise(resolve => makeGridImage(values, finalGivens).toBlob(resolve, 'image/png'));
    if (!blob || !navigator.clipboard?.write) throw new Error('clipboard unavailable');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    generationStatus.textContent = 'Copied the grid image.';
  } catch { generationStatus.textContent = 'Image clipboard access was unavailable in this browser.'; }
}
copyImageButton.addEventListener('click', () => copyGridImage(givens));
copyCompletedImageButton.addEventListener('click', () => { if (completedSolution) copyGridImage(completedSolution, givens); });

const customBuildPage = document.querySelector('#custom-build-page');
const showCustomBuild = document.querySelector('#show-custom-build');
const customPicker = document.querySelector('#custom-picker');
const customBuildSelection = document.querySelector('#custom-build-selection');
const customBuildNow = document.querySelector('#custom-build-now');
const cancelCustomBuild = document.querySelector('#cancel-custom-build');
const customBuildStatus = document.querySelector('#custom-build-status');
const customBuildResults = document.querySelector('#custom-build-results');
const customFinalGrid = document.querySelector('#custom-final-grid');
const customCompletedGrid = document.querySelector('#custom-completed-grid');
const customWalkthroughPanel = document.querySelector('#custom-walkthrough');
const customWalkSlider = document.querySelector('#custom-walk-slider');
const customWalkFirst = document.querySelector('#custom-walk-first');
const customWalkPrev = document.querySelector('#custom-walk-prev');
const customWalkNext = document.querySelector('#custom-walk-next');
const customWalkLast = document.querySelector('#custom-walk-last');
const customWalkNumber = document.querySelector('#custom-walk-number');
const customWalkDescription = document.querySelector('#custom-walk-description');
const customDifficulty = document.querySelector('#custom-difficulty');
const customWalkGrid = document.querySelector('#custom-walk-grid');
const customTechniqueSummary = document.querySelector('#custom-technique-summary');
const customSelectedCells = new Set();
let customBuildWorker = null, customBuildWorkerUrl = null, customWalkthrough = null, customWalkIndex = 0, customWalkGivens = null;
const customPickerCells = Array.from({ length: 81 }, (_, index) => {
  const cell = document.createElement('button'); cell.type = 'button'; cell.setAttribute('role', 'gridcell'); cell.setAttribute('aria-label', `Row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}`); cell.setAttribute('aria-pressed', 'false');
  cell.addEventListener('click', () => {
    if (customBuildWorker) return;
    if (customSelectedCells.has(index)) customSelectedCells.delete(index); else customSelectedCells.add(index);
    cell.setAttribute('aria-pressed', String(customSelectedCells.has(index)));
    customBuildSelection.textContent = `${customSelectedCells.size} cell${customSelectedCells.size === 1 ? '' : 's'} selected`;
  });
  customPicker.appendChild(cell); return cell;
});
function stopCustomBuild(message) {
  if (customBuildWorker) customBuildWorker.terminate();
  if (customBuildWorkerUrl) URL.revokeObjectURL(customBuildWorkerUrl);
  customBuildWorker = null; customBuildWorkerUrl = null; customBuildNow.disabled = false; cancelCustomBuild.hidden = true;
  if (message) customBuildStatus.textContent = message;
}
function renderCustomGrid(target, values, finalGivens) {
  target.replaceChildren();
  const grid = document.createElement('div'); grid.className = 'mini-grid'; grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', 'Custom-built Sudoku grid');
  values.forEach((digit, index) => { const cell = document.createElement('span'); cell.textContent = digit || ''; if (!finalGivens[index] && digit) cell.classList.add('completed-only'); grid.appendChild(cell); });
  target.appendChild(grid);
}
function updateCustomWalkthrough() {
  if (!customWalkthrough) return;
  customWalkIndex = Number(customWalkSlider.value); const step = customWalkthrough.steps[customWalkIndex];
  customWalkNumber.textContent = `${customWalkIndex + 1} of ${customWalkthrough.steps.length}`; customWalkDescription.textContent = step.description;
  const values = customWalkGivens.slice();
  for (let i = 1; i <= customWalkIndex; i++) for (const placement of customWalkthrough.steps[i].placements) values[placement.cell] = placement.digit;
  const highlighted = new Map();
  for (const [property, className] of [['primary', 'step-primary'], ['secondary', 'step-secondary'], ['fins', 'step-fin'], ['eliminations', 'step-elimination'], ['placements', 'step-placement']]) for (const item of step[property] || []) highlighted.set(item.cell, className);
  customWalkGrid.replaceChildren();
  const grid = document.createElement('div'); grid.className = 'mini-grid';
  const removed = walkthroughRemovedCandidates(customWalkthrough, customWalkIndex), candidates = customWalkthrough.candidateStates[customWalkIndex];
  values.forEach((digit, index) => { const cell = document.createElement('span'); appendWalkthroughCellContent(cell, digit, candidates[index], removed.get(index)); if (!customWalkGivens[index] && digit) cell.classList.add('completed-only'); if (highlighted.has(index)) cell.classList.add(highlighted.get(index)); grid.appendChild(cell); });
  customWalkGrid.appendChild(grid);
}
function showCustomWalkthrough(givensForWalkthrough, solution) {
  customWalkGivens = givensForWalkthrough.slice(); customWalkthrough = BetweenSudokuTechniques.walkthrough(givensForWalkthrough, solution); customWalkIndex = 0;
  customWalkthroughPanel.hidden = false; customWalkSlider.max = customWalkthrough.steps.length - 1; customWalkSlider.value = 0;
  customDifficulty.textContent = `Difficulty: ${customWalkthrough.level} · score ${customWalkthrough.score}${customWalkthrough.solvable ? '' : ' · includes a final search placement'}`;
  renderTechniqueSummary(customTechniqueSummary, customWalkthrough.steps, index => { customWalkSlider.value = index; updateCustomWalkthrough(); }); updateCustomWalkthrough();
}
bindWalkControls(customWalkSlider, updateCustomWalkthrough, customWalkFirst, customWalkPrev, customWalkNext, customWalkLast);
cancelCustomBuild.addEventListener('click', () => stopCustomBuild('Custom build cancelled.'));
customBuildNow.addEventListener('click', () => {
  if (customSelectedCells.size < 5) { customBuildStatus.textContent = 'Select at least 5 cells before building.'; return; }
  customBuildResults.hidden = true; customWalkthroughPanel.hidden = true;
  const required = [...customSelectedCells];
  const source = `const betweenCandidates = ${betweenCandidates.toString()};\nconst createGenerator = ${createGenerator.toString()};\ntry { let last=0; const result=createGenerator(betweenCandidates).buildCustom(${JSON.stringify(required)},{timeoutMs:120000,restartAfterMs:1000,onProgress:progress=>{if(performance.now()-last>200){last=performance.now();postMessage({type:'progress',...progress});}}}); postMessage({type:'done',result}); } catch(error) { postMessage({type:'error',message:error.message}); }`;
  customBuildWorkerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' })); customBuildWorker = new Worker(customBuildWorkerUrl);
  customBuildNow.disabled = true; cancelCustomBuild.hidden = false; customBuildStatus.textContent = 'Building from an empty grid…';
  const worker = customBuildWorker;
  worker.onmessage = event => {
    if (worker !== customBuildWorker) return;
    const data = event.data;
    if (data.type === 'progress') { customBuildStatus.textContent = `Testing selected cells: ${data.filled} of ${data.required} filled${data.restarts ? ` · restarted ${data.restarts} times` : ''}`; return; }
    if (data.type === 'error') { stopCustomBuild(data.message === 'timeout' ? 'Could not build a unique puzzle within 2 minutes. Try a different selection.' : 'Custom build failed. Try a different selection.'); return; }
    stopCustomBuild(`Built a unique puzzle with ${data.result.givenCount} givens in ${(data.result.elapsedMs / 1000).toFixed(2)} seconds.`);
    renderCustomGrid(customFinalGrid, data.result.givens, data.result.givens); renderCustomGrid(customCompletedGrid, data.result.solution, data.result.givens); customBuildResults.hidden = false;
    try { showCustomWalkthrough(data.result.givens, data.result.solution); } catch { customWalkthroughPanel.hidden = true; }
  };
  worker.onerror = () => stopCustomBuild('Unable to run the custom builder in this browser.');
});

const generatePage = document.querySelector('#generate-page');
const simulationPage = document.querySelector('#simulation-page');
const showGenerate = document.querySelector('#show-generate');
const showSimulation = document.querySelector('#show-simulation');
const simulationTrials = document.querySelector('#simulation-trials');
const simulationMaxGivens = document.querySelector('#simulation-max-givens');
const simulationNoAdjacent = document.querySelector('#simulation-no-adjacent');
const startSimulation = document.querySelector('#start-simulation');
const simulationStatus = document.querySelector('#simulation-status');
const simulationAverage = document.querySelector('#simulation-average');
const simulationHistogram = document.querySelector('#simulation-histogram');
const simulationGrids = document.querySelector('#simulation-grids');
let simulationWorker = null, simulationWorkerUrl = null;
let simulationDistribution = new Map();
function renderHistogram() {
  simulationHistogram.replaceChildren();
  const largest = Math.max(...simulationDistribution.values(), 1);
  for (const [givensCount, trials] of [...simulationDistribution.entries()].sort((a, b) => a[0] - b[0])) {
    const bar = document.createElement('div'); bar.className = 'histogram-bar';
    const total = document.createElement('strong'); total.textContent = trials;
    const column = document.createElement('span'); column.style.height = `${Math.max(2, Math.round(trials / largest * 130))}px`;
    const label = document.createElement('small'); label.textContent = `${givensCount} givens`;
    bar.append(total, column, label); simulationHistogram.appendChild(bar);
  }
}
function showPage(page) {
  const simulation = page === 'simulation';
  generatePage.hidden = simulation; simulationPage.hidden = !simulation;
  showGenerate.toggleAttribute('aria-current', !simulation); showSimulation.toggleAttribute('aria-current', simulation);
}
showGenerate.addEventListener('click', () => showPage('generate'));
showSimulation.addEventListener('click', () => showPage('simulation'));
function haltSimulationRun(message = 'Simulation halted.') {
  if (simulationWorker) simulationWorker.terminate();
  if (simulationWorkerUrl) URL.revokeObjectURL(simulationWorkerUrl);
  simulationWorker = null; simulationWorkerUrl = null; startSimulation.disabled = false; startSimulation.textContent = 'Start simulation';
  simulationStatus.textContent = message;
}
startSimulation.addEventListener('click', () => {
  if (simulationWorker) { haltSimulationRun(); return; }
  const total = Number(simulationTrials.value), maximum = Number(simulationMaxGivens.value), adjacent = simulationNoAdjacent.checked;
  simulationGrids.replaceChildren();
  simulationDistribution = new Map(); renderHistogram();
  const source = `const betweenCandidates = ${betweenCandidates.toString()};\nconst createGenerator = ${createGenerator.toString()};\n` +
    `const total=${total}, maximum=${maximum}, adjacent=${adjacent}; let completed=0, successful=0, elapsed=0; const engine=createGenerator(betweenCandidates); for(let trial=0;trial<total;trial++){try{const result=engine.generate({timeoutMs:10000,restartAfterMs:1000,noOrthogonalAdjacent:adjacent});successful++;elapsed+=result.elapsedMs;postMessage({type:'trial',completed:++completed,successful,elapsed,givenCount:result.givenCount,result:result.givenCount<=maximum?result:null});}catch(error){postMessage({type:'trial',completed:++completed,successful,elapsed,result:null});}}postMessage({type:'complete',completed,successful,elapsed});`;
  simulationWorkerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  simulationWorker = new Worker(simulationWorkerUrl); startSimulation.textContent = 'Halt';
  simulationStatus.textContent = `Running 0 of ${total} trials…`; simulationAverage.textContent = 'Average time: —';
  const worker = simulationWorker;
  worker.onmessage = event => {
    if (worker !== simulationWorker) return;
    const data = event.data;
    simulationStatus.textContent = data.type === 'complete' ? `Completed ${data.completed} trials.` : `Running ${data.completed} of ${total} trials…`;
    simulationAverage.textContent = data.successful ? `Average time: ${(data.elapsed / data.successful / 1000).toFixed(3)} seconds across ${data.successful} generated puzzles.` : 'Average time: —';
    if (data.givenCount) { simulationDistribution.set(data.givenCount, (simulationDistribution.get(data.givenCount) || 0) + 1); renderHistogram(); }
    if (data.result) {
      const puzzle = data.result.givens.map(d => d || '.').join('');
      const solution = data.result.solution.join('');
      const item = document.createElement('article'); item.className = 'simulation-item';
      const heading = document.createElement('p'); heading.textContent = `${data.result.givenCount} givens`;
      const miniGrid = document.createElement('div'); miniGrid.className = 'mini-grid'; miniGrid.setAttribute('role', 'img');
      miniGrid.setAttribute('aria-label', `Generated grid with ${data.result.givenCount} givens`);
      for (const digit of data.result.givens) { const cell = document.createElement('span'); cell.textContent = digit || ''; miniGrid.appendChild(cell); }
      const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy puzzle'; copy.addEventListener('click', () => copyText(puzzle));
      const completedLabel = document.createElement('p'); completedLabel.textContent = 'Completed grid';
      const completed = document.createElement('code'); completed.textContent = solution;
      const copyCompleted = document.createElement('button'); copyCompleted.type = 'button'; copyCompleted.textContent = 'Copy completed grid'; copyCompleted.addEventListener('click', () => copyText(solution));
      item.append(heading, miniGrid, copy, completedLabel, completed, copyCompleted); simulationGrids.prepend(item);
    }
    if (data.type === 'complete') haltSimulationRun(`Completed ${data.completed} trials.`);
  };
  worker.onerror = () => haltSimulationRun('Simulation failed.');
});

const difficultySimulationPage = document.querySelector('#simulation-difficulty-page');
const showSimulationDifficulty = document.querySelector('#show-simulation-difficulty');
const difficultySimulationTrials = document.querySelector('#difficulty-simulation-trials');
const difficultySimulationThreshold = document.querySelector('#difficulty-simulation-threshold');
const difficultySimulationNoAdjacent = document.querySelector('#difficulty-simulation-no-adjacent');
const startDifficultySimulation = document.querySelector('#start-difficulty-simulation');
const haltDifficultySimulation = document.querySelector('#halt-difficulty-simulation');
const difficultySimulationStatus = document.querySelector('#difficulty-simulation-status');
const difficultySimulationAverage = document.querySelector('#difficulty-simulation-average');
const difficultySimulationHistogram = document.querySelector('#difficulty-simulation-histogram');
const difficultySimulationGrids = document.querySelector('#difficulty-simulation-grids');
let difficultySimulationWorker = null, difficultySimulationWorkerUrl = null;
let difficultyDistribution = new Map();
function renderDifficultyHistogram() {
  difficultySimulationHistogram.replaceChildren();
  const largest = Math.max(...difficultyDistribution.values(), 1);
  for (const [score, trials] of [...difficultyDistribution.entries()].sort((a, b) => a[0] - b[0])) {
    const bar = document.createElement('div'); bar.className = 'histogram-bar';
    const total = document.createElement('strong'); total.textContent = trials;
    const column = document.createElement('span'); column.style.height = `${Math.max(2, Math.round(trials / largest * 130))}px`;
    const label = document.createElement('small'); label.textContent = score;
    bar.append(total, column, label); difficultySimulationHistogram.appendChild(bar);
  }
}
function appendDifficultySimulationGrid(result, score) {
  const puzzle = result.givens.map(d => d || '.').join('');
  const solution = result.solution.join('');
  const item = document.createElement('article'); item.className = 'simulation-item';
  const heading = document.createElement('p'); heading.textContent = `${result.givenCount} givens · difficulty ${score}`;
  const miniGrid = document.createElement('div'); miniGrid.className = 'mini-grid'; miniGrid.setAttribute('role', 'img'); miniGrid.setAttribute('aria-label', `Generated grid rated ${score}`);
  result.givens.forEach(digit => { const cell = document.createElement('span'); cell.textContent = digit || ''; miniGrid.appendChild(cell); });
  const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copy puzzle'; copy.addEventListener('click', () => copyText(puzzle));
  const completedLabel = document.createElement('p'); completedLabel.textContent = 'Completed grid';
  const completed = document.createElement('code'); completed.textContent = solution;
  item.append(heading, miniGrid, copy, completedLabel, completed); difficultySimulationGrids.prepend(item);
}
function haltDifficultySimulationRun(message = 'Simulation halted.') {
  if (difficultySimulationWorker) difficultySimulationWorker.terminate();
  if (difficultySimulationWorkerUrl) URL.revokeObjectURL(difficultySimulationWorkerUrl);
  difficultySimulationWorker = null; difficultySimulationWorkerUrl = null;
  startDifficultySimulation.disabled = false; haltDifficultySimulation.hidden = true;
  difficultySimulationStatus.textContent = message;
}
haltDifficultySimulation.addEventListener('click', () => haltDifficultySimulationRun());
startDifficultySimulation.addEventListener('click', () => {
  const total = Number(difficultySimulationTrials.value), threshold = Number(difficultySimulationThreshold.value), adjacent = difficultySimulationNoAdjacent.checked;
  difficultySimulationGrids.replaceChildren(); difficultyDistribution = new Map(); renderDifficultyHistogram();
  const source = `const betweenCandidates = ${betweenCandidates.toString()};\nconst createGenerator = ${createGenerator.toString()};\nconst total=${total}, adjacent=${adjacent}; let completed=0; const engine=createGenerator(betweenCandidates); for(let trial=0;trial<total;trial++){try{const result=engine.generate({timeoutMs:10000,restartAfterMs:1000,noOrthogonalAdjacent:adjacent});postMessage({type:'trial',completed:++completed,result});}catch(error){postMessage({type:'trial',completed:++completed,result:null});}}postMessage({type:'complete',completed});`;
  difficultySimulationWorkerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  difficultySimulationWorker = new Worker(difficultySimulationWorkerUrl); startDifficultySimulation.disabled = true; haltDifficultySimulation.hidden = false;
  difficultySimulationStatus.textContent = `Running 0 of ${total} trials…`; difficultySimulationAverage.textContent = 'Average time: —';
  let successful = 0, elapsed = 0;
  const worker = difficultySimulationWorker;
  worker.onmessage = event => {
    if (worker !== difficultySimulationWorker) return;
    const data = event.data;
    if (data.type === 'complete') { haltDifficultySimulationRun(`Completed ${data.completed} trials.`); return; }
    difficultySimulationStatus.textContent = `Running ${data.completed} of ${total} trials…`;
    if (!data.result) return;
    const ratingStarted = performance.now();
    const rating = BetweenSudokuTechniques.walkthrough(data.result.givens, data.result.solution);
    const score = rating.score;
    successful++; elapsed += data.result.elapsedMs + performance.now() - ratingStarted;
    difficultyDistribution.set(score, (difficultyDistribution.get(score) || 0) + 1); renderDifficultyHistogram();
    difficultySimulationAverage.textContent = `Average time: ${(elapsed / successful / 1000).toFixed(3)} seconds across ${successful} generated puzzles.`;
    if (score > threshold) appendDifficultySimulationGrid(data.result, score);
  };
  worker.onerror = () => haltDifficultySimulationRun('Simulation failed.');
});

const verifyPage = document.querySelector('#verify-page');
const showVerify = document.querySelector('#show-verify');
const techniquesPage = document.querySelector('#techniques-page');
const showTechniques = document.querySelector('#show-techniques');
const techniqueCatalog = document.querySelector('#technique-catalog');
const verifyString = document.querySelector('#verify-string');
const pasteVerify = document.querySelector('#paste-verify');
const loadVerifyString = document.querySelector('#load-verify-string');
const resetVerify = document.querySelector('#reset-verify');
const verifyGrid = document.querySelector('#verify-grid');
const verifyPuzzle = document.querySelector('#verify-puzzle');
const verifyStatus = document.querySelector('#verify-status');
const verifyGivenCount = document.querySelector('#verify-given-count');
const verifySolutions = document.querySelector('#verify-solutions');
const copyVerifyString = document.querySelector('#copy-verify-string');
const copyVerifyImage = document.querySelector('#copy-verify-image');
const copyVerifyCompletedString = document.querySelector('#copy-verify-completed-string');
const copyVerifyCompletedImage = document.querySelector('#copy-verify-completed-image');
const verifyWalkthroughPanel = document.querySelector('#verify-walkthrough');
const verifyWalkSlider = document.querySelector('#verify-walk-slider');
const verifyWalkFirst = document.querySelector('#verify-walk-first');
const verifyWalkPrev = document.querySelector('#verify-walk-prev');
const verifyWalkNext = document.querySelector('#verify-walk-next');
const verifyWalkLast = document.querySelector('#verify-walk-last');
const verifyWalkNumber = document.querySelector('#verify-walk-number');
const verifyWalkDescription = document.querySelector('#verify-walk-description');
const verifyDifficulty = document.querySelector('#verify-difficulty');
const verifyWalkGrid = document.querySelector('#verify-walk-grid');
const verifyTechniqueSummary = document.querySelector('#verify-technique-summary');
let verifyWalkthrough = null, verifyWalkIndex = 0, verifyWalkGivens = null, verifyCompletedSolution = null;
let verifyWorker = null, verifyWorkerUrl = null;
const verifyCells = Array.from({ length: 81 }, () => { const input = document.createElement('input'); input.inputMode = 'numeric'; input.maxLength = 1; input.setAttribute('aria-label', 'Puzzle cell'); input.addEventListener('input', () => { input.value = /^[1-9]$/.test(input.value) ? input.value : ''; syncVerifyStringFromCells(); clearVerifyResults(); }); verifyGrid.appendChild(input); return input; });
function verifyValues() { return verifyCells.map(input => Number(input.value) || 0); }
function updateVerifyGivenCount() { verifyGivenCount.textContent = `Givens: ${verifyValues().filter(Boolean).length}`; }
function syncVerifyStringFromCells() { verifyString.value = verifyValues().map(digit => digit || '.').join(''); updateVerifyGivenCount(); }
function clearVerifyResults() { verifySolutions.replaceChildren(); verifyWalkthrough = null; verifyCompletedSolution = null; verifyWalkthroughPanel.hidden = true; copyVerifyString.disabled = true; copyVerifyImage.disabled = true; copyVerifyCompletedString.disabled = true; copyVerifyCompletedImage.disabled = true; }
const pageRoutes = { generate: 'Generate', 'custom-build': 'custom_build', simulation: 'simulation', 'simulation-difficulty': 'simulation_difficulty', verify: 'verify', techniques: 'techniques' };
const routeRoot = location.protocol === 'file:' ? '' : (location.pathname.endsWith('/') ? location.pathname : location.pathname.replace(/\/[^/]*$/, '/'));
function pageFromLocation() {
  const fallbackRoute = new URLSearchParams(location.search).get('route');
  const route = location.protocol === 'file:' ? location.hash.replace(/^#\/?/, '') : (fallbackRoute || location.pathname.slice(routeRoot.length).replace(/^\//, ''));
  return Object.entries(pageRoutes).find(([, value]) => value === route)?.[0] || 'generate';
}
function updatePageUrl(page) {
  const route = pageRoutes[page];
  if (location.protocol === 'file:') {
    const nextHash = route ? `#/${route}` : '';
    if (location.hash !== nextHash) location.hash = nextHash;
    return;
  }
  const nextPath = `${routeRoot}${route}`;
  if (location.pathname !== nextPath) history.pushState({ page }, '', nextPath);
}
function showPage(page, updateUrl = true) {
  generatePage.hidden = page !== 'generate'; customBuildPage.hidden = page !== 'custom-build'; simulationPage.hidden = page !== 'simulation'; difficultySimulationPage.hidden = page !== 'simulation-difficulty'; verifyPage.hidden = page !== 'verify'; techniquesPage.hidden = page !== 'techniques';
  showGenerate.toggleAttribute('aria-current', page === 'generate'); showCustomBuild.toggleAttribute('aria-current', page === 'custom-build'); showSimulation.toggleAttribute('aria-current', page === 'simulation'); showSimulationDifficulty.toggleAttribute('aria-current', page === 'simulation-difficulty'); showVerify.toggleAttribute('aria-current', page === 'verify'); showTechniques.toggleAttribute('aria-current', page === 'techniques');
  if (updateUrl) updatePageUrl(page);
}
showGenerate.onclick = () => showPage('generate');
showCustomBuild.addEventListener('click', () => showPage('custom-build'));
showSimulation.onclick = () => showPage('simulation');
showSimulationDifficulty.addEventListener('click', () => showPage('simulation-difficulty'));
showVerify.addEventListener('click', () => showPage('verify'));
showTechniques.addEventListener('click', () => showPage('techniques'));
function renderTechniqueCatalog() {
  techniqueCatalog.replaceChildren();
  for (const technique of BetweenSudokuTechniques.techniqueCatalog()) {
    const row = document.createElement('tr');
    const name = document.createElement('td'); name.textContent = technique.name;
    const level = document.createElement('td'); level.textContent = technique.level;
    const category = document.createElement('td'); category.textContent = technique.category;
    const score = document.createElement('td'); score.textContent = technique.score;
    row.append(name, level, category, score); techniqueCatalog.appendChild(row);
  }
}
renderTechniqueCatalog();
const initialPage = pageFromLocation();
showPage(initialPage, false);
if (location.protocol !== 'file:' && new URLSearchParams(location.search).has('route')) history.replaceState({ page: initialPage }, '', `${routeRoot}${pageRoutes[initialPage]}`);
window.addEventListener('popstate', () => showPage(pageFromLocation(), false));
window.addEventListener('hashchange', () => showPage(pageFromLocation(), false));
loadVerifyString?.addEventListener('click', () => {
  const chars = verifyString.value.replace(/[^0-9.]/g, '');
  if (chars.length !== 81) { verifyStatus.textContent = 'Enter exactly 81 digits, zeroes, or dots.'; return; }
  chars.split('').forEach((character, index) => { verifyCells[index].value = /^[1-9]$/.test(character) ? character : ''; });
  syncVerifyStringFromCells(); clearVerifyResults();
  verifyStatus.textContent = 'String loaded.';
});
verifyString.addEventListener('input', () => {
  const chars = verifyString.value.replace(/[^0-9.]/g, '').slice(0, 81);
  if (verifyString.value !== chars) verifyString.value = chars;
  verifyCells.forEach((cell, index) => { const character = chars[index] || ''; cell.value = /^[1-9]$/.test(character) ? character : ''; });
  updateVerifyGivenCount();
  clearVerifyResults();
});
pasteVerify.addEventListener('click', async () => {
  try {
    const chars = (await navigator.clipboard.readText()).replace(/[^0-9.]/g, '');
    if (chars.length !== 81) { verifyStatus.textContent = 'Clipboard must contain exactly 81 digits, zeroes, or dots.'; return; }
    verifyString.value = chars;
    verifyString.dispatchEvent(new Event('input'));
    verifyStatus.textContent = 'Clipboard puzzle loaded.';
  } catch { verifyStatus.textContent = 'Clipboard access was unavailable.'; }
});
resetVerify.addEventListener('click', () => { verifyCells.forEach(cell => { cell.value = ''; }); syncVerifyStringFromCells(); clearVerifyResults(); verifyStatus.textContent = 'Input reset to blank.'; });
function renderVerifySolution(values, finalGivens, contrast) {
  const grid = document.createElement('div'); grid.className = 'mini-grid'; grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', 'Solution grid');
  values.forEach((digit, index) => { const cell = document.createElement('span'); cell.textContent = digit; if (!finalGivens[index]) cell.classList.add('completed-only'); if (contrast.has(index)) cell.classList.add('contrast'); grid.appendChild(cell); });
  return grid;
}
function updateVerifyWalkthrough() {
  if (!verifyWalkthrough) return;
  verifyWalkIndex = Number(verifyWalkSlider.value);
  const step = verifyWalkthrough.steps[verifyWalkIndex];
  verifyWalkNumber.textContent = `${verifyWalkIndex + 1} of ${verifyWalkthrough.steps.length}`;
  verifyWalkDescription.textContent = step.description;
  const values = verifyWalkGivens.slice();
  for (let i = 1; i <= verifyWalkIndex; i++) for (const placement of verifyWalkthrough.steps[i].placements) values[placement.cell] = placement.digit;
  const highlights = new Map();
  for (const [property, className] of [['primary', 'step-primary'], ['secondary', 'step-secondary'], ['fins', 'step-fin'], ['eliminations', 'step-elimination'], ['placements', 'step-placement']]) for (const item of step[property] || []) highlights.set(item.cell, className);
  verifyWalkGrid.replaceChildren();
  const grid = document.createElement('div'); grid.className = 'mini-grid';
  const removed = walkthroughRemovedCandidates(verifyWalkthrough, verifyWalkIndex), candidates = verifyWalkthrough.candidateStates[verifyWalkIndex];
  values.forEach((digit, index) => { const cell = document.createElement('span'); appendWalkthroughCellContent(cell, digit, candidates[index], removed.get(index)); if (!verifyWalkGivens[index] && digit) cell.classList.add('completed-only'); if (highlights.has(index)) cell.classList.add(highlights.get(index)); grid.appendChild(cell); });
  verifyWalkGrid.appendChild(grid);
}
function setVerifyWalkthrough(givensForWalkthrough, solution) {
  verifyWalkGivens = givensForWalkthrough.slice(); verifyWalkthrough = BetweenSudokuTechniques.walkthrough(givensForWalkthrough, solution); verifyWalkIndex = 0;
  verifyWalkthroughPanel.hidden = false; verifyWalkSlider.max = verifyWalkthrough.steps.length - 1; verifyWalkSlider.value = 0;
  verifyDifficulty.textContent = `Difficulty: ${verifyWalkthrough.level} · score ${verifyWalkthrough.score}${verifyWalkthrough.solvable ? '' : ' · includes a final search placement'}`;
  renderTechniqueSummary(verifyTechniqueSummary, verifyWalkthrough.steps, index => { verifyWalkSlider.value = index; updateVerifyWalkthrough(); });
  updateVerifyWalkthrough();
}
bindWalkControls(verifyWalkSlider, updateVerifyWalkthrough, verifyWalkFirst, verifyWalkPrev, verifyWalkNext, verifyWalkLast);
verifyPuzzle.addEventListener('click', () => {
  const values = verifyValues(); verifySolutions.replaceChildren();
  verifyWalkthrough = null; verifyCompletedSolution = null; verifyWalkthroughPanel.hidden = true; copyVerifyCompletedString.disabled = true; copyVerifyCompletedImage.disabled = true;
  copyVerifyString.disabled = false; copyVerifyImage.disabled = false;
  if (verifyWorker) verifyWorker.terminate(); if (verifyWorkerUrl) URL.revokeObjectURL(verifyWorkerUrl);
  const source = `const betweenCandidates = ${betweenCandidates.toString()};\nconst createGenerator = ${createGenerator.toString()};\ntry { const result=createGenerator(betweenCandidates).countSolutions(${JSON.stringify(values)},{deadline:performance.now()+120000}); postMessage({type:'done',result}); } catch(error) { postMessage({type:'error',message:error.message}); }`;
  verifyWorkerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' })); verifyWorker = new Worker(verifyWorkerUrl);
  verifyPuzzle.disabled = true; verifyStatus.textContent = 'Checking solutions…'; const worker = verifyWorker;
  worker.onmessage = event => { if (worker !== verifyWorker) return; const data = event.data; worker.terminate(); URL.revokeObjectURL(verifyWorkerUrl); verifyWorker = null; verifyWorkerUrl = null; verifyPuzzle.disabled = false;
    if (data.type === 'error') { verifyStatus.textContent = data.message === 'timeout' ? 'Verification timed out.' : 'Unable to verify this puzzle.'; return; }
    const result = data.result;
    if (result.count === 0) { verifyStatus.textContent = 'This puzzle has no solution.'; return; }
    if (result.count === 1) { verifyCompletedSolution = result.solutions[0]; copyVerifyCompletedString.disabled = false; copyVerifyCompletedImage.disabled = false; verifyStatus.textContent = 'This puzzle has a unique solution.'; verifySolutions.appendChild(renderVerifySolution(result.solutions[0], values, new Set())); try { setVerifyWalkthrough(values, result.solutions[0]); } catch { verifyWalkthroughPanel.hidden = true; } return; }
    const contrast = new Set(result.solutions[0].map((digit, index) => digit !== result.solutions[1][index] ? index : -1).filter(index => index >= 0));
    verifyStatus.textContent = 'This puzzle has at least two solutions. Orange cells differ between the two shown solutions.';
    verifySolutions.append(renderVerifySolution(result.solutions[0], values, contrast), renderVerifySolution(result.solutions[1], values, contrast));
  };
  worker.onerror = () => { if (worker !== verifyWorker) return; verifyPuzzle.disabled = false; verifyStatus.textContent = 'Unable to run verification.'; };
});
copyVerifyString.addEventListener('click', () => copyText(verifyValues().map(d => d || '.').join('')));
copyVerifyImage.addEventListener('click', () => copyGridImage(verifyValues()));
copyVerifyCompletedString.addEventListener('click', async () => {
  if (!verifyCompletedSolution) return;
  try { await navigator.clipboard.writeText(verifyCompletedSolution.join('')); verifyStatus.textContent = 'Copied the completed 81-character string.'; }
  catch { verifyStatus.textContent = 'Clipboard access was unavailable.'; }
});
copyVerifyCompletedImage.addEventListener('click', async () => {
  if (!verifyCompletedSolution) return;
  try {
    const blob = await new Promise(resolve => makeGridImage(verifyCompletedSolution, verifyValues()).toBlob(resolve, 'image/png'));
    if (!blob || !navigator.clipboard?.write) throw new Error('clipboard unavailable');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); verifyStatus.textContent = 'Copied the completed grid image.';
  } catch { verifyStatus.textContent = 'Image clipboard access was unavailable in this browser.'; }
});
