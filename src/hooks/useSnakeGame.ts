import { useState, useEffect, useCallback, useRef } from 'react';
import { Direction, Position, GameState, GameSettings, GameMode, Bullet, GunPowerUp, Target } from '../types/game';

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_STATE: GameState = {
  snake: INITIAL_SNAKE,
  food: { x: 5, y: 5 },
  direction: Direction.UP,
  isGameOver: false,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
  // Gun-related properties
  hasGun: false,
  ammo: 0,
  bullets: [],
  gunPowerUp: null,
  targets: [],
};

// Gun settings
const GUN_SPAWN_CHANCE = 0.2; // 20% chance to spawn a gun power-up when food is eaten
const BULLET_SPEED = 2; // Bullets move 2x faster than the snake
const MAX_AMMO = 5; // Maximum ammo per gun power-up
const TARGET_SPAWN_CHANCE = 0.3; // 30% chance to spawn a target when food is eaten
const TARGET_HEALTH = 1; // Health points for targets
const TARGET_POINTS = 20; // Score points for destroying a target
const MAX_TARGETS = 5; // Maximum number of targets on screen at once

// Map of opposite directions
const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

// Base speed in milliseconds (lower = faster)
const BASE_SPEED = 150;
// How much to decrease the interval per 10 points (making game faster)
const SPEED_INCREMENT = 3;
// Minimum speed the game can reach
const MIN_SPEED = 70;

