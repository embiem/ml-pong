import * as tf from "@tensorflow/tfjs";
import { GAME_HEIGHT, GAME_WIDTH, BALL_MAX_SPEED } from "../game/Pong";
import {gameStateToDataEntry} from "./data";

export default function predict(model, gameState) {
  const {
    ballX,
    ballY,
    ballXVel,
    ballYVel,
    playerY
  } = gameStateToDataEntry(gameState);

  // TODO use `model.predict` with the game's state as input

  console.warn("predict not implemented!")

  return 0;
}
