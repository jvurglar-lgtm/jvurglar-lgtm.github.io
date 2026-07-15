const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const nextState = siteNav.dataset.open !== "true";
    siteNav.dataset.open = String(nextState);
    navToggle.setAttribute("aria-expanded", String(nextState));
  });
}

const canvas = document.querySelector("#game-canvas");
const scoreValue = document.querySelector("#score-value");
const bestScoreValue = document.querySelector("#best-score-value");
const gameStatus = document.querySelector("#game-status");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const touchButtons = Array.from(document.querySelectorAll(".touch-button"));

const CELL_COUNT = 20;
const TICK_MS = 120;
const ENEMY_STEP_EVERY = 3;
const BEST_SCORE_KEY = "jvurglar-lgtm-snake-best-score";
const CENTER = Math.floor(CELL_COUNT / 2);

const gameState = {
  timer: null,
  enemyTimer: 0,
  status: "ready",
  direction: { x: 1, y: 0 },
  queuedDirection: null,
  snake: [],
  food: { x: 0, y: 0 },
  enemy: { x: 0, y: 0 },
  score: 0,
  bestScore: Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10) || 0,
  message: "Start를 눌러 게임을 시작하세요.",
};

const context = canvas?.getContext("2d");

function setStatus(value, message) {
  gameState.status = value;
  if (gameStatus) {
    gameStatus.textContent = message;
  }
}

function updateScoreBoard() {
  if (scoreValue) {
    scoreValue.textContent = String(gameState.score);
  }
  if (bestScoreValue) {
    bestScoreValue.textContent = String(gameState.bestScore);
  }
}

function resizeCanvas() {
  if (!canvas || !context) return;
  const size = canvas.clientWidth || 480;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
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

function resetGame() {
  gameState.direction = { x: 1, y: 0 };
  gameState.queuedDirection = null;
  gameState.snake = [
    { x: CENTER - 1, y: CENTER },
    { x: CENTER - 2, y: CENTER },
    { x: CENTER - 3, y: CENTER },
  ];
  gameState.food = createRandomCell(gameState.snake);
  gameState.enemy = createRandomCell([...gameState.snake, gameState.food]);
  gameState.score = 0;
  gameState.enemyTimer = 0;
  gameState.message = "게임 시작 대기 중";
  updateScoreBoard();
  setStatus("ready", "Ready");
  render();
}

function startLoop() {
  if (gameState.timer) {
    return;
  }
  gameState.timer = window.setInterval(tick, TICK_MS);
}

function stopLoop() {
  if (gameState.timer) {
    window.clearInterval(gameState.timer);
    gameState.timer = null;
  }
}

function startGame() {
  if (gameState.status === "gameover") {
    resetGame();
  }
  if (gameState.status === "ready") {
    setStatus("playing", "Playing");
    gameState.message = "게임 진행 중";
    startLoop();
    render();
  } else if (gameState.status === "paused") {
    setStatus("playing", "Playing");
    gameState.message = "게임 재개";
    startLoop();
    render();
  }
}

function pauseGame() {
  if (gameState.status === "playing") {
    stopLoop();
    setStatus("paused", "Paused");
    gameState.message = "일시정지";
    render();
  }
}

function gameOver(reason) {
  stopLoop();
  setStatus("gameover", `Game Over (${reason})`);
  gameState.message = reason;
  render();
}

function isOppositeDirection(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function queueDirection(nextDirection) {
  if (isOppositeDirection(gameState.direction, nextDirection)) {
    return;
  }

  if (gameState.queuedDirection && isOppositeDirection(gameState.queuedDirection, nextDirection)) {
    return;
  }

  gameState.queuedDirection = nextDirection;
  if (gameState.status === "ready") {
    startGame();
  }
}

function maybeApplyQueuedDirection() {
  if (!gameState.queuedDirection) {
    return;
  }
  if (isOppositeDirection(gameState.direction, gameState.queuedDirection)) {
    gameState.queuedDirection = null;
    return;
  }
  gameState.direction = gameState.queuedDirection;
  gameState.queuedDirection = null;
}

function moveEnemy() {
  const directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];
  const shuffled = directions.sort(() => Math.random() - 0.5);
  const snakeCells = gameState.snake;

  for (const delta of shuffled) {
    const next = {
      x: (gameState.enemy.x + delta.x + CELL_COUNT) % CELL_COUNT,
      y: (gameState.enemy.y + delta.y + CELL_COUNT) % CELL_COUNT,
    };
    if (
      !snakeCells.some((segment) => segment.x === next.x && segment.y === next.y) &&
      !(next.x === gameState.food.x && next.y === gameState.food.y)
    ) {
      gameState.enemy = next;
      return;
    }
  }
}

function tick() {
  maybeApplyQueuedDirection();

  const head = gameState.snake[0];
  const nextHead = {
    x: head.x + gameState.direction.x,
    y: head.y + gameState.direction.y,
  };

  if (nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= CELL_COUNT || nextHead.y >= CELL_COUNT) {
    gameOver("벽에 충돌");
    return;
  }

  if (gameState.snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
    gameOver("자기 몸과 충돌");
    return;
  }

  if (gameState.enemy.x === nextHead.x && gameState.enemy.y === nextHead.y) {
    gameOver("적과 충돌");
    return;
  }

  gameState.snake.unshift(nextHead);

  const ateFood = nextHead.x === gameState.food.x && nextHead.y === gameState.food.y;
  if (ateFood) {
    gameState.score += 1;
    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
      localStorage.setItem(BEST_SCORE_KEY, String(gameState.bestScore));
    }
    gameState.food = createRandomCell([...gameState.snake, gameState.enemy]);
    gameState.message = "먹이를 먹었습니다";
  } else {
    gameState.snake.pop();
  }

  gameState.enemyTimer += 1;
  if (gameState.enemyTimer % ENEMY_STEP_EVERY === 0) {
    moveEnemy();
    if (gameState.enemy.x === nextHead.x && gameState.enemy.y === nextHead.y) {
      gameOver("적과 충돌");
      return;
    }
  }

  updateScoreBoard();
  setStatus("playing", "Playing");
  render();
}