export const useSnakeGame = (settings: GameSettings) => {
  const [gameState, setGameState] = useState<GameState>({
    ...INITIAL_STATE,
    highScore: parseInt(localStorage.getItem('snakeHighScore') || '0'),
  });
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
  // Store the bullet loop interval ID
  const bulletLoopRef = useRef<number | null>(null);

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

  // Generate a gun power-up at a random position
  const generateGunPowerUp = useCallback((): GunPowerUp | null => {
    // Only generate a gun power-up in GUNS mode with a certain probability
    if (settings.gameMode !== GameMode.GUNS || Math.random() > GUN_SPAWN_CHANCE) {
      return null;
    }

    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      gameState.snake.some(segment => segment.x === position.x && segment.y === position.y) ||
      (gameState.food.x === position.x && gameState.food.y === position.y)
    );

    return {
      position,
      active: true,
      ammo: MAX_AMMO
    };
  }, [gameState.snake, gameState.food, settings.gameMode]);

  // Generate a target at a random position
  const generateTarget = useCallback((): Target | null => {
    // Only generate a target in GUNS mode with a certain probability
    // Also limit the number of targets on screen
    if (
      settings.gameMode !== GameMode.GUNS || 
      Math.random() > TARGET_SPAWN_CHANCE ||
      gameState.targets.filter(t => t.active).length >= MAX_TARGETS
    ) {
      return null;
    }

    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      gameState.snake.some(segment => segment.x === position.x && segment.y === position.y) ||
      (gameState.food.x === position.x && gameState.food.y === position.y) ||
      (gameState.gunPowerUp?.position.x === position.x && gameState.gunPowerUp?.position.y === position.y) ||
      gameState.targets.some(target => target.active && target.position.x === position.x && target.position.y === position.y)
    );

    return {
      position,
      active: true,
      health: TARGET_HEALTH,
      points: TARGET_POINTS
    };
  }, [gameState.snake, gameState.food, gameState.gunPowerUp, gameState.targets, settings.gameMode]);

  // Handle shooting
  const shoot = useCallback(() => {
    if (!gameState.hasGun || gameState.ammo <= 0 || gameState.isGameOver || isPaused) return;

    const head = gameState.snake[0];
    const newBullet: Bullet = {
      position: { ...head },
      direction: gameState.direction,
      active: true
    };

    setGameState(prev => ({
      ...prev,
      bullets: [...prev.bullets, newBullet],
      ammo: prev.ammo - 1,
      // If no ammo left, remove the gun
      hasGun: prev.ammo > 1
    }));
  }, [gameState.hasGun, gameState.ammo, gameState.isGameOver, gameState.direction, gameState.snake, isPaused]);

  // Move bullets and check for collisions
  const moveBullets = useCallback(() => {
    if (gameState.isGameOver || isPaused || settings.gameMode !== GameMode.GUNS) return;

    setGameState(prev => {
      let updatedBullets = [...prev.bullets];
      let updatedTargets = [...prev.targets];
      let additionalScore = 0;

      // Process each bullet
      updatedBullets = updatedBullets
        .map(bullet => {
          if (!bullet.active) return bullet;

          let newPosition = { ...bullet.position };
          
          // Move bullet based on direction
          switch (bullet.direction) {
            case Direction.UP:
              newPosition.y -= 1;
              break;
            case Direction.DOWN:
              newPosition.y += 1;
              break;
            case Direction.LEFT:
              newPosition.x -= 1;
              break;
            case Direction.RIGHT:
              newPosition.x += 1;
              break;
          }

          // Always check for wall collisions (bullets can't pass through walls)
          if (
            newPosition.x < 0 ||
            newPosition.x >= GRID_SIZE ||
            newPosition.y < 0 ||
            newPosition.y >= GRID_SIZE
          ) {
            return { ...bullet, active: false };
          }

          // Check for collisions with targets
          const hitTargetIndex = updatedTargets.findIndex(
            target => target.active && target.position.x === newPosition.x && target.position.y === newPosition.y
          );

          if (hitTargetIndex >= 0) {
            // Bullet hit a target
            const target = updatedTargets[hitTargetIndex];
            
            // Reduce target health
            const newHealth = target.health - 1;
            
            if (newHealth <= 0) {
              // Target destroyed
              updatedTargets[hitTargetIndex] = { ...target, active: false };
              additionalScore += target.points;
            } else {
              // Target damaged but not destroyed
              updatedTargets[hitTargetIndex] = { ...target, health: newHealth };
            }
            
            // Bullet is consumed
            return { ...bullet, active: false };
          }

          // Check for collision with snake (except head)
          const hitSnake = prev.snake.some(
            (segment, index) => index > 0 && segment.x === newPosition.x && segment.y === newPosition.y
          );

          if (hitSnake) {
            return { ...bullet, active: false };
          }

          return { ...bullet, position: newPosition };
        })
        .filter(bullet => bullet.active); // Remove inactive bullets

      return { 
        ...prev, 
        bullets: updatedBullets,
        targets: updatedTargets,
        score: prev.score + additionalScore
      };
    });
  }, [gameState.isGameOver, isPaused, settings.gameMode]);

  // Define moveSnake function
  const moveSnake = useCallback(() => {
    if (gameState.isGameOver || isPaused) return;

    // Process the next direction from the queue before moving
    processNextDirection();

    const newSnake = [...gameState.snake];
    const head = { ...newSnake[0] };

    // Calculate new head position
    switch (gameState.direction) {
      case Direction.UP:
        head.y -= 1;
        break;
      case Direction.DOWN:
        head.y += 1;
        break;
      case Direction.LEFT:
        head.x -= 1;
        break;
      case Direction.RIGHT:
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

    // Check if gun power-up is collected
    let isGunCollected = false;
    if (settings.gameMode === GameMode.GUNS && gameState.gunPowerUp && gameState.gunPowerUp.active) {
      isGunCollected = head.x === gameState.gunPowerUp.position.x && head.y === gameState.gunPowerUp.position.y;
    }

    newSnake.unshift(head);
    if (!isFoodEaten) {
      newSnake.pop();
    }

    const newScore = isFoodEaten ? gameState.score + 10 : gameState.score;

    // Generate a new gun power-up if food is eaten (with a chance)
    const newGunPowerUp = isFoodEaten ? generateGunPowerUp() : gameState.gunPowerUp;
    
    // Generate a new target if food is eaten (with a chance)
    const newTarget = isFoodEaten ? generateTarget() : null;
    
    // Update game state
    setGameState((prev) => {
      // Create updated targets array
      const updatedTargets = [...prev.targets];
      if (newTarget) {
        updatedTargets.push(newTarget);
      }

      return {
        ...prev,
        snake: newSnake,
        food: isFoodEaten ? generateFood() : prev.food,
        score: newScore,
        // Update gun-related state if in GUNS mode
        hasGun: settings.gameMode === GameMode.GUNS ? 
          (isGunCollected ? true : prev.hasGun) : false,
        ammo: settings.gameMode === GameMode.GUNS ? 
          (isGunCollected ? (prev.ammo + (gameState.gunPowerUp?.ammo || 0)) : prev.ammo) : 0,
        gunPowerUp: isGunCollected ? null : newGunPowerUp,
        targets: updatedTargets,
      };
    });

    // Update game speed if food was eaten
    if (isFoodEaten) {
      const newSpeed = calculateGameSpeed(newScore);
      setGameSpeed(newSpeed);
    }
  }, [gameState, isPaused, settings.wallsEnabled, settings.gameMode, checkCollision, generateFood, processNextDirection, calculateGameSpeed, generateGunPowerUp, generateTarget]);

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
        changeDirection(Direction.RIGHT);
      } else if (dx < -30) {
        changeDirection(Direction.LEFT);
      }
    } else {
      // Vertical swipe
      if (dy > 30) {
        changeDirection(Direction.DOWN);
      } else if (dy < -30) {
        changeDirection(Direction.UP);
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
          changeDirection(Direction.UP);
          break;
        case 'ArrowDown':
          e.preventDefault(); // Prevent page scrolling
          changeDirection(Direction.DOWN);
          break;
        case 'ArrowLeft':
          e.preventDefault(); // Prevent page scrolling
          changeDirection(Direction.LEFT);
          break;
        case 'ArrowRight':
          e.preventDefault(); // Prevent page scrolling
          changeDirection(Direction.RIGHT);
          break;
        case ' ':
          e.preventDefault(); // Prevent page scrolling/jumping
          togglePause();
          break;
        // WASD controls for alternative input
        case 'w':
        case 'W':
          changeDirection(Direction.UP);
          break;
        case 's':
        case 'S':
          changeDirection(Direction.DOWN);
          break;
        case 'a':
        case 'A':
          changeDirection(Direction.LEFT);
          break;
        case 'd':
        case 'D':
          changeDirection(Direction.RIGHT);
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

  // Set up bullet movement loop
  useEffect(() => {
    if (settings.gameMode !== GameMode.GUNS) return;

    const startBulletLoop = () => {
      if (bulletLoopRef.current) {
        clearInterval(bulletLoopRef.current);
      }
      
      if (isActive && !isPaused) {
        // Bullets move faster than the snake
        bulletLoopRef.current = window.setInterval(() => {
          moveBullets();
        }, gameSpeed / BULLET_SPEED);
      }
    };

    startBulletLoop();
    
    return () => {
      if (bulletLoopRef.current) {
        clearInterval(bulletLoopRef.current);
        bulletLoopRef.current = null;
      }
    };
  }, [isActive, isPaused, gameSpeed, settings.gameMode, moveBullets]);

  // Set up keyboard controls for shooting
  useEffect(() => {
    if (settings.gameMode !== GameMode.GUNS) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only process key events if the game is active, not over, and has a gun
      if (gameState.isGameOver || !isActive || !gameState.hasGun) return;
      
      if (e.key === 'f' || e.key === 'F' || e.key === ' ') {
        e.preventDefault(); // Prevent page scrolling/jumping
        shoot();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isGameOver, isActive, gameState.hasGun, settings.gameMode, shoot]);

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
    // Export shoot function for UI controls
    shoot: settings.gameMode === GameMode.GUNS ? shoot : undefined,
  };
}; 