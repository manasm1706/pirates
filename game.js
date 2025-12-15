/* =========================
   CANVAS SETUP
========================= */
const canvas = document.getElementById("gameCanvas");

if (!canvas) {
  throw new Error("Canvas not found. ID mismatch.");
}

const ctx = canvas.getContext("2d");


/* =========================
   GAME STATE
========================= */
let gameState = "menu"; // menu | playing | paused | gameover
let score = 0;
let lives = 3;
let level = 1;

/* =========================
   ASSETS (MATCH YOUR FILES)
========================= */
const assets = {};
const assetList = {
  ship: "assets/sprites/ship.png",
  invader: "assets/sprites/enemy_1.png",
  bullet: "assets/sprites/bullet.png",
  boss: "assets/sprites/boss.png"
};

let loaded = 0;
function loadAssets(start) {
  const total = Object.keys(assetList).length;
  for (const key in assetList) {
    const img = new Image();
    img.src = assetList[key];
    img.onload = () => {
      loaded++;
      if (loaded === total) start();
    };
    assets[key] = img;
  }
}

/* =========================
   SOUND (MATCH YOUR FILES)
========================= */
const sfx = {
  shoot: new Audio("assets/sfx/shoot.mp3"),
  explode: new Audio("assets/sfx/explosion.ogg"),
  impact: new Audio("assets/sfx/impact.mp3"),
  power: new Audio("assets/sfx/powerup.mp3"),
  bg: new Audio("assets/music/bg_loop.mp3")
};

sfx.bg.loop = true;
sfx.bg.volume = 0.3;

/* =========================
   PLAYER
========================= */
const ship = {
  x: canvas.width / 2 - 24,
  y: canvas.height - 60,
  w: 48,
  h: 48,
  speed: 6
};

/* =========================
   INPUT
========================= */
const keys = {};
document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (gameState === "menu" && e.key === " ") {
    gameState = "playing";
    sfx.bg.play();
  }

  if (e.key === "p") {
    gameState = gameState === "playing" ? "paused" : "playing";
  }
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

/* =========================
   SCREEN SHAKE
========================= */
let shake = 0;
function screenShake(power = 6) {
  shake = power;
}

/* =========================
   BULLETS
========================= */
const bullets = [];
let lastShot = 0;
const cooldown = 280;

function tryShoot() {
  const now = Date.now();
  if (now - lastShot < cooldown) return;
  lastShot = now;

  bullets.push({ x: ship.x + 22, y: ship.y, vy: -7 });
  sfx.shoot.currentTime = 0;
  sfx.shoot.play();
}

/* =========================
   ENEMIES
========================= */
let invaders = [];

function spawnInvaders() {
  invaders = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      invaders.push({
        x: 40 + c * 48,
        y: 40 + r * 40,
        w: 36,
        h: 28,
        alive: true
      });
    }
  }
}

/* =========================
   ENEMY BULLETS
========================= */
const enemyBullets = [];

function invaderFire() {
  const shooters = invaders.filter(i => i.alive);
  if (!shooters.length) return;
  const s = shooters[Math.floor(Math.random() * shooters.length)];
  enemyBullets.push({ x: s.x + 14, y: s.y + 20, vy: 3 });
}

setInterval(() => {
  if (gameState === "playing") invaderFire();
}, 1200);

/* =========================
   POWERUPS
========================= */
const powerups = [];
let multishot = false;
let multiEnd = 0;

function spawnPower(x, y) {
  if (Math.random() < 0.15) {
    powerups.push({ x, y, type: "multishot" });
  }
}

function applyPower(type) {
  if (type === "multishot") {
    multishot = true;
    multiEnd = Date.now() + 5000;
    sfx.power.play();
  }
}

/* =========================
   PARTICLES
========================= */
const particles = [];

function explode(x, y) {
  for (let i = 0; i < 14; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 35
    });
  }
}

/* =========================
   COLLISION
========================= */
function hit(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/* =========================
   GAME OVER
========================= */
function gameOver() {
  gameState = "gameover";
  const best = Number(localStorage.getItem("pirates_high") || 0);
  if (score > best) localStorage.setItem("pirates_high", score);
}

/* =========================
   LEVELS
========================= */
function nextLevel() {
  level++;
  spawnInvaders();
}

/* =========================
   UI
========================= */
function drawUI() {
  ctx.fillStyle = "#fff";
  ctx.font = "14px monospace";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, canvas.width - 80, 20);
}

function drawMenu() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "26px monospace";
  ctx.fillText("PIRATES", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "14px monospace";
  ctx.fillText("Press SPACE to start", canvas.width / 2, canvas.height / 2 + 10);
}

/* =========================
   GAME LOOP
========================= */
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );
    shake *= 0.9;
  }

  if (gameState === "menu") drawMenu();

  if (gameState === "playing") {
    // movement
    if (keys["ArrowLeft"]) ship.x -= ship.speed;
    if (keys["ArrowRight"]) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    if (keys[" "] && !keys["_shoot"]) {
      tryShoot();
      keys["_shoot"] = true;
    }
    if (!keys[" "]) keys["_shoot"] = false;

    if (multishot && Date.now() > multiEnd) multishot = false;

    // ship
    ctx.drawImage(assets.ship, ship.x, ship.y, ship.w, ship.h);

    // bullets
    bullets.forEach((b, bi) => {
      b.y += b.vy;
      ctx.drawImage(assets.bullet, b.x, b.y, 4, 12);
      if (b.y < 0) bullets.splice(bi, 1);
    });

    // enemies
    invaders.forEach(i => {
      if (i.alive)
        ctx.drawImage(assets.invader, i.x, i.y, i.w, i.h);
    });

    // bullet collisions
    bullets.forEach((b, bi) => {
      invaders.forEach(i => {
        if (i.alive && hit({ ...b, w: 4, h: 12 }, i)) {
          i.alive = false;
          bullets.splice(bi, 1);
          explode(i.x, i.y);
          spawnPower(i.x, i.y);
          screenShake();
          score += 10;
          sfx.explode.play();
        }
      });
    });

    if (invaders.every(i => !i.alive)) nextLevel();

    // particles
    particles.forEach((p, pi) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = "#ffd";
      ctx.fillRect(p.x, p.y, 2, 2);
      if (p.life <= 0) particles.splice(pi, 1);
    });

    drawUI();
  }

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

/* =========================
   START
========================= */
function startGame() {
  spawnInvaders();
  gameLoop();
}

loadAssets(startGame);
