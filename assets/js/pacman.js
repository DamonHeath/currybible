(function () {
  const canvas = document.getElementById('pacman-game');
  const overlay = document.getElementById('pacman-overlay');
  const playBtn = document.getElementById('pacman-play-btn');
  const restartBtn = document.getElementById('pacman-restart-btn');
  const saveBtn = document.getElementById('pacman-save-score');
  const nameInput = document.getElementById('pacman-name');
  const finalEl = document.getElementById('pacman-final');
  const difficultySel = document.getElementById('pacman-difficulty');
  const gameOverBox = document.getElementById('pacman-gameover');
  const scoreEl = document.getElementById('pacman-score');
  const levelEl = document.getElementById('pacman-level');
  const livesEl = document.getElementById('pacman-lives');
  const highList = document.getElementById('pacman-highscore-list');
  const controls = document.getElementById('pacman-controls');
  const stage = document.getElementById('pacman-stage');

  if (!canvas || !overlay || !playBtn || !restartBtn) return;

  const ctx = canvas.getContext('2d');
  const TILE = 16;
  const COLS = 28;
  const ROWS = 31;

  const API_URL = window.currybiblePacman?.scoresUrl || '/wp-json/currybible/v1/pacman-scores';

  const BASE_MAP = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ###--### ##.#     ',
    '######.## #      # ##.######',
    '      .   #      #   .      ',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o..##................##..o#',
    '###.##.##.########.##.##.###',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################',
    '############################'
  ];

  const DIRS = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    none: { x: 0, y: 0 }
  };

  const DIFFICULTY = {
    easy: { tick: 150, ghostEvery: 2, lives: 4 },
    normal: { tick: 125, ghostEvery: 1, lives: 3 },
    hard: { tick: 100, ghostEvery: 1, lives: 2 }
  };

  let map;
  let pacman;
  let ghosts;
  let score = 0;
  let level = 1;
  let lives = 3;
  let pellets = 0;
  let pelletsEaten = 0;
  let poweredTicks = 0;
  let started = false;
  let gameOver = false;
  let scoreSaved = false;
  let loopId = null;
  let tickCount = 0;

  function cloneMap() {
    return BASE_MAP.map((row) => row.split(''));
  }

  function countPellets() {
    let count = 0;
    for (const row of map) {
      for (const cell of row) {
        if (cell === '.' || cell === 'o') count++;
      }
    }
    return count;
  }

  function resetPositions() {
    pacman = {
      x: 13,
      y: 23,
      dir: DIRS.left,
      nextDir: DIRS.left,
      mouth: 0
    };

    ghosts = [
      { x: 13, y: 14, startX: 13, startY: 14, dir: DIRS.left, color: '#ff4d4d' },
      { x: 14, y: 14, startX: 14, startY: 14, dir: DIRS.right, color: '#ff9bd3' },
      { x: 13, y: 15, startX: 13, startY: 15, dir: DIRS.up, color: '#45d9ff' },
      { x: 14, y: 15, startX: 14, startY: 15, dir: DIRS.down, color: '#ffb347' }
    ];
  }

  function startGame(resetScore) {
    const preset = DIFFICULTY[difficultySel?.value || 'normal'] || DIFFICULTY.normal;

    if (resetScore) {
      score = 0;
      level = 1;
      pelletsEaten = 0;
      lives = preset.lives;
    }

    map = cloneMap();
    pellets = countPellets();
    poweredTicks = 0;
    gameOver = false;
    started = true;
    scoreSaved = false;
    tickCount = 0;
    resetPositions();
    updateHud();

    overlay.style.display = 'none';
    gameOverBox.style.display = 'none';
    playBtn.style.display = '';
    playBtn.textContent = 'Play Now';

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Score';
    }

    stopLoop();
    loopId = window.setInterval(gameTick, preset.tick);
    draw();
  }

  function stopLoop() {
    if (loopId) {
      window.clearInterval(loopId);
      loopId = null;
    }
  }

  function endGame(message) {
    stopLoop();
    started = false;
    gameOver = true;

    overlay.style.display = 'flex';
    gameOverBox.style.display = 'block';
    playBtn.style.display = 'none';

    if (finalEl) {
      finalEl.textContent = message || `Game over. Final score: ${score}.`;
    }
  }

  function nextLevel() {
    level += 1;
    score += 1000;
    map = cloneMap();
    pellets = countPellets();
    poweredTicks = 0;
    resetPositions();
    updateHud();
  }

  function loseLife() {
    lives -= 1;
    poweredTicks = 0;
    updateHud();

    if (lives <= 0) {
      endGame(`Game over. Final score: ${score}. Level reached: ${level}.`);
      return;
    }

    resetPositions();
  }

  function updateHud() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (levelEl) levelEl.textContent = String(level);
    if (livesEl) livesEl.textContent = String(lives);
  }

  function cellAt(x, y) {
    if (y < 0 || y >= ROWS) return '#';
    if (x < 0) return map[y][COLS - 1];
    if (x >= COLS) return map[y][0];
    return map[y][x];
  }

  function setCell(x, y, value) {
    if (y < 0 || y >= ROWS) return;
    if (x < 0 || x >= COLS) return;
    map[y][x] = value;
  }

  function isWall(x, y) {
    const cell = cellAt(x, y);
    return cell === '#';
  }

  function wrapEntity(entity) {
    if (entity.x < 0) entity.x = COLS - 1;
    if (entity.x >= COLS) entity.x = 0;
  }

  function canMove(entity, dir) {
    return !isWall(entity.x + dir.x, entity.y + dir.y);
  }

  function sameTile(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function setDirection(directionName) {
    if (!DIRS[directionName]) return;
    pacman.nextDir = DIRS[directionName];
  }

  function movePacman() {
    if (canMove(pacman, pacman.nextDir)) {
      pacman.dir = pacman.nextDir;
    }

    if (canMove(pacman, pacman.dir)) {
      pacman.x += pacman.dir.x;
      pacman.y += pacman.dir.y;
      wrapEntity(pacman);
    }

    const cell = cellAt(pacman.x, pacman.y);

    if (cell === '.') {
      score += 10;
      pellets -= 1;
      pelletsEaten += 1;
      setCell(pacman.x, pacman.y, ' ');
    }

    if (cell === 'o') {
      score += 50;
      pellets -= 1;
      pelletsEaten += 1;
      poweredTicks = 70;
      setCell(pacman.x, pacman.y, ' ');
    }

    if (pellets <= 0) {
      nextLevel();
    }
  }

  function getPossibleDirs(ghost) {
    const opposite = { x: -ghost.dir.x, y: -ghost.dir.y };

    return Object.values(DIRS).filter((dir) => {
      if (dir === DIRS.none) return false;
      if (dir.x === opposite.x && dir.y === opposite.y) return false;
      return canMove(ghost, dir);
    });
  }

  function pickGhostDir(ghost) {
    let choices = getPossibleDirs(ghost);

    if (!choices.length) {
      choices = Object.values(DIRS).filter((dir) => dir !== DIRS.none && canMove(ghost, dir));
    }

    if (!choices.length) return DIRS.none;

    const frightened = poweredTicks > 0;
    const shouldChase = Math.random() < (frightened ? 0.2 : 0.68);

    if (!shouldChase) {
      return choices[Math.floor(Math.random() * choices.length)];
    }

    choices.sort((a, b) => {
      const ax = ghost.x + a.x;
      const ay = ghost.y + a.y;
      const bx = ghost.x + b.x;
      const by = ghost.y + b.y;
      const da = Math.abs(ax - pacman.x) + Math.abs(ay - pacman.y);
      const db = Math.abs(bx - pacman.x) + Math.abs(by - pacman.y);
      return frightened ? db - da : da - db;
    });

    return choices[0];
  }

  function moveGhosts() {
    const preset = DIFFICULTY[difficultySel?.value || 'normal'] || DIFFICULTY.normal;

    if (tickCount % preset.ghostEvery !== 0) return;

    for (const ghost of ghosts) {
      const atJunction = getPossibleDirs(ghost).length > 1;

      if (!canMove(ghost, ghost.dir) || atJunction || Math.random() < 0.12) {
        ghost.dir = pickGhostDir(ghost);
      }

      if (canMove(ghost, ghost.dir)) {
        ghost.x += ghost.dir.x;
        ghost.y += ghost.dir.y;
        wrapEntity(ghost);
      }
    }
  }

  function handleCollisions() {
    for (const ghost of ghosts) {
      if (!sameTile(pacman, ghost)) continue;

      if (poweredTicks > 0) {
        score += 200;
        ghost.x = ghost.startX;
        ghost.y = ghost.startY;
        ghost.dir = DIRS.up;
        updateHud();
      } else {
        loseLife();
      }
    }
  }

  function gameTick() {
    if (!started || gameOver) return;

    tickCount += 1;
    movePacman();
    handleCollisions();
    moveGhosts();
    handleCollisions();

    if (poweredTicks > 0) poweredTicks -= 1;

    pacman.mouth = (pacman.mouth + 1) % 4;
    updateHud();
    draw();
  }

  function drawWall(x, y) {
    ctx.fillStyle = '#1f4cff';
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    ctx.fillStyle = '#0b1b7a';
    ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
  }

  function drawMap() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = cellAt(x, y);
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;

        if (cell === '#') {
          drawWall(x, y);
        } else if (cell === '.') {
          ctx.fillStyle = '#f5e6d3';
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 'o') {
          ctx.fillStyle = '#d9a066';
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === '-') {
          ctx.fillStyle = '#d9a066';
          ctx.fillRect(x * TILE, y * TILE + 7, TILE, 2);
        }
      }
    }
  }

  function drawPacman() {
    const cx = pacman.x * TILE + TILE / 2;
    const cy = pacman.y * TILE + TILE / 2;
    const radius = TILE / 2 - 1;
    const mouthSize = pacman.mouth < 2 ? 0.22 : 0.06;
    let angle = 0;

    if (pacman.dir === DIRS.left) angle = Math.PI;
    if (pacman.dir === DIRS.up) angle = -Math.PI / 2;
    if (pacman.dir === DIRS.down) angle = Math.PI / 2;

    ctx.fillStyle = '#ffd83d';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle + mouthSize * Math.PI, angle + (2 - mouthSize) * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  function drawGhost(ghost) {
    const x = ghost.x * TILE;
    const y = ghost.y * TILE;
    const frightened = poweredTicks > 0;

    ctx.fillStyle = frightened ? '#3b5cff' : ghost.color;
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + TILE / 2, TILE / 2 - 1, Math.PI, 0);
    ctx.lineTo(x + TILE - 1, y + TILE - 2);
    ctx.lineTo(x + TILE * 0.75, y + TILE - 5);
    ctx.lineTo(x + TILE * 0.5, y + TILE - 2);
    ctx.lineTo(x + TILE * 0.25, y + TILE - 5);
    ctx.lineTo(x + 1, y + TILE - 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 5, y + 7, 2.2, 0, Math.PI * 2);
    ctx.arc(x + 11, y + 7, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + 5, y + 7, 1, 0, Math.PI * 2);
    ctx.arc(x + 11, y + 7, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    drawMap();
    for (const ghost of ghosts || []) drawGhost(ghost);
    if (pacman) drawPacman();
  }

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
        headers: { Accept: 'application/json' }
      });

      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.scores)) {
        throw new Error(result.message || 'Could not load scores');
      }

      return result.scores;
    } catch (error) {
      console.error('Pac-Man leaderboard error:', error);
      return [];
    }
  }

  async function renderHighScores() {
    if (!highList) return;

    setHighScoreMessage('Loading scores...');
    const scores = await loadHighScores();
    highList.innerHTML = '';

    if (!scores.length) {
      const li = document.createElement('li');
      li.textContent = 'No global scores yet. Be the first.';
      highList.appendChild(li);
      return;
    }

    for (const s of scores) {
      const li = document.createElement('li');
      li.textContent = `${s.player_name} — ${s.score} (Lv ${s.level_reached}, ${s.difficulty})`;
      highList.appendChild(li);
    }
  }

  async function saveScore(name) {
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
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name: clean,
          score,
          level,
          pellets: pelletsEaten,
          difficulty
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Score could not be saved');
      }

      scoreSaved = true;

      if (saveBtn) saveBtn.textContent = 'Score Saved';
      await renderHighScores();
    } catch (error) {
      console.error('Pac-Man save score error:', error);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Try Again';
      }

      if (finalEl) {
        finalEl.textContent = `${finalEl.textContent} Score did not save: ${error.message}`;
      }
    }
  }

  playBtn.addEventListener('click', () => startGame(true));
  restartBtn.addEventListener('click', () => startGame(true));

  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveScore(nameInput?.value));
  }


  if (difficultySel) {
    difficultySel.addEventListener('change', () => {
      if (started) return;
      lives = (DIFFICULTY[difficultySel.value] || DIFFICULTY.normal).lives;
      updateHud();
    });
  }

  window.addEventListener('keydown', (event) => {
    const keys = {
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down'
    };

    const direction = keys[event.key];
    if (!direction) return;

    const rect = canvas.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;

    if (started && inView) {
      event.preventDefault();
      setDirection(direction);
    }
  });

  if (controls) {
    controls.addEventListener('pointerdown', (event) => {
      const button = event.target.closest('button[data-direction]');
      if (!button) return;

      event.preventDefault();
      setDirection(button.dataset.direction);
    });
  }

  function blockPageScroll() {
    if (started) document.body.classList.add('tetris-no-scroll');
  }

  function unblockPageScroll() {
    document.body.classList.remove('tetris-no-scroll');
  }

  if (stage) {
    stage.addEventListener('pointerenter', blockPageScroll);
    stage.addEventListener('pointerleave', unblockPageScroll);
    stage.addEventListener('touchstart', blockPageScroll, { passive: true });
    stage.addEventListener('touchend', unblockPageScroll, { passive: true });
  }

  window.addEventListener('blur', unblockPageScroll);

  map = cloneMap();
  pellets = countPellets();
  lives = (DIFFICULTY[difficultySel?.value || 'normal'] || DIFFICULTY.normal).lives;
  resetPositions();
  updateHud();
  draw();
  renderHighScores();
})();
