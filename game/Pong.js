import React, { useState, useCallback, useEffect, useRef } from "react";
import styled from "styled-components";

import Paddle from "./Paddle";
import Ball from "./Ball";
import Scores from "./Scores";
import useKeyPress from "./useKeyPress";
import useAnimationFrame from "./useAnimationFrame";
import clamp from "./clamp";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 700;

const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 20;
const PADDLE_START_POS_LEFT = { x: 20, y: 350 };
const PADDLE_START_POS_RIGHT = { x: 780, y: 350 };

const BALL_RADIUS = 10;
const BALL_START_POS = { x: 400, y: 350 };

const PADDLE_SPEED = 0.5;
const BALL_START_SPEED = 1;
const BALL_SPEED_GAIN = 0.1;

const PADDLE_BOUNDS_MIN = PADDLE_HEIGHT / 2;
const PADDLE_BOUNDS_MAX = GAME_HEIGHT - PADDLE_HEIGHT / 2;

const BALL_X_CHECK_LEFT =
  PADDLE_START_POS_LEFT.x + PADDLE_WIDTH / 2 - BALL_RADIUS;
const BALL_X_CHECK_RIGHT =
  PADDLE_START_POS_RIGHT.x - PADDLE_WIDTH / 2 + BALL_RADIUS;
const BALL_Y_CHECK_TOP = BALL_RADIUS;
const BALL_Y_CHECK_BOTTOM = GAME_HEIGHT - BALL_RADIUS;

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

export default function Pong() {
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  const playerPaddle = useRef();
  const aiPaddle = useRef();
  const ball = useRef();

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
      yVel: 0
    },
    score: {
      player: 0,
      ai: 0
    }
  });

  const downPress = useRef();
  const upPress = useRef();

  // Input Detection
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

    aiPaddle.current.style.setProperty("--x", `${gameState.current.ai.x}px`);
    aiPaddle.current.style.setProperty("--y", `${gameState.current.ai.y}px`);

    ball.current.style.setProperty("--x", `${gameState.current.ball.x}px`);
    ball.current.style.setProperty("--y", `${gameState.current.ball.y}px`);
  };

  // Game Loop -->
  useAnimationFrame(deltaTime => {
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

    // Keep paddles in bounds
    playerY = clamp(playerY, PADDLE_BOUNDS_MIN, PADDLE_BOUNDS_MAX);
    aiY = clamp(aiY, PADDLE_BOUNDS_MIN, PADDLE_BOUNDS_MAX);

    // TODO Bounce Ball
    if (
      ballXVel > 0 &&
      ballX >= BALL_X_CHECK_RIGHT &&
      Math.abs(ballY - aiY) < PADDLE_HEIGHT / 2 + BALL_RADIUS
    ) {
      ballXVel = ballXVel * -1;
    } else if (
      ballXVel < 0 && 
      ballX <= BALL_X_CHECK_LEFT &&
      Math.abs(ballY - playerY) < PADDLE_HEIGHT / 2 + BALL_RADIUS
    ) {
      ballXVel = ballXVel * -1;
    }

    // Move Ball
    ballX += ballXVel * BALL_START_SPEED;
    ballY += ballYVel * BALL_START_SPEED;

    // Detect Win/Loss
    if (ballX < BALL_X_CHECK_LEFT) {
      // Player lost
      aiScore++;

      // Reset ball
      ballX = BALL_START_POS.x;
      ballY = BALL_START_POS.y;
      ballXVel = BALL_START_SPEED;
    } else if (ballX > BALL_X_CHECK_RIGHT) {
      // AI lost
      playerScore++;

      // Reset Ball
      ballX = BALL_START_POS.x;
      ballY = BALL_START_POS.y;
      ballXVel = BALL_START_SPEED * -1;
    }

    // Set new game state
    gameState.current.player.y = playerY;
    gameState.current.ai.y = aiY;
    gameState.current.ball.x = ballX;
    gameState.current.ball.y = ballY;
    gameState.current.ball.xVel = ballXVel;
    gameState.current.ball.yVel = ballYVel;
    gameState.current.score.player = playerScore;
    gameState.current.score.ai = aiScore;

    // Update View
    draw();
    setScores({ player: playerScore, ai: aiScore });
  });

  return (
    <>
      <Scores player={scores.player} ai={scores.ai} />
      <StyledContainer>
        <Divider />
        <Paddle ref={playerPaddle} />
        <Paddle ref={aiPaddle} />
        <Ball ref={ball} />
      </StyledContainer>
    </>
  );
}
