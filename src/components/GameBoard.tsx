import React from 'react';
import { Position } from '../types/game';
import './GameBoard.css';

interface GameBoardProps {
  snake: Position[];
  food: Position;
  gridSize: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ snake, food, gridSize }) => {
  const cells = Array(gridSize).fill(null).map((_, row) =>
    Array(gridSize).fill(null).map((_, col) => {
      const isSnake = snake.some(segment => segment.x === col && segment.y === row);
      const isFood = food.x === col && food.y === row;
      const isHead = snake[0].x === col && snake[0].y === row;

      return (
        <div
          key={`${row}-${col}`}
          className={`cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''} ${isHead ? 'head' : ''}`}
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
        width: '500px',
        height: '500px',
      }}
    >
      {cells}
    </div>
  );
}; 