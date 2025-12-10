const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 480;
canvas.height = 500;

let shipX = canvas.width / 2 - 20;
let bullets = [];
let invaders = [];
let movingRight = true;

for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 6; c++) {
    invaders.push({ x: 40 + c * 60, y: 40 + r * 40, alive: true });
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") shipX -= 20;
  if (e.key === "ArrowRight") shipX += 20;
  if (e.key === " ") bullets.push({ x: shipX + 18, y: canvas.height - 70 });
});

function drawShip() {
  ctx.fillStyle = "#6546FF";
  ctx.fillRect(shipX, canvas.height - 50, 40, 40);
}

function drawBullets() {
  ctx.fillStyle = "#FF6196";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, 4, 10);
    b.y -= 6;
  });
}

function drawInvaders() {
  ctx.fillStyle = "#5F45C4";
  invaders.forEach(i => {
    if (i.alive) ctx.fillRect(i.x, i.y, 30, 20);
  });
}

function updateInvaders() {
  const edge = invaders.some(i => i.x > canvas.width - 40 || i.x < 10);
  if (edge) movingRight = !movingRight;

  invaders.forEach(i => {
    i.x += movingRight ? 1 : -1;
  });
}

function collision() {
  bullets.forEach(b => {
    invaders.forEach(i => {
      if (i.alive && b.x >= i.x && b.x <= i.x + 30 && b.y <= i.y + 20 && b.y >= i.y) {
        i.alive = false;
        b.y = -10;
      }
    });
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawShip();
  drawBullets();
  drawInvaders();
  updateInvaders();
  collision();
  requestAnimationFrame(gameLoop);
}

gameLoop();
