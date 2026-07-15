const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_MS = 500;
const BEST_SCORE_KEY = "jvurglar-lgtm-tetris-best-score";

const PIECES = [
  { name: "I", color: "#2ec5ff", matrix: [[1, 1, 1, 1]] },
  { name: "O", color: "#f7c948", matrix: [[1, 1], [1, 1]] },
  { name: "T", color: "#b28dff", matrix: [[0, 1, 0], [1, 1, 1]] },
  { name: "L", color: "#ff9f43", matrix: [[0, 0, 1], [1, 1, 1]] },
  { name: "J", color: "#4dd0e1", matrix: [[1, 0, 0], [1, 1, 1]] },
  { name: "S", color: "#7bd88f", matrix: [[0, 1, 1], [1, 1, 0]] },
  { name: "Z", color: "#ff6b6b", matrix: [[1, 1, 0], [0, 1, 1]] },
];

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function clonePiece(piece) {
  return {
    name: piece.name,
    color: piece.color,
    matrix: cloneMatrix(piece.matrix),
  };
}

function randomPiece() {
  const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
  return clonePiece(piece);
}

export function rotateMatrix(matrix) {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;
  const rotated = Array.from({ length: width }, () => Array(height).fill(0));

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      rotated[x][height - 1 - y] = matrix[y][x];
    }
  }

  return rotated;
}

export function clearCompletedLines(board) {
  const width = board[0]?.length ?? BOARD_WIDTH;
  const survivingRows = board.filter((row) => row.some((cell) => cell === null));
  const clearedCount = board.length - survivingRows.length;
  const emptyRows = Array.from({ length: clearedCount }, () => Array(width).fill(null));

  return [...emptyRows, ...survivingRows.map((row) => row.slice())];
}

