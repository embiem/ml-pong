import { GAME_HEIGHT, GAME_WIDTH, BALL_MAX_SPEED } from "../game/Pong";

export default function predict(model, gameState) {
  const {
    ball: { x: ballX, y: ballY, xVel: ballXVel, yVel: ballYVel }
  } = gameState.current;

  return model.predict([
    [
      (GAME_WIDTH - ballX) / GAME_WIDTH,
      ballY / GAME_HEIGHT,
      (ballXVel + BALL_MAX_SPEED) / (2 * BALL_MAX_SPEED),
      (ballYVel + BALL_MAX_SPEED) / (2 * BALL_MAX_SPEED)
    ]
  ]);
}
