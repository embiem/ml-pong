import React, { useState, useCallback, useRef } from "react";
import styled from "styled-components";

import Paddle from "./Paddle";
import Ball from "./Ball";
import Scores from "./Scores";
import useKeyPress from "./useKeyPress";
import useAnimationFrame from "./useAnimationFrame";
import clamp from "./clamp";

import {
  getFeaturesAndTargets,
  gameStateToDataEntry,
  predictionToGameState
} from "../ml/data";
import trainModel from "../ml/train";
import predictAIY from "../ml/predict";

export const GAME_WIDTH = 900;
export const GAME_HEIGHT = 700;

const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 20;
const PADDLE_START_POS_LEFT = { x: 20, y: 350 };
const PADDLE_START_POS_RIGHT = { x: GAME_WIDTH - 20, y: 350 };

const BALL_RADIUS = 10;
const BALL_START_POS = { x: 400, y: 350 };

const PADDLE_SPEED = 0.3;
const BALL_START_SPEED = 1.2;
const BALL_SPEED_GAIN = 0.02;
export const BALL_MAX_SPEED = 1.8;

const PADDLE_BOUNDS_MIN = PADDLE_HEIGHT / 2;
const PADDLE_BOUNDS_MAX = GAME_HEIGHT - PADDLE_HEIGHT / 2;

const BALL_X_CHECK_LEFT =
  PADDLE_START_POS_LEFT.x + PADDLE_WIDTH / 2 - BALL_RADIUS;
const BALL_X_CHECK_RIGHT =
  PADDLE_START_POS_RIGHT.x - PADDLE_WIDTH / 2 + BALL_RADIUS;
const BALL_Y_CHECK_TOP = BALL_RADIUS;
const BALL_Y_CHECK_BOTTOM = GAME_HEIGHT - BALL_RADIUS;

const TRAIN_DATA_TIME_SLICE = 500; // Record new train data entry every 500ms
const PREDICT_DATA_TIME_SLICE = 200; // Make new prediction every 200ms

const StyledContainer = styled.div`
  position: relative;
  background-color: gray;
  width: ${GAME_WIDTH}px;
  height: ${GAME_HEIGHT}px;
`;

const Divider = styled.div`
  position: absolute;
  left: ${GAME_WIDTH / 2}px;
  border-left: 1px dashed rgba(255, 255, 255, 0.6);
  height: ${GAME_HEIGHT}px;
`;

let trainData = [];