function drawCell(x, y, color, inset = 0) {
  if (!context) return;
  const cellSize = canvas.clientWidth / CELL_COUNT;
  const padding = cellSize * inset;
  context.fillStyle = color;
  context.fillRect(x * cellSize + padding, y * cellSize + padding, cellSize - padding * 2, cellSize - padding * 2);
}

function renderGrid() {
  if (!context) return;
  const cellSize = canvas.clientWidth / CELL_COUNT;
  context.strokeStyle = "rgba(123, 255, 172, 0.08)";
  context.lineWidth = 1;

  for (let i = 0; i <= CELL_COUNT; i += 1) {
    context.beginPath();
    context.moveTo(i * cellSize, 0);
    context.lineTo(i * cellSize, canvas.clientHeight);
    context.stroke();

    context.beginPath();
    context.moveTo(0, i * cellSize);
    context.lineTo(canvas.clientWidth, i * cellSize);
    context.stroke();
  }
}

function render() {
  if (!context || !canvas) return;

  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  context.fillStyle = "#03130c";
  context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  renderGrid();

  const scale = cssWidth / CELL_COUNT;
  gameState.food && drawCell(gameState.food.x, gameState.food.y, "#ffd166", 0.2);
  gameState.enemy && drawCell(gameState.enemy.x, gameState.enemy.y, "#ff6b6b", 0.15);

  gameState.snake.forEach((segment, index) => {
    const color = index === 0 ? "#7bffac" : "rgba(123, 255, 172, 0.82)";
    drawCell(segment.x, segment.y, color, index === 0 ? 0.12 : 0.18);
  });

  context.fillStyle = "rgba(231, 247, 239, 0.88)";
  context.font = `600 ${Math.max(14, scale * 0.55)}px Inter, sans-serif`;
  context.textAlign = "left";
  context.fillText(gameState.message, 16, 28);

  if (gameState.status !== "playing") {
    context.fillStyle = "rgba(3, 18, 12, 0.55)";
    context.fillRect(0, canvas.clientHeight / 2 - 36, canvas.clientWidth, 72);
    context.fillStyle = "#e7f7ef";
    context.textAlign = "center";
    context.font = `700 ${Math.max(18, scale * 0.8)}px Inter, sans-serif`;
    const overlayText =
      gameState.status === "gameover"
        ? "Game Over"
        : gameState.status === "paused"
          ? "Paused"
          : "Ready";
    context.fillText(overlayText, canvas.clientWidth / 2, canvas.clientHeight / 2 + 8);
  }
}

function handleDirectionKey(key) {
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
    if (gameState.status === "playing") {
      pauseGame();
    } else if (gameState.status === "paused" || gameState.status === "ready") {
      startGame();
    }
    return;
  }

  if (key === "r" || key === "R") {
    restartGame();
    return;
  }

  const direction = directions[key];
  if (direction) {
    queueDirection(direction);
  }
}

function restartGame() {
  stopLoop();
  resetGame();
  startGame();
}

document.addEventListener("keydown", (event) => {
  handleDirectionKey(event.key);
});

startButton?.addEventListener("click", startGame);
pauseButton?.addEventListener("click", pauseGame);
restartButton?.addEventListener("click", restartGame);

touchButtons.forEach((button) => {
  button.addEventListener("click", () => {
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
      if (gameState.status === "playing") {
        pauseGame();
      } else {
        startGame();
      }
    }
  });
});

window.addEventListener("resize", resizeCanvas);

resetGame();
resizeCanvas();
