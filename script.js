let circleY = 0;
let circleX = 150;

/**
 * @typedef {Object} Vector2
 * @property {number} x
 * @property {number} y
 *
 * @typedef {Object} Rectangle
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 *
 * @typedef {Object} Player
 * @property {Vector2} position
 * @property {Vector2} size
 * @property {number} life
 *
 * @typedef {Object} Ball
 * @property {Vector2} position
 * @property {Vector2} speed
 * @property {number} radius
 * @property {boolean} active
 *
 * @typedef {Object} Brick
 * @property {Vector2} position
 * @property {boolean} active
 */

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("workspace");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 450;

const PLAYER_LIFES = 5;
const LINES_OF_BRICKS = 3;
const BRICKS_PER_LINE = 20;
const BRICK_MARGIN = 50;

// Manage user input

/** @type {Vector2} */
let mousePosition = {};
let KEY_PRESSED = null;
let LEFT_MOUSE_BTN_PRESSED = false;

/** @type {Vector2} */
const brickSize = { x: canvas.width / BRICKS_PER_LINE, y: 20 };

let gameOver = false;
let pause = false;

/** @type {Player} */
const player = {};

/** @type {Ball} */
const ball = {};

/** @type {Brick[]} */
const bricks = [];

/**
 * @param {Vector2} circlePos
 * @param {number} circleRadius
 * @param {Rectangle} rect
 * @returns {boolean}
 */
function checkCollisionCircleRec(circlePos, circleRadius, rect) {
  let testX = circlePos.x;
  let testY = circlePos.y;

  // which edge is closest?
  if (circlePos.x < rect.x) testX = rect.x; // test left edge
  else if (circlePos.x > rect.x + rect.width) testX = rect.x + rect.width; // right edge
  if (circlePos.y < rect.y) testY = rect.y; // top edge
  else if (circlePos.y > rect.y + rect.height) testY = rect.y + rect.height; // bottom edge

  // get distance from closest edges
  let distX = circlePos.x - testX;
  let distY = circlePos.y - testY;
  let distance = Math.sqrt(distX * distX + distY * distY);

  // if the distance is less than the radius, collision!
  if (distance <= circleRadius) {
    return true;
  }
  return false;
}

