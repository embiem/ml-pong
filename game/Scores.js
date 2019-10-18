import React from "react";
import styled from "styled-components";

const StyledScores = styled.div`
  color: grey;
  display: flex;
  justify-content: space-between;

  font-size: 1.3em;
`;

export default function Scores({ player, ai }) {
  return (
    <div>
      <StyledScores>
        <span>Player: {player}</span>
        <span>AI: {ai}</span>
      </StyledScores>
    </div>
  );
}
