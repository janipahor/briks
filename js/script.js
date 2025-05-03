// Canvas setup
const canvas = document.getElementById("canva");
const ctx    = canvas.getContext("2d");

// Images
const spaceshipImg = new Image();
spaceshipImg.src   = "slike/spaceship.png";
const meteorImg    = new Image();
meteorImg.src      = "slike/meteorit.png";

// Audio
const bgMusic    = document.getElementById("bgMusic");
const crashSound = document.getElementById("crashSound");

// HUD & high score
let timerInterval;
let elapsedTime   = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

const scoreValue      = document.getElementById("scoreValue");
const timeValue       = document.getElementById("timeValue");
const highScoreValue  = document.getElementById("highScoreValue");

// Game Over menu
const gameOverMenu = document.getElementById("gameOverMenu");
const endText      = document.getElementById("endText");
const winGif       = document.getElementById("winGif");
const restartBtn   = document.getElementById("restartBtn");

// Controls
const pauseBtn      = document.getElementById("pauseBtn");
const musicBtn      = document.getElementById("musicBtn");
const difficultySel = document.getElementById("difficulty");

// Brick layout
const brickRowCount    = 3;
const brickColumnCount = 6;
const brickWidth       = 60;
const brickHeight      = 35;
const brickPadding     = 27;
const brickOffsetTop   = 30;
const brickOffsetLeft  = 30;
let bricks = [];

// Ball & paddle
const ballRadius = 8;
let x, y, dx, dy;
let paddleHeight = 10;
let paddleWidth  = 100;
let paddleX;

// Game state
let rightPressed = false;
let leftPressed  = false;
let isPaused     = true;
let gameEnded    = false;
let animationId  = null;
let score        = 0;

// Speeds by difficulty
const difficultySpeeds = {
  easy:   { dx: 1.5, dy: 1.5 },
  medium: { dx: 2,   dy: 2   },
  hard:   { dx: 3,   dy: 3   }
};
let speedX = 0, speedY = 0;

// Init bricks
function initBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x:0, y:0, status:1 };
    }
  }
}

// Draw helpers
function drawBricks() {
  for (let c=0; c<brickColumnCount; c++) {
    for (let r=0; r<brickRowCount; r++) {
      if (bricks[c][r].status) {
        const bx = c*(brickWidth+brickPadding) + brickOffsetLeft;
        const by = r*(brickHeight+brickPadding) + brickOffsetTop;
        bricks[c][r].x = bx;
        bricks[c][r].y = by;
        ctx.drawImage(spaceshipImg, bx, by, brickWidth, brickHeight);
      }
    }
  }
}
function drawBall() {
  ctx.drawImage(meteorImg, x-ballRadius, y-ballRadius, ballRadius*2, ballRadius*2);
}
function drawPaddle() {
  ctx.save();
  ctx.beginPath();
  ctx.shadowColor = '#00ccff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#00ccff';
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

// Collision detection
function collisionDetection() {
  for (let c=0; c<brickColumnCount; c++) {
    for (let r=0; r<brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status &&
          x > b.x && x < b.x+brickWidth &&
          y > b.y && y < b.y+brickHeight) {
        dy = -dy;
        b.status = 0;
        scoreValue.textContent = ++score;
        crashSound.currentTime = 0;
        crashSound.play();
        if (score === brickRowCount * brickColumnCount) {
          endGame("You won! 🏆");
        }
      }
    }
  }
}

// Main loop
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  // Bounce off walls
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;
  else if (y + dy > canvas.height - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      dy = -dy;
    } else {
      endGame("GAME OVER 😢");
      return;
    }
  }

  // Paddle movement
  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 4;
  if (leftPressed  && paddleX > 0)                       paddleX -= 4;

  x += dx;
  y += dy;

  if (!isPaused && !gameEnded) {
    animationId = requestAnimationFrame(draw);
  }
}

// Start game on first arrow
function keyDownHandler(e) {
  if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && isPaused && !gameEnded) {
    speedX = difficultySpeeds[difficultySel.value].dx;
    speedY = difficultySpeeds[difficultySel.value].dy;
    dx = e.key === "ArrowLeft"  ?  speedX : -speedX;
    dy = -speedY;
    isPaused = false;
    // start timer
    clearInterval(timerInterval);
    elapsedTime = 0;
    timeValue.textContent = "0s";
    timerInterval = setInterval(() => {
      elapsedTime++;
      timeValue.textContent = elapsedTime + "s";
    }, 1000);
    animationId = requestAnimationFrame(draw);
  }
  if (e.key === "ArrowRight") rightPressed = true;
  if (e.key === "ArrowLeft")  leftPressed  = true;
}
function keyUpHandler(e) {
  if (e.key === "ArrowRight") rightPressed = false;
  if (e.key === "ArrowLeft")  leftPressed  = false;
}

// End game
function endGame(msg) {
  isPaused = true;
  gameEnded = true;
  cancelAnimationFrame(animationId);
  clearInterval(timerInterval);

  // update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  highScoreValue.textContent = highScore;

  endText.textContent = msg;
  winGif.style.display = msg.includes("won") ? "block" : "none";
  gameOverMenu.style.display = "flex";
}

// Reset game
function resetGame() {
  score        = 0;
  elapsedTime  = 0;
  scoreValue.textContent     = 0;
  timeValue.textContent      = "0s";
  gameEnded    = false;
  isPaused     = true;
  clearInterval(timerInterval);
  gameOverMenu.style.display = "none";
  winGif.style.display       = "none";

  paddleX = (canvas.width - paddleWidth)/2;
  x = canvas.width/2;
  y = canvas.height - 30;
  dx = dy = 0;

  initBricks();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  draw();
  cancelAnimationFrame(animationId);
}

// Controls
pauseBtn.addEventListener("click", () => {
  if (!isPaused) {
    isPaused = true;
    cancelAnimationFrame(animationId);
    clearInterval(timerInterval);
  }
});
musicBtn.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(()=>{});
    musicBtn.textContent = "PAUSE MUSIC";
  } else {
    bgMusic.pause();
    musicBtn.textContent = "PLAY MUSIC";
  }
});
restartBtn.addEventListener("click", resetGame);
difficultySel.addEventListener("change", () => {
  // speed updates on next start
});

// Initialization
window.addEventListener("load", () => {
  highScoreValue.textContent = highScore;
  initBricks();
  resetGame();
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup",   keyUpHandler);
});

function createParticles() {
    const content = document.querySelector('.content');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('space-particle');
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = particle.style.width;
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        content.appendChild(particle);
    }
}

window.addEventListener('load', createParticles);