function gameLoop() {
  ctx.reset();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "50px sans-serif";

  if (!gameOver) {
    if (KEY_PRESSED === "p") {
      pause = !pause;
    }

    if (!pause) {
      player.position.x = mousePosition.x;
      if (player.position.x - player.size.x / 2 <= 0)
        player.position.x = player.size.x / 2;
      if (player.position.x + player.size.x / 2 >= canvas.width)
        player.position.x = canvas.width - player.size.x / 2;

      if (!ball.active) {
        ball.position = {
          x: player.position.x,
          y: (canvas.height * 7) / 8 - 30,
        };

        if (LEFT_MOUSE_BTN_PRESSED) {
          ball.active = true;
          ball.speed = { x: 0, y: -5 };
        }
      } else {
        ball.position.x += ball.speed.x;
        ball.position.y += ball.speed.y;
      }

      // Collision logic: ball vs walls
      if (
        ball.position.x + ball.radius >= canvas.width ||
        ball.position.x - ball.radius <= 0
      )
        ball.speed.x *= -1;
      if (ball.position.y - ball.radius <= 0) ball.speed.y *= -1;
      if (ball.position.y + ball.radius >= canvas.height) {
        ball.speed = { x: 0, y: 0 };
        ball.active = false;

        player.life--;
      }

      // Collision logic: ball vs player
      if (
        checkCollisionCircleRec(ball.position, ball.radius, {
          x: player.position.x - player.size.x / 2,
          y: player.position.y - player.size.y / 2,
          width: player.size.x,
          height: player.size.y,
        })
      ) {
        if (ball.speed.y > 0) {
          ball.speed.y *= -1;
          ball.speed.x =
            ((ball.position.x - player.position.x) / (player.size.x / 2)) * 5;
        }
      }

      // Collision logic: ball vs bricks
      for (let y = 0; y < LINES_OF_BRICKS; y++) {
        for (let x = 0; x < BRICKS_PER_LINE; x++) {
          if (bricks[y][x].active) {
            // Hit below
            if (
              ball.position.y - ball.radius <=
                bricks[y][x].position.y + brickSize.y / 2 &&
              ball.position.y - ball.radius >
                bricks[y][x].position.y + brickSize.y / 2 + ball.speed.y &&
              Math.abs(ball.position.x - bricks[y][x].position.x) <
                brickSize.x / 2 + (ball.radius * 2) / 3 &&
              ball.speed.y < 0
            ) {
              bricks[y][x].active = false;
              ball.speed.y *= -1;
            }
            // Hit above
            else if (
              ball.position.y + ball.radius >=
                bricks[y][x].position.y - brickSize.y / 2 &&
              ball.position.y + ball.radius <
                bricks[y][x].position.y - brickSize.y / 2 + ball.speed.y &&
              Math.abs(ball.position.x - bricks[y][x].position.x) <
                brickSize.x / 2 + (ball.radius * 2) / 3 &&
              ball.speed.y > 0
            ) {
              bricks[y][x].active = false;
              ball.speed.y *= -1;
            }
            // Hit left
            else if (
              ball.position.x + ball.radius >=
                bricks[y][x].position.x - brickSize.x / 2 &&
              ball.position.x + ball.radius <
                bricks[y][x].position.x - brickSize.x / 2 + ball.speed.x &&
              Math.abs(ball.position.y - bricks[y][x].position.y) <
                brickSize.y / 2 + (ball.radius * 2) / 3 &&
              ball.speed.x > 0
            ) {
              bricks[y][x].active = false;
              ball.speed.x *= -1;
            }
            // Hit right
            else if (
              ball.position.x - ball.radius <=
                bricks[y][x].position.x + brickSize.x / 2 &&
              ball.position.x - ball.radius >
                bricks[y][x].position.x + brickSize.x / 2 + ball.speed.x &&
              Math.abs(ball.position.y - bricks[y][x].position.y) <
                brickSize.y / 2 + (ball.radius * 2) / 3 &&
              ball.speed.x < 0
            ) {
              bricks[y][x].active = false;
              ball.speed.x *= -1;
            }
          }
        }
      }

      if (player.life <= 0) gameOver = true;
    }
  } else {
    if (KEY_PRESSED === "Enter" || LEFT_MOUSE_BTN_PRESSED) {
      gameOver = false;
      initialize();
      return;
    }
  }

  if (pause) {
    ctx.fillStyle = "white";
    const message = "GAME PAUSED";
    ctx.fillText(
      message,
      canvas.width / 2 - ctx.measureText(message).width / 2,
      canvas.height / 2,
    );
  } else if (!gameOver) {
    // Draw player
    ctx.fillStyle = "#7B68EE";
    ctx.fillRect(
      player.position.x - player.size.x / 2,
      player.position.y - player.size.y / 2,
      player.size.x,
      player.size.y,
    );

    // Draw player lives
    for (let i = 0; i < player.life; i++) {
      ctx.fillStyle = "#98FB98";
      ctx.fillRect(20 + 40 * i, canvas.height - 30, 35, 10);
    }

    // Draw ball
    ctx.fillStyle = "white";
    ctx.ellipse(
      ball.position.x,
      ball.position.y,
      ball.radius,
      ball.radius,
      0,
      0,
      2 * Math.PI,
    );
    ctx.stroke();
    ctx.fill();

    // Draw bricks
    for (let y = 0; y < LINES_OF_BRICKS; y++) {
      for (let x = 0; x < BRICKS_PER_LINE; x++) {
        if (bricks[y][x].active) {
          ctx.fillStyle = (x + y) % 2 == 0 ? "#CD5C5C" : "#F08080";
          ctx.fillRect(
            bricks[y][x].position.x - brickSize.x / 2,
            bricks[y][x].position.y - brickSize.y / 2,
            brickSize.x,
            brickSize.y,
          );
        }
      }
    }
  } else {
    ctx.fillStyle = "#C70039";
    const message = "PRESS [ENTER] TO PLAY AGAIN";
    ctx.fillText(
      message,
      canvas.width / 2 - ctx.measureText(message).width / 2,
      canvas.height / 2,
    );
  }

  window.requestAnimationFrame(gameLoop);
  KEY_PRESSED = null;
}

document.addEventListener("keydown", function (event) {
  KEY_PRESSED = event.key;
});

document.addEventListener("mousemove", function (event) {
  mousePosition = { x: event.clientX, y: event.clientY };
});

document.addEventListener("touchstart", function (event) {
  LEFT_MOUSE_BTN_PRESSED = true;
})

document.addEventListener("touchend", function (event) {
  LEFT_MOUSE_BTN_PRESSED = false;
})

document.addEventListener("touchmove", function (event) {
  mousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  LEFT_MOUSE_BTN_PRESSED = false;
});

document.addEventListener("mousedown", function (event) {
  LEFT_MOUSE_BTN_PRESSED = event.button === 0;
});

document.addEventListener("mouseup", function (event) {
  LEFT_MOUSE_BTN_PRESSED = !event.button === 0;
});

function initialize() {
  player.position = { x: canvas.width / 2, y: (canvas.height * 7) / 8 };
  player.size = { x: 80, y: 20 };
  player.life = PLAYER_LIFES;

  ball.position = { x: player.position.x, y: player.position.y - 30 };
  ball.speed = { x: 0, x: 0 };
  ball.radius = 7;
  ball.active = false;

  while (bricks.length > 0) bricks.pop();

  for (let y = 0; y < LINES_OF_BRICKS; y++) {
    bricks.push([]);
    for (let x = 0; x < BRICKS_PER_LINE; x++) {
      bricks[y].push({
        position: {
          x: x * brickSize.x + brickSize.x / 2,
          y: y * brickSize.y + BRICK_MARGIN,
        },
        active: true,
      });
    }
  }

  gameLoop();
}

initialize();
