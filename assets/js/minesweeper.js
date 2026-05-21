(function () {
  const canvas = document.getElementById('minesweeper-game');
  const overlay = document.getElementById('minesweeper-overlay');
  const playBtn = document.getElementById('minesweeper-play-btn');
  const restartBtn = document.getElementById('minesweeper-restart-btn');
  const saveBtn = document.getElementById('minesweeper-save-score');
  const nameInput = document.getElementById('minesweeper-name');
  const finalEl = document.getElementById('minesweeper-final');
  const difficultySel = document.getElementById('minesweeper-difficulty');
  const gameOverBox = document.getElementById('minesweeper-gameover');
  const scoreEl = document.getElementById('minesweeper-score');
  const timeEl = document.getElementById('minesweeper-time');
  const minesEl = document.getElementById('minesweeper-mines');
  const highList = document.getElementById('minesweeper-highscore-list');
  const controls = document.getElementById('minesweeper-controls');
  const flagBtn = document.getElementById('minesweeper-flag-btn');
  const newBtn = document.getElementById('minesweeper-new-btn');
  const stage = document.getElementById('minesweeper-stage');

  if (!canvas || !overlay || !playBtn || !restartBtn) return;

  const ctx = canvas.getContext('2d');
  const API_URL = window.currybibleMinesweeper?.scoresUrl || '/wp-json/currybible/v1/minesweeper-scores';

  const DIFFICULTY = {
    easy: { rows: 8, cols: 8, mines: 10, label: 'Easy' },
    normal: { rows: 10, cols: 10, mines: 18, label: 'Normal' },
    hard: { rows: 12, cols: 12, mines: 30, label: 'Hard' }
  };

  let grid = [];
  let rows = 10;
  let cols = 10;
  let mines = 18;
  let tile = 48;
  let revealed = 0;
  let flags = 0;
  let score = 0;
  let seconds = 0;
  let started = false;
  let gameOver = false;
  let won = false;
  let firstClick = true;
  let scoreSaved = false;
  let flagMode = false;
  let timerId = null;
  let longPressTimer = null;
  let longPressFired = false;

  function preset() {
    return DIFFICULTY[difficultySel?.value || 'normal'] || DIFFICULTY.normal;
  }

  function resizeCanvas() {
    const p = preset();
    rows = p.rows;
    cols = p.cols;
    mines = p.mines;
    tile = Math.floor(480 / Math.max(rows, cols));
    canvas.width = cols * tile;
    canvas.height = rows * tile;
  }

  function makeCell(x, y) {
    return {
      x,
      y,
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0
    };
  }

  function resetBoard() {
    resizeCanvas();
    grid = [];
    for (let y = 0; y < rows; y += 1) {
      const row = [];
      for (let x = 0; x < cols; x += 1) row.push(makeCell(x, y));
      grid.push(row);
    }

    revealed = 0;
    flags = 0;
    score = 0;
    seconds = 0;
    gameOver = false;
    won = false;
    firstClick = true;
    scoreSaved = false;
    flagMode = false;
    updateFlagButton();
    updateHud();
    draw();
  }

  function startGame() {
    resetBoard();
    started = true;
    overlay.style.display = 'none';
    gameOverBox.style.display = 'none';
    playBtn.style.display = '';
    playBtn.textContent = 'Play Now';

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Score';
    }

    stopTimer();
    timerId = window.setInterval(() => {
      if (!started || gameOver) return;
      seconds += 1;
      updateHud();
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function endGame(message, isWin) {
    stopTimer();
    started = false;
    gameOver = true;
    won = Boolean(isWin);

    if (!won) revealAllMines();
    calculateScore();
    updateHud();
    draw();

    overlay.style.display = 'flex';
    gameOverBox.style.display = 'block';
    playBtn.style.display = 'none';

    if (finalEl) {
      finalEl.textContent = message || `Game over. Final score: ${score}.`;
    }

    if (saveBtn) {
      saveBtn.style.display = score > 0 ? '' : 'none';
    }
  }

  function calculateScore() {
    const difficultyBonus = difficultySel?.value === 'hard' ? 3 : difficultySel?.value === 'easy' ? 1 : 2;
    const safeTiles = rows * cols - mines;
    const revealScore = revealed * 25 * difficultyBonus;
    const flagScore = Math.max(0, correctFlags()) * 15 * difficultyBonus;
    const winBonus = won ? 1500 * difficultyBonus : 0;
    const speedBonus = won ? Math.max(0, 900 - seconds * 6) * difficultyBonus : 0;
    const progressBonus = Math.floor((revealed / safeTiles) * 500 * difficultyBonus);
    score = Math.max(0, Math.floor(revealScore + flagScore + winBonus + speedBonus + progressBonus));
  }

  function updateHud() {
    calculateScore();
    if (scoreEl) scoreEl.textContent = String(score);
    if (timeEl) timeEl.textContent = String(seconds);
    if (minesEl) minesEl.textContent = String(Math.max(0, mines - flags));
  }

  function updateFlagButton() {
    if (!flagBtn) return;
    flagBtn.textContent = flagMode ? 'Flag Mode: On' : 'Flag Mode: Off';
    flagBtn.classList.toggle('is-active', flagMode);
  }

  function neighbours(x, y) {
    const cells = [];
    for (let yy = y - 1; yy <= y + 1; yy += 1) {
      for (let xx = x - 1; xx <= x + 1; xx += 1) {
        if (xx === x && yy === y) continue;
        if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
        cells.push(grid[yy][xx]);
      }
    }
    return cells;
  }

  function placeMines(safeX, safeY) {
    const forbidden = new Set([`${safeX},${safeY}`]);
    for (const cell of neighbours(safeX, safeY)) forbidden.add(`${cell.x},${cell.y}`);

    let placed = 0;
    while (placed < mines) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      const cell = grid[y][x];
      if (cell.mine || forbidden.has(`${x},${y}`)) continue;
      cell.mine = true;
      placed += 1;
    }

    for (const row of grid) {
      for (const cell of row) {
        cell.adjacent = neighbours(cell.x, cell.y).filter((n) => n.mine).length;
      }
    }
  }

  function revealCell(cell) {
    if (!cell || cell.revealed || cell.flagged || gameOver) return;

    if (firstClick) {
      placeMines(cell.x, cell.y);
      firstClick = false;
    }

    cell.revealed = true;
    revealed += 1;

    if (cell.mine) {
      endGame(`Boom. Final score: ${score}. You lasted ${seconds}s.`, false);
      return;
    }

    if (cell.adjacent === 0) {
      for (const next of neighbours(cell.x, cell.y)) revealCell(next);
    }

    checkWin();
    updateHud();
    draw();
  }

  function toggleFlag(cell) {
    if (!cell || cell.revealed || gameOver) return;
    cell.flagged = !cell.flagged;
    flags += cell.flagged ? 1 : -1;
    updateHud();
    draw();
  }

  function correctFlags() {
    let count = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell.flagged && cell.mine) count += 1;
      }
    }
    return count;
  }

  function checkWin() {
    const safeTiles = rows * cols - mines;
    if (revealed >= safeTiles) {
      for (const row of grid) {
        for (const cell of row) {
          if (cell.mine && !cell.flagged) {
            cell.flagged = true;
            flags += 1;
          }
        }
      }
      endGame(`Board cleared. Final score: ${score}. Time: ${seconds}s.`, true);
    }
  }

  function revealAllMines() {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.mine) cell.revealed = true;
      }
    }
  }

  function getCellFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX / tile);
    const y = Math.floor((event.clientY - rect.top) * scaleY / tile);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
    return grid[y][x];
  }

  function drawTile(cell) {
    const x = cell.x * tile;
    const y = cell.y * tile;
    const gap = Math.max(1, Math.floor(tile * 0.04));
    const size = tile - gap;

    ctx.lineWidth = 1;

    if (cell.revealed) {
      ctx.fillStyle = cell.mine ? '#7c241d' : '#fff8ef';
      ctx.fillRect(x + gap / 2, y + gap / 2, size, size);
      ctx.strokeStyle = 'rgba(107, 62, 38, 0.18)';
      ctx.strokeRect(x + gap / 2, y + gap / 2, size, size);

      if (cell.mine) {
        ctx.fillStyle = '#1a1410';
        ctx.beginPath();
        ctx.arc(x + tile / 2, y + tile / 2, tile * 0.23, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff8ef';
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(x + tile / 2, y + tile / 2);
          ctx.lineTo(x + tile / 2 + Math.cos(angle) * tile * 0.34, y + tile / 2 + Math.sin(angle) * tile * 0.34);
          ctx.stroke();
        }
      } else if (cell.adjacent > 0) {
        ctx.fillStyle = '#6b3e26';
        ctx.font = `900 ${Math.floor(tile * 0.48)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(cell.adjacent), x + tile / 2, y + tile / 2 + 1);
      }
    } else {
      ctx.fillStyle = '#d9a066';
      ctx.fillRect(x + gap / 2, y + gap / 2, size, size);
      ctx.fillStyle = 'rgba(255, 248, 239, 0.2)';
      ctx.fillRect(x + gap / 2, y + gap / 2, size, Math.max(2, tile * 0.18));
      ctx.strokeStyle = 'rgba(43, 26, 18, 0.32)';
      ctx.strokeRect(x + gap / 2, y + gap / 2, size, size);

      if (cell.flagged) {
        ctx.fillStyle = '#7c241d';
        ctx.beginPath();
        ctx.moveTo(x + tile * 0.35, y + tile * 0.25);
        ctx.lineTo(x + tile * 0.72, y + tile * 0.38);
        ctx.lineTo(x + tile * 0.35, y + tile * 0.52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#2b1a12';
        ctx.lineWidth = Math.max(2, tile * 0.04);
        ctx.beginPath();
        ctx.moveTo(x + tile * 0.35, y + tile * 0.25);
        ctx.lineTo(x + tile * 0.35, y + tile * 0.78);
        ctx.lineTo(x + tile * 0.68, y + tile * 0.78);
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const row of grid) {
      for (const cell of row) drawTile(cell);
    }
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
      console.error('Minesweeper leaderboard error:', error);
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
      li.textContent = `${s.player_name} — ${s.score} (${s.time_taken}s, ${s.difficulty})`;
      highList.appendChild(li);
    }
  }

  async function saveScore(name) {
    if (scoreSaved || score < 1) return;

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
          time: seconds,
          mines,
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
      console.error('Minesweeper save score error:', error);

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Try Again';
      }

      if (finalEl) finalEl.textContent = `${finalEl.textContent} Score did not save: ${error.message}`;
    }
  }

  playBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  if (newBtn) newBtn.addEventListener('click', startGame);
  if (saveBtn) saveBtn.addEventListener('click', () => saveScore(nameInput?.value));

  if (difficultySel) {
    difficultySel.addEventListener('change', () => {
      if (started) return;
      resetBoard();
    });
  }

  if (flagBtn) {
    flagBtn.addEventListener('click', () => {
      flagMode = !flagMode;
      updateFlagButton();
    });
  }

  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (!started) return;
    toggleFlag(getCellFromEvent(event));
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (!started) return;
    longPressFired = false;

    if (event.pointerType === 'touch') {
      longPressTimer = window.setTimeout(() => {
        longPressFired = true;
        toggleFlag(getCellFromEvent(event));
      }, 520);
    }
  });

  canvas.addEventListener('pointerup', (event) => {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (!started || longPressFired) return;
    const cell = getCellFromEvent(event);
    if (flagMode) toggleFlag(cell);
    else revealCell(cell);
  });

  canvas.addEventListener('pointerleave', () => {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  });

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

  resetBoard();
  renderHighScores();
})();
