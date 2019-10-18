import React from "react";
import styled from "styled-components";

const StyledBall = styled.div`
  border-radius: 25px;
  background-color: green;

  height: 20px;
  width: 20px;
  transform: translate(-10px, -10px);

  position: absolute;
  --x: 0px;
  --y: 0px;
  left: var(--x);
  top: var(--y);
`;

export default StyledBall;
