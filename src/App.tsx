import { useState, useEffect, useCallback } from 'react'
import { GameScreen, GameSettings, GameMode } from './types/game'
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
    wallsEnabled: false,
    gameMode: GameMode.CLASSIC,
  })

  const {
    gameState,
    isPaused,
    resetGame,
    togglePause,
    GRID_SIZE,
    isActive,
    setIsActive,
    gameSpeed,
    shoot,
  } = useSnakeGame(settings)

  // Initialize audio
  const { initializeAudio } = useGameAudio(settings.soundEnabled);

  // Update game active state based on current screen
  useEffect(() => {
    // Only set the game to active when on the GAME screen
    if (currentScreen === GameScreen.GAME) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [currentScreen, setIsActive]);

  useEffect(() => {
    if (gameState.isGameOver && isActive) {
      setCurrentScreen(GameScreen.GAME_OVER)
    }
  }, [gameState.isGameOver, isActive])

  const handleStartGame = () => {
    // Initialize audio when user starts the game
    initializeAudio();
    resetGame();
    setCurrentScreen(GameScreen.GAME);
  };

  const handleRestart = () => {
    resetGame()
    setCurrentScreen(GameScreen.GAME)
  }

  // Calculate difficulty level based on game speed
  const getDifficultyLevel = () => {
    if (gameSpeed <= 80) return 'Expert';
    if (gameSpeed <= 110) return 'Hard';
    if (gameSpeed <= 130) return 'Medium';
    return 'Easy';
  }

  // Handle any user interaction to initialize audio
  const handleUserInteraction = useCallback(() => {
    initializeAudio();
  }, [initializeAudio]);

  useEffect(() => {
    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [handleUserInteraction]);

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
              <div className="score-container">
                <div className="score">Score: {gameState.score}</div>
                <div className="high-score">High Score: {gameState.highScore}</div>
              </div>
              <div className="game-info">
                <div className="difficulty">Level: {getDifficultyLevel()}</div>
                <div className="speed">Speed: {Math.round(1000 / gameSpeed)} fps</div>
                {settings.gameMode === GameMode.GUNS && gameState.hasGun && (
                  <div className="ammo">Ammo: {gameState.ammo}</div>
                )}
              </div>
              <button className="pause-button" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            </div>
            <div className="game-controls-hint">
              {window.matchMedia('(pointer: coarse)').matches ? 
                'Swipe to change direction' : 
                `Use Arrow Keys or WASD to move${settings.gameMode === GameMode.GUNS ? ', F to shoot' : ''}`}
            </div>
            {settings.gameMode === GameMode.GUNS && (
              <div className="game-mode-hint">
                Collect gun power-ups 🔫 and shoot targets ✚ for extra points!
              </div>
            )}
            <GameBoard
              snake={gameState.snake}
              food={gameState.food}
              gridSize={GRID_SIZE}
              gameSpeed={gameSpeed}
              gameState={gameState}
              gameMode={settings.gameMode}
            />
            {settings.gameMode === GameMode.GUNS && (
              <div className="shoot-button-container">
                <button 
                  className="shoot-button" 
                  onClick={() => gameState.hasGun && shoot && shoot()}
                  disabled={!gameState.hasGun || gameState.ammo <= 0}
                >
                  SHOOT 🔫
                </button>
              </div>
            )}
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
