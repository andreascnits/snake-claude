import { useState, useEffect, useCallback, useRef } from 'react';
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

// Map of opposite directions
const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

// Base speed in milliseconds (lower = faster)
const BASE_SPEED = 150;
// How much to decrease the interval per 10 points (making game faster)
const SPEED_INCREMENT = 3;
// Minimum speed the game can reach
const MIN_SPEED = 70;

export const useSnakeGame = (settings: GameSettings) => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isPaused, setIsPaused] = useState(false);
  // Track if the game is currently active (being played)
  const [isActive, setIsActive] = useState(false);
  // Input queue to store pending direction changes
  const directionQueue = useRef<Direction[]>([]);
  // Track the last processed direction to prevent invalid moves
  const lastProcessedDirection = useRef<Direction>(INITIAL_STATE.direction);
  // Store the game loop interval ID for dynamic speed adjustment
  const gameLoopRef = useRef<number | null>(null);
  // Track touch start position for swipe detection
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  // Current game speed
  const [gameSpeed, setGameSpeed] = useState(BASE_SPEED);
  // Store the moveSnake function in a ref to avoid dependency issues
  const moveSnakeRef = useRef<() => void>(() => {});

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

  // Process the next valid direction from the queue
  const processNextDirection = useCallback(() => {
    if (directionQueue.current.length === 0) return;
    
    // Get the next direction from the queue
    const nextDirection = directionQueue.current[0];
    
    // Check if the direction is valid (not opposite to the last processed direction)
    if (OPPOSITE_DIRECTIONS[nextDirection] !== lastProcessedDirection.current) {
      // Update the game state with the new direction
      setGameState(prev => ({ ...prev, direction: nextDirection }));
      // Update the last processed direction
      lastProcessedDirection.current = nextDirection;
    }
    
    // Remove the processed direction from the queue
    directionQueue.current.shift();
  }, []);

  // Calculate game speed based on score
  const calculateGameSpeed = useCallback((score: number) => {
    // Decrease interval (increase speed) as score increases
    // Using a more gradual curve for speed increase
    const speedReduction = Math.floor(score / 15) * SPEED_INCREMENT; // Changed from 10 to 15 points per speed increase
    return Math.max(MIN_SPEED, BASE_SPEED - speedReduction);
  }, []);

  // Define moveSnake function
  const moveSnake = useCallback(() => {
    if (gameState.isGameOver || isPaused) return;

    // Process the next direction from the queue before moving
    processNextDirection();

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

    const newScore = isFoodEaten ? gameState.score + 10 : gameState.score;

    // Update game state
    setGameState((prev) => ({
      ...prev,
      snake: newSnake,
      food: isFoodEaten ? generateFood() : prev.food,
      score: newScore,
    }));

    // Update game speed if food was eaten
    if (isFoodEaten) {
      const newSpeed = calculateGameSpeed(newScore);
      setGameSpeed(newSpeed);
    }
  }, [gameState, isPaused, settings.wallsEnabled, checkCollision, generateFood, processNextDirection, calculateGameSpeed]);

  // Update moveSnakeRef whenever moveSnake changes
  useEffect(() => {
    moveSnakeRef.current = moveSnake;
  }, [moveSnake]);

  // Start/stop game loop based on active and paused states
  useEffect(() => {
    const startGameLoop = () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      
      if (isActive && !isPaused) {
        gameLoopRef.current = window.setInterval(() => {
          moveSnakeRef.current();
        }, gameSpeed);
      }
    };

    startGameLoop();
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [isActive, isPaused, gameSpeed]);

  const changeDirection = useCallback(
    (newDirection: Direction) => {
      // Don't add the direction if it's the same as the last one in the queue
      const lastQueuedDirection = directionQueue.current.length > 0 
        ? directionQueue.current[directionQueue.current.length - 1] 
        : gameState.direction;
      
      // Don't add opposite directions to the last queued direction
      if (OPPOSITE_DIRECTIONS[newDirection] !== lastQueuedDirection) {
        // Add the new direction to the queue
        directionQueue.current.push(newDirection);
        
        // Limit queue size to prevent memory issues
        if (directionQueue.current.length > 3) {
          directionQueue.current = directionQueue.current.slice(-3);
        }
      }
    },
    [gameState.direction]
  );

  // Handle touch/swipe controls
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (gameState.isGameOver || !isActive || isPaused) return;
    
    // Store the starting touch position
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, [gameState.isGameOver, isActive, isPaused]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevent scrolling when swiping during gameplay
    if (isActive && !isPaused) {
      e.preventDefault();
    }
  }, [isActive, isPaused]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gameState.isGameOver || !isActive || isPaused || !touchStartRef.current) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;
    
    // Determine if the swipe was horizontal or vertical
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 30) {
        changeDirection('RIGHT');
      } else if (dx < -30) {
        changeDirection('LEFT');
      }
    } else {
      // Vertical swipe
      if (dy > 30) {
        changeDirection('DOWN');
      } else if (dy < -30) {
        changeDirection('UP');
      }
    }
    
    // Reset touch start position
    touchStartRef.current = null;
  }, [gameState.isGameOver, isActive, isPaused, changeDirection]);

  const resetGame = useCallback(() => {
    setGameState({
      ...INITIAL_STATE,
      highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
    });
    setIsPaused(false);
    // Reset the direction queue and last processed direction
    directionQueue.current = [];
    lastProcessedDirection.current = INITIAL_STATE.direction;
    // Reset game speed
    setGameSpeed(BASE_SPEED);
    // Activate the game when reset/started
    setIsActive(true);
  }, []);

  const togglePause = useCallback(() => {
    if (!gameState.isGameOver) {
      setIsPaused((prev) => !prev);
    }
  }, [gameState.isGameOver]);

  // Set up keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only process key events if the game is active and not over
      if (gameState.isGameOver || !isActive) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault(); // Prevent page scrolling
          changeDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault(); // Prevent page scrolling
          changeDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault(); // Prevent page scrolling
          changeDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault(); // Prevent page scrolling
          changeDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault(); // Prevent page scrolling/jumping
          togglePause();
          break;
        // WASD controls for alternative input
        case 'w':
        case 'W':
          changeDirection('UP');
          break;
        case 's':
        case 'S':
          changeDirection('DOWN');
          break;
        case 'a':
        case 'A':
          changeDirection('LEFT');
          break;
        case 'd':
        case 'D':
          changeDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [changeDirection, togglePause, gameState.isGameOver, isActive]);

  // Set up touch controls
  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    gameState,
    isPaused,
    resetGame,
    togglePause,
    GRID_SIZE,
    // Export isActive state and setter for external control
    isActive,
    setIsActive,
    // Export current game speed for UI feedback
    gameSpeed,
  };
}; 