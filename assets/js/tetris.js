(function () {
  const canvas = document.getElementById('tetris-game');
  const overlay = document.getElementById('tetris-overlay');
  const playBtn = document.getElementById('tetris-play-btn');
  const restartBtn = document.getElementById('tetris-restart-btn');
  const saveBtn = document.getElementById('tetris-save-score');
  const nameInput = document.getElementById('tetris-name');
  const finalEl = document.getElementById('tetris-final');
  const difficultySel = document.getElementById('tetris-difficulty');
  const gameOverBox = document.getElementById('tetris-gameover');

  const scoreEl = document.getElementById('tetris-score');
  const levelEl = document.getElementById('tetris-level');
  const linesEl = document.getElementById('tetris-lines');

  const nextCanvas = document.getElementById('tetris-next');
  const holdCanvas = document.getElementById('tetris-hold');
  const highList = document.getElementById('tetris-highscore-list');

  const controls = document.getElementById('tetris-controls');
  const stage = document.getElementById('tetris-stage');

  if (!canvas || !overlay || !playBtn || !restartBtn) return;

  const ctx = canvas.getContext('2d');

  // grid settings
  const COLS = 10;
  const ROWS = 20;
  const GRID = 32;

  const tetrominos = {
    I: [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0]
    ],
    J: [
      [1,0,0],
      [1,1,1],
      [0,0,0]
    ],
    L: [
      [0,0,1],
      [1,1,1],
      [0,0,0]
    ],
    O: [
      [1,1],
      [1,1]
    ],
    S: [
      [0,1,1],
      [1,1,0],
      [0,0,0]
    ],
    Z: [
      [1,1,0],
      [0,1,1],
      [0,0,0]
    ],
    T: [
      [0,1,0],
      [1,1,1],
      [0,0,0]
    ]
  };

  const colors = {
    I: 'cyan',
    O: 'yellow',
    T: 'purple',
    S: 'green',
    Z: 'red',
    J: 'blue',
    L: 'orange'
  };

  // Difficulty presets (starting speed)
  const DIFFICULTY = {
    easy:   { startMs: 700 },
    normal: { startMs: 520 },
    hard:   { startMs: 380 }
  };

  // scoring (classic-ish)
  const LINE_POINTS = { 1: 100, 2: 300, 3: 500, 4: 800 };

  // ---- State ----
  let playfield;
  let bag = [];
  let current = null;
  let next = null;
  let hold = null;
  let canHold = true;

  let score = 0;
  let lines = 0;
  let level = 1;

  let started = false;
  let gameOver = false;

  let dropMs = 520;
  let dropTimer = 0;

  let lockDelayMs = 450;
  let lockTimer = 0;

  let rAF = null;
  let lastTs = 0;

  // fx
  let clearFlash = { rows: [], t: 0 };
  let particles = [];

  // ---- Helpers ----
  function makePlayfield() {
    const pf = [];
    for (let r = -2; r < ROWS; r++) {
      pf[r] = [];
      for (let c = 0; c < COLS; c++) pf[r][c] = 0;
    }
    return pf;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function refillBag() {
    const sequence = ['I','J','L','O','S','T','Z'];
    while (sequence.length) {
      const i = randInt(0, sequence.length - 1);
      bag.push(sequence.splice(i, 1)[0]);
    }
  }

  function takeFromBag() {
    if (bag.length === 0) refillBag();
    return bag.pop();
  }

  function spawnPiece(name) {
    const matrix = tetrominos[name];
    const col = COLS / 2 - Math.ceil(matrix[0].length / 2);
    const row = name === 'I' ? -1 : -2;
    return { name, matrix, row, col };
  }

  function rotate(matrix) {
    const N = matrix.length - 1;
    return matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
  }

  function isValidMove(matrix, cellRow, cellCol) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;

        const pr = cellRow + r;
        const pc = cellCol + c;

        if (pc < 0 || pc >= COLS) return false;
        if (pr >= ROWS) return false;

        if (pr >= 0 && playfield[pr][pc]) return false;
      }
    }
    return true;
  }

  // Basic wall-kick: if rotate collides, try shifting left/right a bit
  function tryRotate() {
    const rotated = rotate(current.matrix);
    const kicks = [0, -1, 1, -2, 2];
    for (const dx of kicks) {
      if (isValidMove(rotated, current.row, current.col + dx)) {
        current.matrix = rotated;
        current.col += dx;
        return true;
      }
    }
    return false;
  }

  function mergeCurrent() {
    for (let r = 0; r < current.matrix.length; r++) {
      for (let c = 0; c < current.matrix[r].length; c++) {
        if (!current.matrix[r][c]) continue;

        const pr = current.row + r;
        const pc = current.col + c;

        if (pr < 0) {
          endGame();
          return;
        }
        playfield[pr][pc] = current.name;
      }
    }
  }

  function clearLines() {
    const cleared = [];

    for (let r = ROWS - 1; r >= 0; ) {
      if (playfield[r].every(cell => !!cell)) {
        cleared.push(r);
        for (let rr = r; rr >= 0; rr--) {
          for (let c = 0; c < COLS; c++) {
            playfield[rr][c] = playfield[rr - 1]?.[c] || 0;
          }
        }
      } else {
        r--;
      }
    }

    if (cleared.length) {
      // fx
      clearFlash.rows = cleared.slice();
      clearFlash.t = 180;

      spawnParticles(cleared);

      // scoring
      const base = LINE_POINTS[cleared.length] || 0;
      score += base * level;
      lines += cleared.length;

      const newLevel = Math.floor(lines / 10) + 1;
      if (newLevel !== level) {
        level = newLevel;
        // speed up
        dropMs = Math.max(90, dropMs - 35);
      }
      syncUI();
    }
  }

  function hardDrop() {
    if (!current || gameOver) return;
    let dropped = 0;
    while (isValidMove(current.matrix, current.row + 1, current.col)) {
      current.row++;
      dropped++;
    }
    score += dropped * 2;
    lockNow();
    syncUI();
  }

  function softDrop() {
    if (!current || gameOver) return;
    if (isValidMove(current.matrix, current.row + 1, current.col)) {
      current.row++;
      score += 1;
      syncUI();
    } else {
      lockNow();
    }
  }

  function lockNow() {
    mergeCurrent();
    if (gameOver) return;

    clearLines();
    canHold = true;

    current = next;
    next = spawnPiece(takeFromBag());

    lockTimer = 0;
  }

  function holdPiece() {
    if (!current || gameOver) return;
    if (!canHold) return;

    const curName = current.name;

    if (hold === null) {
      hold = curName;
      current = next;
      next = spawnPiece(takeFromBag());
    } else {
      current = spawnPiece(hold);
      hold = curName;
    }

    // reset position with “spawn rules”
    current.row = current.name === 'I' ? -1 : -2;
    current.col = COLS / 2 - Math.ceil(current.matrix[0].length / 2);

    canHold = false;
    lockTimer = 0;

    renderPreviews();
  }

  function computeGhostRow() {
    let r = current.row;
    while (isValidMove(current.matrix, r + 1, current.col)) r++;
    return r;
  }

  function syncUI() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (levelEl) levelEl.textContent = String(level);
    if (linesEl) linesEl.textContent = String(lines);
  }

  // ---- Rendering ----
  function drawCell(x, y, color, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, GRID - 1, GRID - 1);
    ctx.globalAlpha = 1;
  }

  function drawPlayfield() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const name = playfield[r][c];
        if (name) drawCell(c * GRID, r * GRID, colors[name], 1);
      }
    }
  }

  function drawPiece(piece, alpha = 1, yOverride = null) {
    const baseRow = yOverride === null ? piece.row : yOverride;
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (!piece.matrix[r][c]) continue;
        const pr = baseRow + r;
        const pc = piece.col + c;
        if (pr < 0) continue;
        drawCell(pc * GRID, pr * GRID, colors[piece.name], alpha);
      }
    }
  }

  function drawFlash(dt) {
    if (clearFlash.t <= 0) return;
    clearFlash.t -= dt;
    const a = Math.max(0, clearFlash.t / 180) * 0.65;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'white';
    for (const r of clearFlash.rows) {
      ctx.fillRect(0, r * GRID, COLS * GRID, GRID);
    }
    ctx.globalAlpha = 1;
  }

  function spawnParticles(clearedRows) {
    // “fire” sparks near the cleared lines
    for (const r of clearedRows) {
      for (let i = 0; i < 22; i++) {
        particles.push({
          x: randInt(0, COLS * GRID),
          y: r * GRID + randInt(0, GRID),
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.6 - 0.5,
          life: randInt(350, 700)
        });
      }
    }
  }

  function updateParticles(dt) {
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.vy += 0.012 * dt; // gravity
      const alpha = Math.max(0, p.life / 700);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'orange';
      ctx.fillRect(p.x, p.y, 3, 3);
      ctx.globalAlpha = 1;
    }
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function renderPreviews() {
    drawPreview(nextCanvas, next?.name);
    drawPreview(holdCanvas, hold);
  }

  function drawPreview(c, name) {
    if (!c) return;
    const cctx = c.getContext('2d');
    cctx.clearRect(0, 0, c.width, c.height);
    cctx.fillStyle = '#fff';
    cctx.fillRect(0, 0, c.width, c.height);

    if (!name) return;

    const m = tetrominos[name];
    const color = colors[name];

    const cell = 22;
    const w = m[0].length * cell;
    const h = m.length * cell;
    const ox = Math.floor((c.width - w) / 2);
    const oy = Math.floor((c.height - h) / 2);

    for (let r = 0; r < m.length; r++) {
      for (let col = 0; col < m[r].length; col++) {
        if (!m[r][col]) continue;
        cctx.fillStyle = color;
        cctx.fillRect(ox + col * cell, oy + r * cell, cell - 2, cell - 2);
      }
    }
  }

    // ---- High scores (WordPress global database) ----
  const API_URL = window.currybibleTetris?.scoresUrl || '/wp-json/currybible/v1/tetris-scores';
  let scoreSaved = false;

  function setHighScoreMessage(message) {
    if (!highList) return;

    highList.innerHTML = '';

    const li = document.createElement('li');
    li.textContent = message;
    highList.appendChild(li);
  }

  async function loadHighScores() {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.scores)) {
        throw new Error(result.message || 'Could not load scores');
      }

      return result.scores;
    } catch (error) {
      console.error('Leaderboard error:', error);
      return [];
    }
  }

  async function renderHighScores() {
    if (!highList) return;

    setHighScoreMessage('Loading scores...');

    const hs = await loadHighScores();

    highList.innerHTML = '';

    if (!hs.length) {
      const li = document.createElement('li');
      li.textContent = 'No global scores yet. Be the first.';
      highList.appendChild(li);
      return;
    }

    for (const s of hs) {
      const li = document.createElement('li');
      li.textContent = `${s.player_name} — ${s.score} (Lv ${s.level_reached}, ${s.difficulty})`;
      highList.appendChild(li);
    }
  }

  async function addHighScore(name) {
    if (scoreSaved) return;

    const clean = (name || 'Player').trim().slice(0, 30) || 'Player';
    const difficulty = difficultySel?.value || 'normal';

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: clean,
          score,
          level,
          lines,
          difficulty
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Score could not be saved');
      }

      scoreSaved = true;

      if (saveBtn) {
        saveBtn.textContent = 'Score Saved';
      }

      await renderHighScores();
    } catch (error) {
      console.error('Save score error:', error);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Try Again';
      }

      alert(error.message || 'Sorry, your score could not be saved.');
    }
  }

  // ---- Game Flow ----
  function applyDifficulty() {
    const d = difficultySel?.value || 'normal';
    dropMs = (DIFFICULTY[d] || DIFFICULTY.normal).startMs;
  }

  function newGame() {
    playfield = makePlayfield();
    bag = [];
    current = spawnPiece(takeFromBag());
    next = spawnPiece(takeFromBag());
    hold = null;
    canHold = true;

    score = 0;
    lines = 0;
    level = 1;
    gameOver = false;
    scoreSaved = false;

    dropTimer = 0;
    lockTimer = 0;

    particles = [];
    clearFlash = { rows: [], t: 0 };

    applyDifficulty();

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Score';
    }

    syncUI();
    renderPreviews();
  }

  function start() {
    started = true;
    overlay.style.display = 'none';
    if (gameOverBox) gameOverBox.style.display = 'none';

    stage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    canvas.setAttribute('tabindex', '0');
    canvas.focus();

    newGame();

    lastTs = performance.now();
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(tick);
    document.body.classList.add('tetris-no-scroll');
  }

  function endGame() {
    gameOver = true;
    if (rAF) cancelAnimationFrame(rAF);
    rAF = null;

    overlay.style.display = 'flex';
    if (gameOverBox) gameOverBox.style.display = 'block';
    if (finalEl) finalEl.textContent = `Final score: ${score} — Level: ${level} — Lines: ${lines}`;

    renderHighScores();
    
    document.body.classList.remove('tetris-no-scroll');
  }

  function tick(ts) {
    const dt = ts - lastTs;
    lastTs = ts;

    clearCanvas();
    drawPlayfield();

    // ghost piece
    if (current) {
      const ghostRow = computeGhostRow();
      drawPiece(current, 0.22, ghostRow);
      drawPiece(current, 1, null);
    }

    // drop timing
    if (!gameOver && current) {
      dropTimer += dt;

      if (isValidMove(current.matrix, current.row + 1, current.col)) {
        lockTimer = 0;
      } else {
        lockTimer += dt;
        if (lockTimer >= lockDelayMs) {
          lockNow();
        }
      }

      if (dropTimer >= dropMs) {
        dropTimer = 0;
        if (isValidMove(current.matrix, current.row + 1, current.col)) {
          current.row++;
        } else {
          // start lock delay
          lockTimer += 0;
        }
      }
    }

    drawFlash(dt);
    updateParticles(dt);

    rAF = requestAnimationFrame(tick);
  }

  // ---- Controls ----
  function move(dx) {
    if (!current || gameOver) return;
    const col = current.col + dx;
    if (isValidMove(current.matrix, current.row, col)) {
      current.col = col;
      lockTimer = 0;
    }
  }

  function onKey(e) {
    if (!started || gameOver) return;

    const code = e.code || '';
    const which = e.which;

    // stop page scrolling with arrows/space
    if ([37,38,39,40].includes(which) || code === 'Space') e.preventDefault();

    if (which === 37) move(-1);
    if (which === 39) move(1);
    if (which === 38) { if (tryRotate()) lockTimer = 0; }
    if (which === 40) softDrop();

    if (code === 'Space') hardDrop();
    if (code === 'KeyC') holdPiece();
  }

  canvas.addEventListener('keydown', onKey);

  // start/restart
  playBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', start);

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      addHighScore(nameInput?.value || 'Player');
    });
  }

  // mobile buttons
  if (controls) {
    controls.addEventListener('pointerdown', function (e) {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      e.preventDefault();

      if (!started) start();
      if (gameOver) return;

      const action = btn.getAttribute('data-action');

      if (action === 'left') move(-1);
      if (action === 'right') move(1);
      if (action === 'rotate') { if (tryRotate()) lockTimer = 0; }
      if (action === 'down') softDrop();
      if (action === 'drop') hardDrop();
      if (action === 'hold') holdPiece();

      canvas.focus();
    });
  }

  // initial UI
  renderHighScores();
  syncUI();
})();
