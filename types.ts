
export enum SkillType {
  CLIMBER = 'CLIMBER',
  FLOATER = 'FLOATER',
  BOMBER = 'BOMBER',
  BLOCKER = 'BLOCKER',
  BUILDER = 'BUILDER',
  BASHER = 'BASHER',
  MINER = 'MINER',
  DIGGER = 'DIGGER'
}

export type Point = { x: number; y: number };

export enum SlemmingState {
  WALKING = 'WALKING',
  FALLING = 'FALLING',
  CLIMBING = 'CLIMBING',
  FLOATING = 'FLOATING',
  BOMBER_COUNTDOWN = 'BOMBER_COUNTDOWN',
  BLOCKING = 'BLOCKING',
  BUILDING = 'BUILDING',
  BASHING = 'BASHING',
  MINING = 'MINING',
  DIGGING = 'DIGGING',
  DEAD = 'DEAD',
  EXITED = 'EXITED'
}

export interface Level {
  id: number;
  name: string;
  spawnRate: number;
  totalSlemmings: number;
  toSave: number;
  timeLimit: number;
  terrainColor: string;
  skills: Record<SkillType, number>;
  spawnPos: Point;
  exitPos: Point;
  layoutType: 'PIT' | 'STAIRS' | 'DIVIDE' | 'PILLARS';
  terrainMap?: string; 
}

export interface GameState {
  released: number;
  saved: number;
  dead: number;
  timeLeft: number;
  releaseRate: number;
  activeSkill: SkillType | null;
  skillsLeft: Record<SkillType, number>;
  isPaused: boolean;
  gameStatus: 'MENU' | 'PLAYING' | 'WON' | 'LOST';
}
