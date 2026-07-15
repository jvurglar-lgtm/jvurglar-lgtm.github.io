import { createTetrisGame } from "./tetris.js";

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const nextState = siteNav.dataset.open !== "true";
    siteNav.dataset.open = String(nextState);
    navToggle.setAttribute("aria-expanded", String(nextState));
  });
}

const gameShells = Array.from(document.querySelectorAll("[data-game-shell]"));
let activeGame = "snake";

function setActiveGame(nextGame) {
  activeGame = nextGame;
  gameShells.forEach((shell) => {
    shell.dataset.active = String(shell.dataset.gameShell === nextGame);
  });
}

setActiveGame("snake");

const snakeCanvas = document.querySelector("#game-canvas");
const snakeScoreValue = document.querySelector("#score-value");
const snakeBestScoreValue = document.querySelector("#best-score-value");
const snakeStatusValue = document.querySelector("#game-status");
const snakeStartButton = document.querySelector("#start-button");
const snakePauseButton = document.querySelector("#pause-button");
const snakeRestartButton = document.querySelector("#restart-button");
const snakeTouchButtons = Array.from(
  document.querySelectorAll('[data-game-shell="snake"] .touch-button'),
);

const tetrisRoot = document.querySelector("#tetris-game");
const tetrisCanvas = document.querySelector("#tetris-canvas");
const tetrisScoreValue = document.querySelector("#tetris-score-value");
const tetrisBestScoreValue = document.querySelector("#tetris-best-score-value");
const tetrisStatusValue = document.querySelector("#tetris-status");
const tetrisStartButton = document.querySelector("#tetris-start-button");
const tetrisPauseButton = document.querySelector("#tetris-pause-button");
const tetrisRestartButton = document.querySelector("#tetris-restart-button");

const CELL_COUNT = 20;
const TICK_MS = 120;
const ENEMY_STEP_EVERY = 3;
const ENEMY_COUNT = 2;
const BEST_SCORE_KEY = "jvurglar-lgtm-snake-best-score";
const CENTER = Math.floor(CELL_COUNT / 2);

const snakeState = {
  timer: null,
  enemyTimer: 0,
  status: "ready",
  direction: { x: 1, y: 0 },
  queuedDirection: null,
  snake: [],
  food: { x: 0, y: 0 },
  enemies: [],
  score: 0,
  bestScore: Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10) || 0,
  message: "Start를 눌러 게임을 시작하세요.",
};

const snakeContext = snakeCanvas?.getContext("2d") ?? null;

const tetrisGame = createTetrisGame({
  root: tetrisRoot,
  canvas: tetrisCanvas,
  scoreValue: tetrisScoreValue,
  bestScoreValue: tetrisBestScoreValue,
  statusValue: tetrisStatusValue,
  startButton: tetrisStartButton,
  pauseButton: tetrisPauseButton,
  restartButton: tetrisRestartButton,
  onActivate: () => setActiveGame("tetris"),
});

function updateSnakeStatus(value, message) {
  snakeState.status = value;
  if (snakeStatusValue) {
    snakeStatusValue.textContent = message;
  }
}

function updateSnakeScoreboard() {
  if (snakeScoreValue) {
    snakeScoreValue.textContent = String(snakeState.score);
  }
  if (snakeBestScoreValue) {
    snakeBestScoreValue.textContent = String(snakeState.bestScore);
  }
}

function resizeSnakeCanvas() {
  if (!snakeCanvas || !snakeContext) return;
  const size = snakeCanvas.clientWidth || 480;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  snakeCanvas.width = Math.floor(size * dpr);
  snakeCanvas.height = Math.floor(size * dpr);
  snakeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderSnake();
}

function createRandomCell(exclusions = []) {
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * CELL_COUNT),
      y: Math.floor(Math.random() * CELL_COUNT),
    };
  } while (exclusions.some((item) => item.x === cell.x && item.y === cell.y));
  return cell;
}

function createEnemyPositions(exclusions = []) {
  const enemies = [];
  while (enemies.length < ENEMY_COUNT) {
    const next = createRandomCell([...exclusions, ...enemies]);
    enemies.push(next);
  }
  return enemies;
}

function resetSnakeGame() {
  snakeState.direction = { x: 1, y: 0 };
  snakeState.queuedDirection = null;
  snakeState.snake = [
    { x: CENTER - 1, y: CENTER },
    { x: CENTER - 2, y: CENTER },
    { x: CENTER - 3, y: CENTER },
  ];
  snakeState.food = createRandomCell(snakeState.snake);
  snakeState.enemies = createEnemyPositions([...snakeState.snake, snakeState.food]);
  snakeState.score = 0;
  snakeState.enemyTimer = 0;
  snakeState.message = "게임 시작 대기 중";
  updateSnakeScoreboard();
  updateSnakeStatus("ready", "Ready");
  renderSnake();
}

