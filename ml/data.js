import Matrix from "ml-matrix";
import { GAME_HEIGHT, GAME_WIDTH, BALL_MAX_SPEED } from "../game/Pong";

export function gameStateToDataEntry(gameState) {
  // Normalize and return the features we want to use for training, as well as the target variable (playerY)
  return {
    ballX: gameState.current.ball.x / GAME_WIDTH,
    ballY: gameState.current.ball.y / GAME_HEIGHT,
    ballXVel: (gameState.current.ball.xVel + BALL_MAX_SPEED) / (2 * BALL_MAX_SPEED),
    ballYVel: (gameState.current.ball.yVel + BALL_MAX_SPEED) / (2 * BALL_MAX_SPEED),
    playerY: gameState.current.player.y / GAME_HEIGHT
  };
}

export function predictionToGameState(prediction) {
  return prediction * GAME_HEIGHT;
}

// Transform the training data into an array of features (x) & target variables (y)
export function getFeaturesAndTargets(data) {
  const x = [];
  const y = [];

  data.forEach(entry => {
    // Features
    x.push([entry.ballX, entry.ballY, entry.ballXVel, entry.ballYVel]);
    // Target Variable
    y.push(entry.playerY);
  });

  return {
    x,
    y
  };
}
