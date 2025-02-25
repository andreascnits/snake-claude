import React from 'react';
import { GameScreen, GameSettings } from '../types/game';
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
  return (
    <div className="main-menu">
      <h1>Snake Game</h1>
      <div className="high-score">High Score: {highScore}</div>
      <div className="menu-buttons">
        <button onClick={() => onScreenChange(GameScreen.GAME)}>
          Start Game
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