import React, { useEffect, useState } from 'react';
import { Position, GameState, GameMode } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  snake: Position[];
  food: Position;
  gridSize: number;
  gameSpeed: number;
  gameState: GameState;
  gameMode: GameMode;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  snake, 
  food, 
  gridSize, 
  gameSpeed,
  gameState,
  gameMode
}) => {
  const [boardSize, setBoardSize] = useState(Math.min(500, window.innerWidth - 40));
  // Calculate transition duration based on game speed
  const transitionDuration = Math.min(gameSpeed * 0.8, 120); // Cap at 120ms for very fast speeds

  // Update board size on window resize
  useEffect(() => {
    const handleResize = () => {
      // Calculate responsive board size based on viewport
      // Subtract padding and leave some space for other elements
      const maxSize = Math.min(
        window.innerWidth - 40, 
        window.innerHeight - 150
      );
      setBoardSize(Math.min(500, maxSize));
    };

    // Set initial size
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cells = Array(gridSize).fill(null).map((_, row) =>
    Array(gridSize).fill(null).map((_, col) => {
      const isSnake = snake.some(segment => segment.x === col && segment.y === row);
      const isFood = food.x === col && food.y === row;
      const isHead = snake[0].x === col && snake[0].y === row;
      
      // Gun mode specific elements
      const isBullet = gameMode === GameMode.GUNS && 
        gameState.bullets.some(bullet => bullet.position.x === col && bullet.position.y === row);
      const isGunPowerUp = gameMode === GameMode.GUNS && 
        gameState.gunPowerUp?.active && 
        gameState.gunPowerUp.position.x === col && 
        gameState.gunPowerUp.position.y === row;
      const isTarget = gameMode === GameMode.GUNS &&
        gameState.targets.some(target => target.active && target.position.x === col && target.position.y === row);

      let cellClass = 'cell';
      if (isSnake) cellClass += ' snake';
      if (isHead) cellClass += ' head';
      if (isFood) cellClass += ' food';
      if (isBullet) cellClass += ' bullet';
      if (isGunPowerUp) cellClass += ' gun-powerup';
      if (isTarget) cellClass += ' target';

      // Add gun indicator to the snake head if it has a gun
      const hasGun = gameMode === GameMode.GUNS && isHead && gameState.hasGun;

      return (
        <div
          key={`${row}-${col}`}
          className={cellClass}
          style={{
            transition: `background-color ${transitionDuration}ms ease-in-out`,
          }}
        >
          {hasGun && <div className="gun-indicator">🔫</div>}
        </div>
      );
    })
  );

  return (
    <div 
      className="game-board"
      style={{
        display: 'grid',
        gridTemplate: `repeat(${gridSize}, 1fr) / repeat(${gridSize}, 1fr)`,
        gap: '1px',
        background: '#2c3e50',
        padding: '10px',
        borderRadius: '8px',
        width: `${boardSize}px`,
        height: `${boardSize}px`,
      }}
    >
      {cells}
    </div>
  );
}; 