export function createTetrisGame({
  root,
  canvas,
  scoreValue,
  bestScoreValue,
  statusValue,
  startButton,
  pauseButton,
  restartButton,
  onActivate = () => {},
} = {}) {
  const context = canvas?.getContext("2d") ?? null;
  const state = {
    timer: null,
    status: "ready",
    board: createBoard(),
    piece: null,
    position: { x: 0, y: 0 },
    score: 0,
    bestScore: Number.parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10) || 0,
    message: "게임 시작 대기 중",
  };

  function activate() {
    onActivate();
  }

  function updateHud() {
    if (scoreValue) {
      scoreValue.textContent = String(state.score);
    }
    if (bestScoreValue) {
      bestScoreValue.textContent = String(state.bestScore);
    }
    if (statusValue) {
      statusValue.textContent =
        state.status === "playing"
          ? "Playing"
          : state.status === "paused"
            ? "Paused"
            : state.status === "gameover"
              ? "Game Over"
              : "Ready";
    }
  }

  function setStatus(status, message) {
    state.status = status;
    if (message) {
      state.message = message;
    }
    updateHud();
  }

  function resizeCanvas() {
    if (!canvas || !context) {
      return;
    }
    const size = canvas.clientWidth || 320;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function isValidPosition(piece = state.piece, position = state.position, matrix = piece?.matrix) {
    if (!piece || !matrix) {
      return false;
    }

    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) {
          continue;
        }

        const boardX = position.x + x;
        const boardY = position.y + y;

        if (boardX < 0 || boardX >= BOARD_WIDTH || boardY < 0 || boardY >= BOARD_HEIGHT) {
          return false;
        }

        if (state.board[boardY][boardX]) {
          return false;
        }
      }
    }

    return true;
  }

  function mergePiece() {
    if (!state.piece) {
      return;
    }

    const { matrix, color } = state.piece;

    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) {
          continue;
        }

        const boardX = state.position.x + x;
        const boardY = state.position.y + y;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          state.board[boardY][boardX] = color;
        }
      }
    }
  }

  function spawnPiece() {
    state.piece = randomPiece();
    state.position = {
      x: Math.floor((BOARD_WIDTH - state.piece.matrix[0].length) / 2),
      y: 0,
    };

    if (!isValidPosition()) {
      gameOver("블록이 더 들어갈 수 없어요");
      return false;
    }

    return true;
  }

  function clearLinesAndScore() {
    const clearedLines = state.board.filter((row) => row.every(Boolean)).length;
    state.board = clearCompletedLines(state.board);

    if (clearedLines > 0) {
      state.score += clearedLines * 100;
      if (state.score > state.bestScore) {
        state.bestScore = state.score;
        localStorage.setItem(BEST_SCORE_KEY, String(state.bestScore));
      }
      state.message = `${clearedLines}줄 정리!`;
    }
  }

  function gameOver(reason) {
    stopLoop();
    setStatus("gameover", reason);
    updateHud();
    render();
  }

  function lockPiece() {
    mergePiece();
    clearLinesAndScore();
    if (!spawnPiece()) {
      return;
    }
    updateHud();
  }

  function movePiece(deltaX, deltaY) {
    if (!state.piece) {
      return false;
    }

    const nextPosition = {
      x: state.position.x + deltaX,
      y: state.position.y + deltaY,
    };

    if (isValidPosition(state.piece, nextPosition)) {
      state.position = nextPosition;
      return true;
    }

    if (deltaY === 1) {
      lockPiece();
    }

    return false;
  }

  function rotatePiece() {
    if (!state.piece) {
      return false;
    }

    const rotated = rotateMatrix(state.piece.matrix);
    const kicks = [0, -1, 1, -2, 2];

    for (const kick of kicks) {
      const nextPosition = {
        x: state.position.x + kick,
        y: state.position.y,
      };

      if (isValidPosition(state.piece, nextPosition, rotated)) {
        state.piece.matrix = rotated;
        state.position = nextPosition;
        return true;
      }
    }

    return false;
  }

  function hardDrop() {
    if (!state.piece) {
      return;
    }

    let distance = 0;
    while (isValidPosition(state.piece, { x: state.position.x, y: state.position.y + 1 })) {
      state.position.y += 1;
      distance += 1;
    }

    state.score += distance * 2;
    lockPiece();
    updateHud();
    render();
  }

  function startLoop() {
    if (state.timer) {
      return;
    }
    state.timer = window.setInterval(tick, TICK_MS);
  }

  function stopLoop() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function resetGame() {
    stopLoop();
    state.board = createBoard();
    state.piece = null;
    state.position = { x: 0, y: 0 };
    state.score = 0;
    state.message = "게임 시작 대기 중";
    setStatus("ready", "Ready");
    spawnPiece();
    updateHud();
    render();
  }

  function startGame() {
    activate();

    if (state.status === "gameover") {
      resetGame();
    }

    if (state.status === "ready" || state.status === "paused") {
      setStatus("playing", "Playing");
      state.message = "게임 진행 중";
      startLoop();
      updateHud();
      render();
    }
  }

  function pauseGame() {
    activate();

    if (state.status === "playing") {
      stopLoop();
      setStatus("paused", "Paused");
      state.message = "일시정지";
      updateHud();
      render();
    }
  }

  function restartGame() {
    activate();
    resetGame();
    startGame();
  }

  function tick() {
    if (state.status !== "playing") {
      return;
    }

    if (movePiece(0, 1)) {
      state.message = "게임 진행 중";
      updateHud();
      render();
      return;
    }

    render();
  }

  function drawBlock(x, y, size, color, inset = 0.08) {
    if (!context) {
      return;
    }

    const padding = size * inset;
    const width = size - padding * 2;
    const height = size - padding * 2;

    context.fillStyle = color;
    context.fillRect(x + padding, y + padding, width, height);
  }

  function renderGrid(size) {
    if (!context) {
      return;
    }

    context.strokeStyle = "rgba(24, 119, 242, 0.08)";
    context.lineWidth = 1;

    for (let i = 0; i <= BOARD_WIDTH; i += 1) {
      context.beginPath();
      context.moveTo(i * size, 0);
      context.lineTo(i * size, canvas.clientHeight);
      context.stroke();
    }

    for (let i = 0; i <= BOARD_HEIGHT; i += 1) {
      context.beginPath();
      context.moveTo(0, i * size);
      context.lineTo(canvas.clientWidth, i * size);
      context.stroke();
    }
  }

  function render() {
    if (!canvas || !context) {
      return;
    }

    const size = canvas.clientWidth / BOARD_WIDTH;
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    context.fillStyle = "#eef3f9";
    context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    renderGrid(size);

    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const color = state.board[y][x];
        if (color) {
          drawBlock(x * size, y * size, size, color, 0.12);
        }
      }
    }

    if (state.piece) {
      for (let y = 0; y < state.piece.matrix.length; y += 1) {
        for (let x = 0; x < state.piece.matrix[y].length; x += 1) {
          if (!state.piece.matrix[y][x]) {
            continue;
          }
          drawBlock(
            (state.position.x + x) * size,
            (state.position.y + y) * size,
            size,
            state.piece.color,
            0.1,
          );
        }
      }
    }

    context.fillStyle = "#1c1e21";
    context.font = `600 ${Math.max(14, size * 0.5)}px "SF Pro Text", "Segoe UI", sans-serif`;
    context.textAlign = "left";
    context.fillText(state.message, 16, 28);

    if (state.status !== "playing") {
      context.fillStyle = "rgba(255, 255, 255, 0.55)";
      context.fillRect(0, canvas.clientHeight / 2 - 38, canvas.clientWidth, 76);
      context.fillStyle = "#1c1e21";
      context.textAlign = "center";
      context.font = `700 ${Math.max(18, size * 0.8)}px "SF Pro Display", "Segoe UI", sans-serif`;
      const overlay =
        state.status === "gameover"
          ? "Game Over"
          : state.status === "paused"
            ? "Paused"
            : "Ready";
      context.fillText(overlay, canvas.clientWidth / 2, canvas.clientHeight / 2 + 8);
    }
  }

  function handleKeyDown(key) {
    const movementKeys = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowDown",
      "ArrowUp",
      "a",
      "A",
      "d",
      "D",
      "s",
      "S",
      "w",
      "W",
      " ",
    ]);

    if (
      key === "p" ||
      key === "P" ||
      key === "r" ||
      key === "R" ||
      movementKeys.has(key)
    ) {
      activate();
    }

    if (key === "p" || key === "P") {
      if (state.status === "playing") {
        pauseGame();
      } else {
        startGame();
      }
      return true;
    }

    if (key === "r" || key === "R") {
      restartGame();
      return true;
    }

    if (state.status !== "playing") {
      if (movementKeys.has(key)) {
        startGame();
      } else {
        return false;
      }
    }

    if (key === "ArrowLeft" || key === "a" || key === "A") {
      return movePiece(-1, 0);
    }

    if (key === "ArrowRight" || key === "d" || key === "D") {
      return movePiece(1, 0);
    }

    if (key === "ArrowDown" || key === "s" || key === "S") {
      return movePiece(0, 1);
    }

    if (key === "ArrowUp" || key === "w" || key === "W") {
      return rotatePiece();
    }

    if (key === " ") {
      hardDrop();
      return true;
    }

    return false;
  }

  function bindControls() {
    if (canvas) {
      canvas.addEventListener("pointerdown", activate);
    }

    root?.querySelectorAll("[data-tetris-control]").forEach((button) => {
      button.addEventListener("click", () => {
        activate();

        const action = button.dataset.tetrisControl;
        if (action === "start") {
          startGame();
        } else if (action === "pause") {
          pauseGame();
        } else if (action === "restart") {
          restartGame();
        } else if (action === "left") {
          movePiece(-1, 0);
          render();
        } else if (action === "right") {
          movePiece(1, 0);
          render();
        } else if (action === "down") {
          movePiece(0, 1);
          render();
        } else if (action === "rotate") {
          rotatePiece();
          render();
        } else if (action === "drop") {
          hardDrop();
        }
      });
    });

  }

  bindControls();
  window.addEventListener("resize", resizeCanvas);

  resetGame();
  resizeCanvas();

  return {
    handleKeyDown,
    start: startGame,
    pause: pauseGame,
    restart: restartGame,
    setActive: activate,
    render,
  };
}
