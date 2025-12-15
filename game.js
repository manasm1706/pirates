/* =========================
   CANVAS SETUP
========================= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/* =========================
   GAME STATE
========================= */
let gameState = "menu"; // menu | playing | paused | gameover
let score = 0;
let lives = 3;
let level = 1;
let hasStarted = false;

/* =========================
   ASSETS
========================= */
const assets = {};
const assetList = {
  ship: "assets/sprites/ship.png",
  invader: "assets/sprites/enemy_1.png",
  bullet: "assets/sprites/bullet.png",
  boss: "assets/sprites/boss.png"
};

let loaded = 0;
function loadAssets(cb) {
  const total = Object.keys(assetList).length;
  for (const key in assetList) {
    const img = new Image();
    img.src = assetList[key];
    img.onload = () => {
      loaded++;
      if (loaded === total) cb();
    };
    assets[key] = img;
  }
}

/* =========================
   SOUND
========================= */
const sfx = {
  shoot: new Audio("assets/sfx/shoot.mp3"),
  explode: new Audio("assets/sfx/explosion.ogg"),
  power: new Audio("assets/sfx/powerup.mp3"),
  bg: new Audio("assets/music/bg_loop.mp3")
};

sfx.bg.loop = true;
sfx.bg.volume = 0.25;

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

  if (e.key === "p" && gameState === "playing") {
    gameState = "paused";
  } else if (e.key === "p" && gameState === "paused") {
    gameState = "playing";
  }
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

/* =========================
   AUTO START ON CLICK
========================= */
document.addEventListener("click", () => {
  if (!hasStarted) {
    hasStarted = true;
    gameState = "playing";
    sfx.bg.play();
  }
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
const cooldown = 300;

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
      life: 30
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
   UI
========================= */
function drawMenu() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#6546FF";
  ctx.textAlign = "center";
  ctx.font = "32px monospace";
  ctx.fillText("PIRATES", canvas.width / 2, canvas.height / 2 - 40);

  ctx.font = "16px monospace";
  ctx.fillText("CLICK ANYWHERE TO START", canvas.width / 2, canvas.height / 2);
  ctx.fillText("← → MOVE • SPACE SHOOT", canvas.width / 2, canvas.height / 2 + 28);
}

function drawUI() {
  ctx.fillStyle = "#6546FF";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 20);
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

  if (gameState === "menu") {
    drawMenu();
  }

  if (gameState === "playing") {
    // movement
    if (keys["ArrowLeft"]) ship.x -= ship.speed;
    if (keys["ArrowRight"]) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    if (keys[" "]) tryShoot();

    // ship
    ctx.drawImage(assets.ship, ship.x, ship.y, ship.w, ship.h);

    // bullets
    bullets.forEach((b, bi) => {
      b.y += b.vy;
      ctx.drawImage(assets.bullet, b.x, b.y, 4, 12);
      if (b.y < 0) bullets.splice(bi, 1);
    });

    // invaders
    invaders.forEach(i => {
      if (i.alive)
        ctx.drawImage(assets.invader, i.x, i.y, i.w, i.h);
    });

    // collisions
    bullets.forEach((b, bi) => {
      invaders.forEach(i => {
        if (i.alive && hit({ ...b, w: 4, h: 12 }, i)) {
          i.alive = false;
          bullets.splice(bi, 1);
          explode(i.x, i.y);
          screenShake();
          score += 10;
          sfx.explode.play();
        }
      });
    });

    // particles
    particles.forEach((p, pi) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = "#6546FF";
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