function startSnakeLoop() {
  if (snakeState.timer) {
    return;
  }
  snakeState.timer = window.setInterval(tickSnake, TICK_MS);
}

function stopSnakeLoop() {
  if (!snakeState.timer) {
    return;
  }
  window.clearInterval(snakeState.timer);
  snakeState.timer = null;
}

function startSnakeGame() {
  setActiveGame("snake");
  if (snakeState.status === "gameover") {
    resetSnakeGame();
  }

  if (snakeState.status === "ready") {
    updateSnakeStatus("playing", "Playing");
    snakeState.message = "게임 진행 중";
    startSnakeLoop();
    renderSnake();
  } else if (snakeState.status === "paused") {
    updateSnakeStatus("playing", "Playing");
    snakeState.message = "게임 재개";
    startSnakeLoop();
    renderSnake();
  }
}

function pauseSnakeGame() {
  setActiveGame("snake");
  if (snakeState.status === "playing") {
    stopSnakeLoop();
    updateSnakeStatus("paused", "Paused");
    snakeState.message = "일시정지";
    renderSnake();
  }
}

function gameOver(reason) {
  stopSnakeLoop();
  updateSnakeStatus("gameover", `Game Over (${reason})`);
  snakeState.message = reason;
  renderSnake();
}

function isOppositeDirection(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function queueDirection(nextDirection) {
  if (isOppositeDirection(snakeState.direction, nextDirection)) {
    return;
  }

  if (snakeState.queuedDirection && isOppositeDirection(snakeState.queuedDirection, nextDirection)) {
    return;
  }

  snakeState.queuedDirection = nextDirection;
  if (snakeState.status === "ready") {
    startSnakeGame();
  }
}

function maybeApplyQueuedDirection() {
  if (!snakeState.queuedDirection) {
    return;
  }

  if (isOppositeDirection(snakeState.direction, snakeState.queuedDirection)) {
    snakeState.queuedDirection = null;
    return;
  }

  snakeState.direction = snakeState.queuedDirection;
  snakeState.queuedDirection = null;
}

function pickEnemyNextCell(enemy, exclusions = []) {
  const directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];
  const shuffled = directions.sort(() => Math.random() - 0.5);

  for (const delta of shuffled) {
    const next = {
      x: (enemy.x + delta.x + CELL_COUNT) % CELL_COUNT,
      y: (enemy.y + delta.y + CELL_COUNT) % CELL_COUNT,
    };
    if (!exclusions.some((item) => item.x === next.x && item.y === next.y)) {
      return next;
    }
  }

  return enemy;
}

function moveEnemies() {
  const nextEnemies = [];
  for (const enemy of snakeState.enemies) {
    const nextEnemy = pickEnemyNextCell(enemy, [...snakeState.snake, snakeState.food, ...nextEnemies]);
    nextEnemies.push(nextEnemy);
  }
  snakeState.enemies = nextEnemies;
}

function anyEnemyTouchesSnake() {
  return snakeState.enemies.some((enemy) =>
    snakeState.snake.some((segment) => segment.x === enemy.x && segment.y === enemy.y),
  );
}

function tickSnake() {
  maybeApplyQueuedDirection();

  const head = snakeState.snake[0];
  const nextHead = {
    x: head.x + snakeState.direction.x,
    y: head.y + snakeState.direction.y,
  };

  if (nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= CELL_COUNT || nextHead.y >= CELL_COUNT) {
    gameOver("벽에 충돌");
    return;
  }

  if (snakeState.snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
    gameOver("자기 몸과 충돌");
    return;
  }

  if (snakeState.enemies.some((enemy) => enemy.x === nextHead.x && enemy.y === nextHead.y)) {
    gameOver("적과 충돌");
    return;
  }

  snakeState.snake.unshift(nextHead);

  const ateFood = nextHead.x === snakeState.food.x && nextHead.y === snakeState.food.y;
  if (ateFood) {
    snakeState.score += 1;
    if (snakeState.score > snakeState.bestScore) {
      snakeState.bestScore = snakeState.score;
      localStorage.setItem(BEST_SCORE_KEY, String(snakeState.bestScore));
    }
    snakeState.food = createRandomCell([...snakeState.snake, ...snakeState.enemies]);
    snakeState.message = "먹이를 먹었습니다";
  } else {
    snakeState.snake.pop();
  }

  snakeState.enemyTimer += 1;
  if (snakeState.enemyTimer % ENEMY_STEP_EVERY === 0) {
    moveEnemies();
    if (anyEnemyTouchesSnake()) {
      gameOver("적과 충돌");
      return;
    }
  }

  updateSnakeScoreboard();
  updateSnakeStatus("playing", "Playing");
  renderSnake();
}

function drawSnakeCell(x, y, color, inset = 0) {
  if (!snakeContext || !snakeCanvas) return;
  const cellSize = snakeCanvas.clientWidth / CELL_COUNT;
  const padding = cellSize * inset;
  snakeContext.fillStyle = color;
  snakeContext.fillRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);
}

