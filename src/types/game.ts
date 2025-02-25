export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Position = {
  x: number;
  y: number;
};

export type GameSettings = {
  soundEnabled: boolean;
  wallsEnabled: boolean;
};

export type GameState = {
  snake: Position[];
  food: Position;
  direction: Direction;
  isGameOver: boolean;
  score: number;
  highScore: number;
};

export enum GameScreen {
  MENU = 'MENU',
  GAME = 'GAME',
  OPTIONS = 'OPTIONS',
  GAME_OVER = 'GAME_OVER'
} 