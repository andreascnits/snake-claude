import React, { useEffect, useState } from 'react';
import { Position } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  snake: Position[];
  food: Position;
  gridSize: number;
  gameSpeed: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ snake, food, gridSize, gameSpeed }) => {
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

      return (
        <div
          key={`${row}-${col}`}
          className={`cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''} ${isHead ? 'head' : ''}`}
          style={{
            transition: `background-color ${transitionDuration}ms ease-in-out`,
          }}
        />
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