function renderSnakeGrid() {
  if (!snakeContext || !snakeCanvas) return;
  const cellSize = snakeCanvas.clientWidth / CELL_COUNT;
  snakeContext.strokeStyle = "rgba(24, 119, 242, 0.08)";
  snakeContext.lineWidth = 1;

  for (let i = 0; i <= CELL_COUNT; i += 1) {
    snakeContext.beginPath();
    snakeContext.moveTo(i * cellSize, 0);
    snakeContext.lineTo(i * cellSize, snakeCanvas.clientHeight);
    snakeContext.stroke();

    snakeContext.beginPath();
    snakeContext.moveTo(0, i * cellSize);
    snakeContext.lineTo(snakeCanvas.clientWidth, i * cellSize);
    snakeContext.stroke();
  }
}

function renderSnake() {
  if (!snakeContext || !snakeCanvas) return;

  const cssWidth = snakeCanvas.clientWidth;
  const scale = cssWidth / CELL_COUNT;

  snakeContext.clearRect(0, 0, snakeCanvas.clientWidth, snakeCanvas.clientHeight);
  snakeContext.fillStyle = "#edf3fb";
  snakeContext.fillRect(0, 0, snakeCanvas.clientWidth, snakeCanvas.clientHeight);

  renderSnakeGrid();

  if (snakeState.food) {
    drawSnakeCell(snakeState.food.x, snakeState.food.y, "#f7c948", 0.2);
  }

  snakeState.enemies.forEach((enemy, index) => {
    const color = index === 0 ? "#ff6b6b" : "#b28dff";
    drawSnakeCell(enemy.x, enemy.y, color, 0.15);
  });

  snakeState.snake.forEach((segment, index) => {
    const color = index === 0 ? "#1877f2" : "rgba(24, 119, 242, 0.82)";
    drawSnakeCell(segment.x, segment.y, color, index === 0 ? 0.12 : 0.18);
  });

  snakeContext.fillStyle = "rgba(28, 30, 33, 0.9)";
  snakeContext.font = `600 ${Math.max(14, scale * 0.55)}px "SF Pro Text", "Segoe UI", sans-serif`;
  snakeContext.textAlign = "left";
  snakeContext.fillText(snakeState.message, 16, 28);

  if (snakeState.status !== "playing") {
    snakeContext.fillStyle = "rgba(255, 255, 255, 0.62)";
    snakeContext.fillRect(0, snakeCanvas.clientHeight / 2 - 36, snakeCanvas.clientWidth, 72);
    snakeContext.fillStyle = "#1c1e21";
    snakeContext.textAlign = "center";
    snakeContext.font = `700 ${Math.max(18, scale * 0.8)}px "SF Pro Display", "Segoe UI", sans-serif`;
    const overlayText =
      snakeState.status === "gameover"
        ? "Game Over"
        : snakeState.status === "paused"
          ? "Paused"
          : "Ready";
    snakeContext.fillText(overlayText, snakeCanvas.clientWidth / 2, snakeCanvas.clientHeight / 2 + 8);
  }
}

function restartSnakeGame() {
  setActiveGame("snake");
  stopSnakeLoop();
  resetSnakeGame();
  startSnakeGame();
}

function handleSnakeKey(key) {
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowRight: { x: 1, y: 0 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
  };

  if (key === "p" || key === "P") {
    setActiveGame("snake");
    if (snakeState.status === "playing") {
      pauseSnakeGame();
    } else if (snakeState.status === "paused" || snakeState.status === "ready") {
      startSnakeGame();
    }
    return;
  }

  if (key === "r" || key === "R") {
    setActiveGame("snake");
    restartSnakeGame();
    return;
  }

  const direction = directions[key];
  if (direction) {
    setActiveGame("snake");
    queueDirection(direction);
  }
}

snakeCanvas?.addEventListener("pointerdown", () => setActiveGame("snake"));

document.addEventListener("keydown", (event) => {
  if (activeGame === "tetris" && tetrisGame.handleKeyDown(event.key)) {
    return;
  }
  handleSnakeKey(event.key);
});

snakeStartButton?.addEventListener("click", () => {
  setActiveGame("snake");
  startSnakeGame();
});
snakePauseButton?.addEventListener("click", () => {
  setActiveGame("snake");
  pauseSnakeGame();
});
snakeRestartButton?.addEventListener("click", () => {
  setActiveGame("snake");
  restartSnakeGame();
});

snakeTouchButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveGame("snake");
    const directionName = button.dataset.direction;
    const action = button.dataset.action;

    if (directionName) {
      const directions = {
        up: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
      };
      queueDirection(directions[directionName]);
      return;
    }

    if (action === "pause") {
      if (snakeState.status === "playing") {
        pauseSnakeGame();
      } else {
        startSnakeGame();
      }
    }
  });
});

window.addEventListener("resize", resizeSnakeCanvas);

resetSnakeGame();
resizeSnakeCanvas();