function downloadTrainData() {
  const text = trainData.reduce((prev, cur) => {
    return `${prev}\n${cur.ballX},${cur.ballY},${cur.ballXVel},${cur.ballYVel},${cur.playerY}`;
  }, "ballX,ballY,ballXVel,ballYVel,playerY");
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute(
    "download",
    `trainData_${trainData.length}_${new Date().getTime()}.csv`
  );

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function uploadTrainData(e) {
  const fileName = e.target.files[0].name;
  const fr = new FileReader();
  fr.onload = function() {
    const text = fr.result;

    // parse csv & put into trainData
    trainData = text.split("\n").reduce((data, line, idx) => {
      if (idx === 0) return data; // skip initial line which includes the labels

      const numbers = line.split(",").map(n => parseFloat(n));

      if (numbers.length != 5) return data; // skip if line with corrupt data

      const newDataEntry = {
        ballX: numbers[0],
        ballY: numbers[1],
        ballXVel: numbers[2],
        ballYVel: numbers[3],
        playerY: numbers[4]
      };

      return [...data, newDataEntry];
    }, []);

    console.info(
      `File "${fileName}" successfully read. ${trainData.length} data entries loaded.`
    );
  };
  fr.readAsText(e.target.files[0]);
}

function getRandomYVel() {
  return (Math.random() + 0.2) * (Math.random() > 0.5 ? 1 : -1);
}

function lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

export default function Pong() {
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [trainMode, setTrainMode] = useState(false);

  const playerPaddle = useRef();
  const aiPaddle = useRef();
  const ball = useRef();

  const trainedModel = useRef();
  const trainDataTimestep = useRef(0);
  const predictDataTimestep = useRef(0);
  const aiTargetY = useRef(PADDLE_START_POS_RIGHT.y);

  const gameState = useRef({
    player: {
      ...PADDLE_START_POS_LEFT
    },
    ai: {
      ...PADDLE_START_POS_RIGHT
    },
    ball: {
      ...BALL_START_POS,
      xVel: BALL_START_SPEED,
      yVel: getRandomYVel()
    },
    score: {
      player: 0,
      ai: 0
    }
  });

  // Input Detection
  const downPress = useRef();
  const upPress = useRef();
  downPress.current = useKeyPress("ArrowDown");
  upPress.current = useKeyPress("ArrowUp");

  const draw = () => {
    playerPaddle.current.style.setProperty(
      "--x",
      `${gameState.current.player.x}px`
    );
    playerPaddle.current.style.setProperty(
      "--y",
      `${gameState.current.player.y}px`
    );

    // Can be null in trainMode
    if (aiPaddle.current) {
      aiPaddle.current.style.setProperty("--x", `${gameState.current.ai.x}px`);
      aiPaddle.current.style.setProperty("--y", `${gameState.current.ai.y}px`);
    }

    ball.current.style.setProperty("--x", `${gameState.current.ball.x}px`);
    ball.current.style.setProperty("--y", `${gameState.current.ball.y}px`);
  };

  const gameLoop = useCallback(
    deltaTime => {
      let {
        player: { y: playerY },
        ai: { y: aiY },
        ball: { x: ballX, y: ballY, xVel: ballXVel, yVel: ballYVel },
        score: { player: playerScore, ai: aiScore }
      } = gameState.current;

      // Move Player Paddle
      if (downPress.current) {
        playerY += deltaTime * PADDLE_SPEED;
      }
      if (upPress.current) {
        playerY -= deltaTime * PADDLE_SPEED;
      }

      // Move AI Paddle if a model exists
      if (trainedModel.current && !trainMode) {
        predictDataTimestep.current += deltaTime;
        
        if (predictDataTimestep.current >= PREDICT_DATA_TIME_SLICE) {
          predictDataTimestep.current -= PREDICT_DATA_TIME_SLICE;
          
          // New Prediction
          const estimations = predictAIY(trainedModel.current, gameState);
          aiTargetY.current = predictionToGameState(estimations[0])
        }

        if (aiTargetY.current > aiY) {
          aiY += deltaTime * PADDLE_SPEED;
        } else if (aiTargetY.current < aiY) {
          aiY -= deltaTime * PADDLE_SPEED;
        }
      }

      // Keep paddles in bounds
      playerY = clamp(playerY, PADDLE_BOUNDS_MIN, PADDLE_BOUNDS_MAX);
      aiY = clamp(aiY, PADDLE_BOUNDS_MIN, PADDLE_BOUNDS_MAX);

      // Move Ball
      ballX += ballXVel * BALL_START_SPEED;
      ballY += ballYVel * BALL_START_SPEED;

      // Bounce Ball
      if (
        ballX >= BALL_X_CHECK_RIGHT &&
        (trainMode || Math.abs(ballY - aiY) < PADDLE_HEIGHT / 2 + BALL_RADIUS)
      ) {
        // Bounce off right paddle
        ballXVel = (ballXVel + BALL_SPEED_GAIN) * -1;
        if (ballXVel < -BALL_MAX_SPEED) ballXVel = -BALL_MAX_SPEED;

        if (!trainMode) {
          ballYVel = lerp(
            BALL_START_SPEED,
            -BALL_START_SPEED,
            (aiY + PADDLE_HEIGHT / 2 - ballY) / PADDLE_HEIGHT
          );
        }
      } else if (
        ballX <= BALL_X_CHECK_LEFT &&
        Math.abs(ballY - playerY) < PADDLE_HEIGHT / 2 + BALL_RADIUS
      ) {
        // Bounce off left paddle
        ballXVel = (ballXVel - BALL_SPEED_GAIN) * -1;
        if (ballXVel > BALL_MAX_SPEED) ballXVel = BALL_MAX_SPEED;

        console.log("ballXVel", ballXVel);

        ballYVel = lerp(
          BALL_START_SPEED,
          -BALL_START_SPEED,
          (playerY + PADDLE_HEIGHT / 2 - ballY) / PADDLE_HEIGHT
        );
      } else if (ballY <= BALL_Y_CHECK_TOP) {
        // Bounce top
        ballYVel *= -1;
      } else if (ballY >= BALL_Y_CHECK_BOTTOM) {
        // Bounce bottom
        ballYVel *= -1;
      }

      // Detect Win/Loss
      if (ballXVel < 0 && ballX < BALL_X_CHECK_LEFT) {
        // Player lost
        aiScore++;

        // Reset ball
        ballX = BALL_START_POS.x;
        ballY = BALL_START_POS.y;
        ballXVel = BALL_START_SPEED;
        ballYVel = getRandomYVel();
      } else if (ballXVel > 0 && ballX > BALL_X_CHECK_RIGHT) {
        // AI lost
        playerScore++;

        // Reset Ball
        ballX = BALL_START_POS.x;
        ballY = BALL_START_POS.y;
        ballXVel = BALL_START_SPEED * -1;
        ballYVel = getRandomYVel();
      }

      // Set new game state
      gameState.current.player.y = playerY;
      gameState.current.ai.y = aiY;
      gameState.current.ball.x = ballX;
      gameState.current.ball.y = ballY;
      gameState.current.ball.xVel = ballXVel + (Math.random() - 0.5) * 0.000000001;
      gameState.current.ball.yVel = ballYVel + (Math.random() - 0.5) * 0.000000001;
      gameState.current.score.player = playerScore;
      gameState.current.score.ai = aiScore;

      // Update View
      draw();
      setScores({ player: playerScore, ai: aiScore });

      if (trainMode) {
        trainDataTimestep.current += deltaTime;

        if (trainDataTimestep.current >= TRAIN_DATA_TIME_SLICE) {
          trainDataTimestep.current -= TRAIN_DATA_TIME_SLICE;

          // Record new train data entry
          const dataEntry = gameStateToDataEntry(gameState);
          trainData.push(dataEntry);
        }
      }
    },
    [trainMode]
  );

  useAnimationFrame(gameLoop, [trainMode]);

  return (
    <>
      <label>
        Train Mode
        <input
          type="checkbox"
          checked={trainMode}
          onChange={() => setTrainMode(!trainMode)}
        ></input>
      </label>
      <button
        onClick={() => {
          const { x, y } = getFeaturesAndTargets(trainData);
          trainedModel.current = trainModel(x, y);
        }}
      >
        Train Model
      </button>
      <button onClick={downloadTrainData}>Download Train Data</button>
      <input
        type="file"
        id="train-data"
        name="train-data"
        accept=".csv"
        onChange={uploadTrainData}
      ></input>
      <Scores player={scores.player} ai={scores.ai} />
      <StyledContainer>
        <Divider />
        <Paddle ref={playerPaddle} />
        {!trainMode && <Paddle ref={aiPaddle} />}
        <Ball ref={ball} />
      </StyledContainer>
    </>
  );
}
