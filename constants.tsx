
import React from 'react';
import { SkillType } from './types';

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 400;
export const PIXEL_SCALE = 2;
export const SLEMMING_WIDTH = 8;
export const SLEMMING_HEIGHT = 10;
export const GRAVITY = 0.25;
export const MAX_FALL_DISTANCE = 60;
export const WALK_SPEED = 0.55;

export const SKILL_ICONS: Record<SkillType, React.ReactNode> = {
  [SkillType.CLIMBER]: <i className="fas fa-mountain"></i>,
  [SkillType.FLOATER]: <i className="fas fa-parachute-box"></i>,
  [SkillType.BOMBER]: <i className="fas fa-bomb"></i>,
  [SkillType.BLOCKER]: <i className="fas fa-hand-paper"></i>,
  [SkillType.BUILDER]: <i className="fas fa-hammer"></i>,
  [SkillType.BASHER]: <i className="fas fa-fist-raised"></i>,
  [SkillType.MINER]: <i className="fas fa-shovel"></i>,
  [SkillType.DIGGER]: <i className="fas fa-arrow-down"></i>,
};

export const SKILL_COLORS: Record<SkillType, string> = {
  [SkillType.CLIMBER]: 'bg-blue-500',
  [SkillType.FLOATER]: 'bg-cyan-400',
  [SkillType.BOMBER]: 'bg-red-600',
  [SkillType.BLOCKER]: 'bg-orange-500',
  [SkillType.BUILDER]: 'bg-yellow-500',
  [SkillType.BASHER]: 'bg-purple-500',
  [SkillType.MINER]: 'bg-indigo-500',
  [SkillType.DIGGER]: 'bg-green-500',
};
