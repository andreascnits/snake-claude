import { useState, useEffect } from 'react'
import { GameScreen, GameSettings } from './types/game'
import { useSnakeGame } from './hooks/useSnakeGame'
import { useGameAudio } from './hooks/useGameAudio'
import { GameBoard } from './components/GameBoard'
import { MainMenu } from './components/MainMenu'
import { Options } from './components/Options'
import { GameOver } from './components/GameOver'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>(GameScreen.MENU)
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    wallsEnabled: true,
  })

  const {
    gameState,
    isPaused,
    resetGame,
    togglePause,
    GRID_SIZE,
  } = useSnakeGame(settings)

  // Initialize audio
  useGameAudio(settings.soundEnabled);

  useEffect(() => {
    if (gameState.isGameOver) {
      setCurrentScreen(GameScreen.GAME_OVER)
    }
  }, [gameState.isGameOver])

  const handleStartGame = () => {
    resetGame();
    setCurrentScreen(GameScreen.GAME);
  };

  const handleRestart = () => {
    resetGame()
    setCurrentScreen(GameScreen.GAME)
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case GameScreen.MENU:
        return (
          <MainMenu
            onScreenChange={(screen) => {
              if (screen === GameScreen.GAME) {
                handleStartGame();
              } else {
                setCurrentScreen(screen);
              }
            }}
            settings={settings}
            onSettingsChange={setSettings}
            highScore={gameState.highScore}
          />
        )
      case GameScreen.OPTIONS:
        return (
          <Options
            settings={settings}
            onSettingsChange={setSettings}
            onScreenChange={setCurrentScreen}
          />
        )
      case GameScreen.GAME:
        return (
          <div className="game-container">
            <div className="game-header">
              <div className="score">Score: {gameState.score}</div>
              <div className="high-score">High Score: {gameState.highScore}</div>
              <button className="pause-button" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
            <GameBoard
              snake={gameState.snake}
              food={gameState.food}
              gridSize={GRID_SIZE}
            />
            {isPaused && (
              <div className="pause-overlay">
                <h2>Paused</h2>
                <button onClick={togglePause}>Resume</button>
                <button onClick={() => setCurrentScreen(GameScreen.MENU)}>
                  Main Menu
                </button>
              </div>
            )}
          </div>
        )
      case GameScreen.GAME_OVER:
        return (
          <GameOver
            score={gameState.score}
            highScore={gameState.highScore}
            onScreenChange={setCurrentScreen}
            onRestart={handleRestart}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app">
      {renderCurrentScreen()}
    </div>
  )
}

export default App
