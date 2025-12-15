const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let gameState = "menu"; // menu | playing | paused | gameover
let score = 0;
let lives = 3;
let level = 1;

const assets = {};
const assetList = {
  ship: "assets/sprites/ship.png",
  invader: "assets/sprites/invader.png",
  bullet: "assets/sprites/bullet.png",
  boss: "assets/sprites/boss.png",
  bg: "assets/sprites/bg.png"
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

const sfx = {
  shoot: new Audio("assets/sfx/shoot.wav"),
  explode: new Audio("assets/sfx/explode.wav"),
  power: new Audio("assets/sfx/powerup.wav"),
  bg: new Audio("assets/music/bg_loop.mp3")
};

sfx.bg.loop = true;
sfx.bg.volume = 0.3;

const ship = {
  x: canvas.width / 2 - 24,
  y: canvas.height - 60,
  w: 48,
  h: 48,
  speed: 6
};

function drawShip() {
  ctx.drawImage(assets.ship, ship.x, ship.y, ship.w, ship.h);
}

const bullets = [];

function shoot() {
  bullets.push({ x: ship.x + 22, y: ship.y, vy: -7 });
  sfx.shoot.currentTime = 0;
  sfx.shoot.play();
}

function updateBullets() {
  bullets.forEach((b, i) => {
    b.y += b.vy;
    ctx.drawImage(assets.bullet, b.x, b.y, 4, 12);
    if (b.y < 0) bullets.splice(i, 1);
  });
}

let invaders = [];

function spawnInvaders() {
  invaders = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      invaders.push({
        x: 40 + c * 48,
        y: 40 + r * 40,
        alive: true
      });
    }
  }
}

function drawInvaders() {
  invaders.forEach(i => {
    if (i.alive)
      ctx.drawImage(assets.invader, i.x, i.y, 36, 28);
  });
}

function hit(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

const particles = [];

function explode(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 30
    });
  }
}

function updateParticles() {
  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.fillStyle = "#ffd";
    ctx.fillRect(p.x, p.y, 2, 2);
    if (p.life <= 0) particles.splice(i, 1);
  });
}

function drawUI() {
  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, canvas.width - 80, 20);
}

function drawMenu() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "24px monospace";
  ctx.fillText("PIRATES", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "14px monospace";
  ctx.fillText("Press SPACE", canvas.width / 2, canvas.height / 2 + 20);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "menu") drawMenu();
  if (gameState === "playing") {
    drawShip();
    drawInvaders();
    updateBullets();
    updateParticles();
    drawUI();
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
  spawnInvaders();
  sfx.bg.play();
  gameState = "menu";
  gameLoop();
}

loadAssets(startGame);
