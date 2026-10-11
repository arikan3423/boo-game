

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Images
const ghost = new Image();
ghost.src = "assets/hayalet.png";

const tree = new Image();
tree.src = "assets/ağaç.png";


const desktopBackground = new Image();
desktopBackground.src = "assets/arkaplan2.jpg";

const mobileBackground = new Image();
mobileBackground.src = "assets/arkaplan3.jpg";


// Game settings
let gameWidth = 960;
let gameHeight = 540;

let score = 0;
let highScore = Number(
  localStorage.getItem("booHighScore")
) || 0;


let gameSpeed = 4;
let obstacleGap = 205;

let gameOver = false;
let gameStarted = false;
let frameCount = 0;

// Ghost settings
const player = {
  x: 200,
  y: 250,
  width: 65,
  height: 65,
  velocity: 0,
  gravity: 0.35,
  jumpForce: -6
};

// Obstacles
let obstacles = [];

function resizeGame() {
  const isMobile = window.innerWidth <= 650;

  gameWidth = isMobile ? 420 : 960;
  gameHeight = isMobile ? 560 : 540;

  canvas.width = gameWidth;
  canvas.height = gameHeight;

  player.x = gameWidth * 0.25;
}


function drawBackground() {
    const isMobile = gameWidth <= 420;

    const currentBackground = isMobile
        ? mobileBackground
        : desktopBackground;

    if (
        currentBackground.complete &&
        currentBackground.naturalWidth > 0
    ) {
        const imageWidth = currentBackground.naturalWidth;
        const imageHeight = currentBackground.naturalHeight;

        const scale = Math.max(
            gameWidth / imageWidth,
            gameHeight / imageHeight
        );

        const width = imageWidth * scale;
        const height = imageHeight * scale;

        const x = (gameWidth - width) / 2;
        const y = (gameHeight - height) / 2;

        ctx.drawImage(
            currentBackground,
            x,
            y,
            width,
            height
        );
    }
}


function drawGhost() {
  if (ghost.complete && ghost.naturalWidth) {
    ctx.drawImage(
      ghost,
      player.x,
      player.y,
      player.width,
      player.height
    );
  }
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    if (!tree.complete || !tree.naturalWidth) return;

    // Upper tree
    ctx.save();
    ctx.translate(
      obstacle.x + obstacle.width,
      obstacle.topHeight
    );
    ctx.rotate(Math.PI);

    ctx.drawImage(
      tree,
      0,
      0,
      obstacle.width,
      obstacle.topHeight
    );
    ctx.restore();

    // Lower tree
    ctx.drawImage(
      tree,
      obstacle.x,
      obstacle.bottomY,
      obstacle.width,
      gameHeight - obstacle.bottomY
    );
  });
}

function createObstacle() {
  const margin = 40;
  const minCenter = obstacleGap / 2 + margin;
  const maxCenter =
    gameHeight - obstacleGap / 2 - margin;

  const center =
    minCenter + Math.random() * (maxCenter - minCenter);

  obstacles.push({
    x: gameWidth,
    width: 110,
    topHeight: center - obstacleGap / 2,
    bottomY: center + obstacleGap / 2,
    passed: false
  });
}


function updateDifficulty() {
    gameSpeed = Math.min(
        9,
        4 + score * 0.15
    );

    obstacleGap = Math.max(
        145,
        205 - score * 2
    );
}


function checkCollision(obstacle) {
  const padding = 12;

  const left = player.x + padding;
  const right = player.x + player.width - padding;
  const top = player.y + padding;
  const bottom = player.y + player.height - padding;

  const overlapsX =
    right > obstacle.x &&
    left < obstacle.x + obstacle.width;

  const hitsTree =
    top < obstacle.topHeight ||
    bottom > obstacle.bottomY;

  return overlapsX && hitsTree;
}

function updateGame() {
  if (!gameStarted || gameOver) return;

  frameCount++;

  player.velocity += player.gravity;
  player.velocity = Math.min(player.velocity, 8);
  player.y += player.velocity;


const obstacleInterval = Math.max(
    75,
    115 - Math.floor(score / 5) * 5
);

if (frameCount % obstacleInterval === 0) {
    createObstacle();
}


  obstacles.forEach((obstacle) => {
    obstacle.x -= gameSpeed;

    if (checkCollision(obstacle)) {
      endGame();
    }

    if (
      !obstacle.passed &&
      obstacle.x + obstacle.width < player.x
    ) {
      obstacle.passed = true;
      score++;
      updateDifficulty();
    }
  });

  obstacles = obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > 0
  );

  if (
    player.y < 0 ||
    player.y + player.height > gameHeight
  ) {
    endGame();
  }
}

function drawScore() {
  ctx.fillStyle = "#FFE0B2";
  ctx.font = "bold 25px Georgia";
  ctx.textAlign = "left";

  ctx.fillText(`SCORE: ${score}`, 20, 40);
  ctx.fillText(`BEST: ${highScore}`, 20, 75);
}

function drawMessage(title, subtitle) {
  ctx.fillStyle = "rgba(20, 12, 30, 0.85)";
  ctx.fillRect(
    gameWidth / 2 - 180,
    gameHeight / 2 - 80,
    360,
    160
  );

  ctx.fillStyle = "#FFE0B2";
  ctx.textAlign = "center";
  ctx.font = "bold 32px Georgia";
  ctx.fillText(title, gameWidth / 2, gameHeight / 2 - 15);

  ctx.font = "18px Georgia";
  ctx.fillText(
    subtitle,
    gameWidth / 2,
    gameHeight / 2 + 30
  );
}

function endGame() {
  if (gameOver) return;

  gameOver = true;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("booHighScore", highScore);
  }
}

function restartGame() {
  score = 0;
  gameSpeed = 2.5;
  obstacleGap = 250;
  frameCount = 0;

  obstacles = [];
  player.y = gameHeight / 2;
  player.velocity = 0;

  gameOver = false;
  gameStarted = true;
}

function jump() {
  if (!gameStarted || gameOver) {
    restartGame();
  }

  player.velocity = player.jumpForce;
}

function gameLoop() {
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  drawBackground();
  updateGame();
  drawObstacles();
  drawGhost();
  drawScore();

  if (!gameStarted) {
    drawMessage("BOO!", "Press SPACE to start");
  } else if (gameOver) {
    drawMessage("GAME OVER", "Press SPACE to retry");
  }

  requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();

    if (!event.repeat) {
      jump();
    }
  }
});

// Mobile and mouse controls
canvas.addEventListener("pointerdown", jump);

// Responsive canvas
window.addEventListener("resize", () => {
  resizeGame();
  restartGame();
});

resizeGame();
gameLoop();
