import Matrix from "ml-matrix";
import { GAME_HEIGHT, GAME_WIDTH, BALL_MAX_SPEED } from "../game/Pong";

export function gameStateToDataEntry(gameState) {
  const {
    ball: { x: ballX, y: ballY, xVel: ballXVel, yVel: ballYVel },
    player: { y: playerY }
  } = gameState.current;

  // Normalize and return the features we want to use for training, as well as the target variable (playerY)
  return {
    ballX: ballX / GAME_WIDTH,
    ballY: ballY / GAME_HEIGHT,
    ballXVel: (ballXVel + BALL_MAX_SPEED) / (2 * BALL_MAX_SPEED),
    ballYVel: (ballYVel + BALL_MAX_SPEED) / (2 * BALL_MAX_SPEED),
    playerY: playerY / GAME_HEIGHT
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
