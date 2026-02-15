const area = document.getElementById("game-area");
const playerEl = document.getElementById("player");
const catchButton = document.getElementById("catch-button");
const restartButton = document.getElementById("restart-button");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const levelEl = document.getElementById("level");
const timeEl = document.getElementById("time");

const bugIcons = ["🐝", "🦋", "🐞", "🪲", "🦗"];
const keyState = {};

const state = {
  player: { x: 50, y: 70, speed: 0.24 },
  bugs: [],
  score: 0,
  highScore: Number(localStorage.getItem("bugHunterBest") || 0),
  level: 1,
  time: 60,
  running: true,
  lastFrame: 0,
  spawnTicker: 0,
};

highScoreEl.textContent = state.highScore;

function spawnBug() {
  if (state.bugs.length >= 12) return;

  const bug = {
    id: crypto.randomUUID(),
    x: 6 + Math.random() * 88,
    y: 8 + Math.random() * 84,
    dx: (Math.random() * 2 - 1) * (0.02 + state.level * 0.002),
    dy: (Math.random() * 2 - 1) * (0.02 + state.level * 0.002),
    icon: bugIcons[Math.floor(Math.random() * bugIcons.length)],
    points: 8 + Math.floor(Math.random() * 8),
  };

  const el = document.createElement("div");
  el.className = "bug";
  el.dataset.id = bug.id;
  el.textContent = bug.icon;
  area.appendChild(el);
  bug.el = el;

  state.bugs.push(bug);
  drawEntity(bug.el, bug.x, bug.y);
}

function drawEntity(el, x, y) {
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
}

function updatePlayer(delta) {
  const speed = state.player.speed * delta;
  if (keyState.ArrowUp || keyState.w) state.player.y -= speed;
  if (keyState.ArrowDown || keyState.s) state.player.y += speed;
  if (keyState.ArrowLeft || keyState.a) state.player.x -= speed;
  if (keyState.ArrowRight || keyState.d) state.player.x += speed;

  state.player.x = Math.max(4, Math.min(96, state.player.x));
  state.player.y = Math.max(6, Math.min(94, state.player.y));

  drawEntity(playerEl, state.player.x, state.player.y);
}

function updateBugs(delta) {
  for (const bug of state.bugs) {
    bug.x += bug.dx * delta;
    bug.y += bug.dy * delta;

    if (bug.x < 3 || bug.x > 97) bug.dx *= -1;
    if (bug.y < 4 || bug.y > 96) bug.dy *= -1;

    drawEntity(bug.el, bug.x, bug.y);
  }
}

function tryCatch() {
  if (!state.running) return;

  playerEl.classList.remove("swing");
  void playerEl.offsetWidth;
  playerEl.classList.add("swing");

  const catchRange = 10;
  let caught = 0;

  state.bugs = state.bugs.filter((bug) => {
    const distance = Math.hypot(bug.x - state.player.x, bug.y - state.player.y);
    if (distance <= catchRange) {
      caught += bug.points;
      bug.el.classList.add("caught");
      setTimeout(() => bug.el.remove(), 250);
      return false;
    }
    return true;
  });

  if (caught > 0) {
    state.score += caught;
    state.level = 1 + Math.floor(state.score / 100);
  }

  refreshHud();
}

function refreshHud() {
  scoreEl.textContent = state.score;
  levelEl.textContent = state.level;
  timeEl.textContent = Math.max(0, Math.ceil(state.time));
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem("bugHunterBest", String(state.highScore));
    highScoreEl.textContent = state.highScore;
  }
}

function endGame() {
  state.running = false;
  timeEl.textContent = "0";
  catchButton.disabled = true;
  catchButton.textContent = "おしまい";
}

function resetGame() {
  for (const bug of state.bugs) bug.el.remove();
  state.bugs = [];
  state.score = 0;
  state.level = 1;
  state.time = 60;
  state.running = true;
  state.player.x = 50;
  state.player.y = 70;
  catchButton.disabled = false;
  catchButton.textContent = "とる！";
  refreshHud();
}

function gameLoop(timestamp) {
  if (!state.lastFrame) state.lastFrame = timestamp;
  const delta = Math.min(40, timestamp - state.lastFrame);
  state.lastFrame = timestamp;

  if (state.running) {
    state.time -= delta / 1000;
    if (state.time <= 0) {
      endGame();
    }

    updatePlayer(delta);
    updateBugs(delta);

    state.spawnTicker += delta;
    const spawnInterval = Math.max(230, 950 - state.level * 75);
    if (state.spawnTicker >= spawnInterval) {
      spawnBug();
      state.spawnTicker = 0;
    }

    refreshHud();
  }

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    tryCatch();
    return;
  }
  keyState[event.key] = true;
});

window.addEventListener("keyup", (event) => {
  keyState[event.key] = false;
});

catchButton.addEventListener("click", tryCatch);
restartButton.addEventListener("click", resetGame);

resetGame();
spawnBug();
spawnBug();
requestAnimationFrame(gameLoop);
