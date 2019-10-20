import { GAME_HEIGHT, GAME_WIDTH, BALL_MAX_SPEED } from "../game/Pong";

export function gameStateToDataEntry(gameState) {
  const {
    ball: { x: ballX, y: ballY, xVel: ballXVel, yVel: ballYVel }
  } = gameState.current;

  // TODO Normalize and return the features we want to use for training, as well as the target variable (playerY)

  console.warn("predictionToGameState not implemented!");

  return {
    ballX: 0,
    ballY: 0,
    ballXVel: 0,
    ballYVel: 0,
    playerY: 0
  };
}

export function predictionToGameState(prediction) {
  // TODO de-normalize the prediction and return the final value for the Y position of the AI's paddle

  console.warn("predictionToGameState not implemented!");

  return 0;
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
