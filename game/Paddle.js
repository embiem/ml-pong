import React from "react";
import styled from "styled-components";

const StyledPaddle = styled.div`
  height: 80px;
  width: 20px;
  transform: translate(-10px, -40px);

  background-color: white;

  position: absolute;
  --x: 0px;
  --y: 0px;
  left: var(--x);
  top: var(--y);
`;

export default StyledPaddle;
