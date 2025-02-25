import React from 'react';
import { GameScreen } from '../types/game';
import './GameOver.css';

interface GameOverProps {
  score: number;
  highScore: number;
  onScreenChange: (screen: GameScreen) => void;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  highScore,
  onScreenChange,
  onRestart,
}) => {
  const isNewHighScore = score > highScore;

  return (
    <div className="game-over">
      <h2>Game Over!</h2>
      <div className="score-container">
        <div className="final-score">Score: {score}</div>
        {isNewHighScore && (
          <div className="new-high-score">New High Score!</div>
        )}
        <div className="high-score">High Score: {highScore}</div>
      </div>
      <div className="game-over-buttons">
        <button onClick={onRestart}>
          Play Again
        </button>
        <button onClick={() => onScreenChange(GameScreen.MENU)}>
          Main Menu
        </button>
      </div>
    </div>
  );
}; 