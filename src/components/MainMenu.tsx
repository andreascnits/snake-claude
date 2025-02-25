import React from 'react';
import { GameScreen, GameSettings, GameMode } from '../types/game';
import './MainMenu.css';

interface MainMenuProps {
  onScreenChange: (screen: GameScreen) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  highScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onScreenChange,
  settings,
  onSettingsChange,
  highScore,
}) => {
  // Handler for starting classic mode
  const startClassicGame = () => {
    onSettingsChange({ ...settings, gameMode: GameMode.CLASSIC });
    onScreenChange(GameScreen.GAME);
  };

  // Handler for starting guns mode
  const startGunsGame = () => {
    onSettingsChange({ ...settings, gameMode: GameMode.GUNS });
    onScreenChange(GameScreen.GAME);
  };

  return (
    <div className="main-menu">
      <h1>Snake Game</h1>
      <div className="high-score">High Score: {highScore}</div>
      <div className="menu-buttons">
        <button onClick={startClassicGame} className="classic-button">
          Classic Snake
        </button>
        <button onClick={startGunsGame} className="guns-button">
          Snake with Guns 🔫
        </button>
        <button onClick={() => onScreenChange(GameScreen.OPTIONS)}>
          Options
        </button>
      </div>
      <div className="quick-settings">
        <label>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) =>
              onSettingsChange({ ...settings, soundEnabled: e.target.checked })
            }
          />
          Sound
        </label>
      </div>
    </div>
  );
}; 