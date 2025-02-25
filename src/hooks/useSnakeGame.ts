import { useState, useEffect, useCallback } from 'react';
import { Direction, Position, GameState, GameSettings } from '../types/game';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_STATE: GameState = {
  snake: INITIAL_SNAKE,
  food: { x: 5, y: 5 },
  direction: 'UP',
  isGameOver: false,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
};

export const useSnakeGame = (settings: GameSettings) => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isPaused, setIsPaused] = useState(false);

  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      gameState.snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  }, [gameState.snake]);

  const checkCollision = useCallback(
    (head: Position): boolean => {
      // Wall collision
      if (settings.wallsEnabled) {
        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE
        ) {
          return true;
        }
      }

      // Snake collision with itself (excluding the tail which will move)
      return gameState.snake.some(
        (segment, index) => 
          // Only check collision with the rest of the body
          index < gameState.snake.length - 1 && 
          segment.x === head.x && 
          segment.y === head.y
      );
    },
    [gameState.snake, settings.wallsEnabled]
  );

  const moveSnake = useCallback(() => {
    if (gameState.isGameOver || isPaused) return;

    const newSnake = [...gameState.snake];
    const head = { ...newSnake[0] };

    // Calculate new head position
    switch (gameState.direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
    }

    // Handle wrapping around the grid if walls are disabled
    if (!settings.wallsEnabled) {
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;
    }

    // Check for collisions
    if (checkCollision(head)) {
      const newHighScore = Math.max(gameState.score, gameState.highScore);
      localStorage.setItem('snakeHighScore', newHighScore.toString());
      setGameState((prev) => ({
        ...prev,
        isGameOver: true,
        highScore: newHighScore,
      }));
      return;
    }

    // Check if food is eaten
    const isFoodEaten = head.x === gameState.food.x && head.y === gameState.food.y;

    newSnake.unshift(head);
    if (!isFoodEaten) {
      newSnake.pop();
    }

    setGameState((prev) => ({
      ...prev,
      snake: newSnake,
      food: isFoodEaten ? generateFood() : prev.food,
      score: isFoodEaten ? prev.score + 10 : prev.score,
    }));
  }, [gameState, isPaused, settings.wallsEnabled, checkCollision, generateFood]);

  const changeDirection = useCallback(
    (newDirection: Direction) => {
      const opposites = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
      };

      if (opposites[newDirection] !== gameState.direction) {
        setGameState((prev) => ({ ...prev, direction: newDirection }));
      }
    },
    [gameState.direction]
  );

  const resetGame = useCallback(() => {
    setGameState({
      ...INITIAL_STATE,
      highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
    });
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (!gameState.isGameOver) {
      setIsPaused((prev) => !prev);
    }
  }, [gameState.isGameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          changeDirection('UP');
          break;
        case 'ArrowDown':
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
          changeDirection('RIGHT');
          break;
        case ' ':
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, togglePause, gameState.isGameOver]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, 150);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  return {
    gameState,
    isPaused,
    resetGame,
    togglePause,
    GRID_SIZE,
  };
}; 