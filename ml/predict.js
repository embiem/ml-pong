import * as tf from "@tensorflow/tfjs";
import { GAME_HEIGHT, GAME_WIDTH, BALL_MAX_SPEED } from "../game/Pong";
import { gameStateToDataEntry } from "./data";

export default function predict(model, gameState) {
  const { ballY, ballXVel, ballYVel } = gameStateToDataEntry(
    gameState
  );

  const normalizedFeatures = [
    (GAME_WIDTH - gameState.current.ball.x) / GAME_WIDTH,
    ballY,
    ballXVel,
    ballYVel
  ];

  // 1st Part (Decision Tree) 
  //return model.predict([normalizedFeatures]);

  // 2nd Part (ANN in TF)
  return model.predict(tf.tensor2d([normalizedFeatures])).dataSync();
}
