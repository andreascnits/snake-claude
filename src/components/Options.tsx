import React from 'react';
import { GameScreen, GameSettings } from '../types/game';
import './Options.css';

interface OptionsProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onScreenChange: (screen: GameScreen) => void;
}

export const Options: React.FC<OptionsProps> = ({
  settings,
  onSettingsChange,
  onScreenChange,
}) => {
  return (
    <div className="options-screen">
      <h2>Game Options</h2>
      <div className="options-list">
        <label className="option-item">
          <span>Sound Effects</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) =>
              onSettingsChange({ ...settings, soundEnabled: e.target.checked })
            }
          />
        </label>
        <label className="option-item">
          <span>Wall Collision</span>
          <input
            type="checkbox"
            checked={settings.wallsEnabled}
            onChange={(e) =>
              onSettingsChange({ ...settings, wallsEnabled: e.target.checked })
            }
          />
        </label>
      </div>
      <button 
        className="back-button"
        onClick={() => onScreenChange(GameScreen.MENU)}
      >
        Back to Menu
      </button>
    </div>
  );
}; 