import { useState, useEffect } from "react";

// copied from https://usehooks.com/useKeyPress/

export default function useKeyPress(targetKey) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState(false);

  // If pressed key is our target key then set to true
  function downHandler(e) {
    if (e.key === targetKey) {
      e.preventDefault();
      setKeyPressed(true);
    }
  }

  // If released key is our target key then set to false
  const upHandler = (e) => {
    if (e.key === targetKey) {
      e.preventDefault();
      setKeyPressed(false);
    }
  };

  // Add event listeners
  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return keyPressed;
}
