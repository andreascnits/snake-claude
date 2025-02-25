export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Position {
  x: number;
  y: number;
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  GUNS = 'GUNS'
}

export interface GameSettings {
  soundEnabled: boolean;
  wallsEnabled: boolean;
  gameMode: GameMode;
}

export interface Bullet {
  position: Position;
  direction: Direction;
  active: boolean;
}

export interface GunPowerUp {
  position: Position;
  active: boolean;
  ammo: number;
}

export interface Target {
  position: Position;
  active: boolean;
  health: number;
  points: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  isGameOver: boolean;
  score: number;
  highScore: number;
  // Gun-related properties (only used in GUNS mode)
  hasGun: boolean;
  ammo: number;
  bullets: Bullet[];
  gunPowerUp: GunPowerUp | null;
  targets: Target[];
}

export enum GameScreen {
  MENU = 'MENU',
  GAME = 'GAME',
  OPTIONS = 'OPTIONS',
  GAME_OVER = 'GAME_OVER',
} 