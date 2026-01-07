
import { SlemmingState, SkillType, Point } from '../types';
import { WALK_SPEED, GRAVITY, MAX_FALL_DISTANCE, SLEMMING_WIDTH, SLEMMING_HEIGHT } from '../constants';

export class Slemming {
  id: string;
  x: number;
  y: number;
  direction: 1 | -1 = 1;
  state: SlemmingState = SlemmingState.FALLING;
  skills: Set<SkillType> = new Set();
  fallDistance: number = 0;
  countdown: number | null = null;
  actionProgress: number = 0;
  isDead: boolean = false;
  isExited: boolean = false;

  constructor(x: number, y: number) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.x = x;
    this.y = y;
  }

  update(
    terrainData: Uint8ClampedArray,
    width: number,
    height: number,
    exitPos: Point,
    allSlemmings: Slemming[],
    onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void
  ) {
    if (this.isDead || this.isExited) return;

    // Check exit collision
    const dx = this.x - exitPos.x;
    const dy = this.y - exitPos.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 15 && this.state !== SlemmingState.FALLING) {
      this.isExited = true;
      return;
    }

    // Handle Bomber countdown
    if (this.countdown !== null) {
      this.countdown -= 0.016;
      if (this.countdown <= 0) {
        this.explode(onTerrainChange);
        return;
      }
    }

    switch (this.state) {
      case SlemmingState.FALLING:
      case SlemmingState.FLOATING:
        this.handleFalling(terrainData, width, height);
        break;
      case SlemmingState.WALKING:
        this.handleWalking(terrainData, width, height, allSlemmings, onTerrainChange);
        break;
      case SlemmingState.BLOCKING:
        // Stand still, direct others
        break;
      case SlemmingState.BUILDING:
        this.handleBuilding(terrainData, width, height, onTerrainChange);
        break;
      case SlemmingState.SHRUGGING:
        this.handleShrugging();
        break;
      case SlemmingState.DIGGING:
        this.handleDigging(onTerrainChange, terrainData, width);
        break;
      case SlemmingState.BASHING:
        this.handleBashing(terrainData, width, onTerrainChange);
        break;
      case SlemmingState.MINING:
        this.handleMining(terrainData, width, onTerrainChange);
        break;
      case SlemmingState.CLIMBING:
        this.handleClimbing(terrainData, width, height);
        break;
    }
  }

  private isSolid(x: number, y: number, terrainData: Uint8ClampedArray, width: number): boolean {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= width || iy < 0) return false;
    // Map bounds check
    if (iy >= 398) return true; // Solid floor at bottom

    const index = (iy * width + ix) * 4;
    return terrainData[index + 3] > 128; // Alpha channel check for terrain
  }

  private handleFalling(terrainData: Uint8ClampedArray, width: number, height: number) {
    const fallSpeed = this.state === SlemmingState.FLOATING ? 1.0 : 2.0;
    const nextY = this.y + fallSpeed;

    // Check multiple points at bottom for collision
    const hit = this.isSolid(this.x, nextY, terrainData, width) ||
      this.isSolid(this.x - 2, nextY, terrainData, width) ||
      this.isSolid(this.x + 2, nextY, terrainData, width);

    if (hit) {
      if (this.fallDistance > MAX_FALL_DISTANCE && this.state !== SlemmingState.FLOATING) {
        this.isDead = true;
      } else {
        this.state = SlemmingState.WALKING;
        this.fallDistance = 0;
        // Snap to top of solid
        while (this.isSolid(this.x, this.y, terrainData, width) && this.y > 0) {
          this.y -= 1;
        }
      }
    } else {
      this.y = nextY;
      this.fallDistance += fallSpeed;
      if (this.y > height) this.isDead = true;
    }
  }

  private handleWalking(
    terrainData: Uint8ClampedArray,
    width: number,
    height: number,
    allSlemmings: Slemming[],
    onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void
  ) {
    // Check if we should start falling
    if (!this.isSolid(this.x, this.y + 2, terrainData, width) &&
      !this.isSolid(this.x - 2, this.y + 2, terrainData, width) &&
      !this.isSolid(this.x + 2, this.y + 2, terrainData, width)) {
      this.state = this.skills.has(SkillType.FLOATER) ? SlemmingState.FLOATING : SlemmingState.FALLING;
      return;
    }

    // Horizontal Movement
    const nextX = this.x + (this.direction * WALK_SPEED);

    // Blocker Check
    for (const s of allSlemmings) {
      if (s !== this && s.state === SlemmingState.BLOCKING) {
        if (Math.abs(s.x - this.x) < 8 && Math.abs(s.y - this.y) < 5) {
          this.direction *= -1;
          this.x += this.direction * 3;
          return;
        }
      }
    }

    // Step-up logic (up to 6px)
    let stepUp = 0;
    while (stepUp <= 6 && this.isSolid(nextX, this.y - stepUp, terrainData, width)) {
      stepUp++;
    }

    if (stepUp <= 6) {
      this.x = nextX;
      this.y -= stepUp;
      // Gravity adjustment: stay glued to slopes
      if (!this.isSolid(this.x, this.y + 1, terrainData, width)) {
        this.y += 1;
      }
    } else {
      // Hit a wall
      if (this.skills.has(SkillType.CLIMBER)) {
        this.state = SlemmingState.CLIMBING;
      } else {
        this.direction *= -1;
      }
    }
  }

  private handleClimbing(terrainData: Uint8ClampedArray, width: number, height: number) {
    const nextY = this.y - 1.0;
    const aheadX = this.x + this.direction * 3;

    // Check if there is still a wall to climb
    if (!this.isSolid(aheadX, nextY, terrainData, width) && !this.isSolid(aheadX, this.y, terrainData, width)) {
      // Reached the top!
      this.y = nextY;
      this.x += this.direction * 4;
      this.state = SlemmingState.WALKING;
    } else if (this.y < 0) {
      this.isDead = true;
    } else {
      this.y = nextY;
    }
  }

  private handleBuilding(terrainData: Uint8ClampedArray, width: number, height: number, onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void) {
    this.actionProgress++;
    // Building animation logic
    if (this.actionProgress % 20 === 0) {
      const stepX = this.x + (this.direction * 8);
      const stepY = this.y;
      onTerrainChange(stepX, stepY, 5, false);
      this.x += this.direction * 4;
      this.y -= 2;

      if (this.actionProgress > 20 * 12) {
        this.state = SlemmingState.SHRUGGING;
        this.actionProgress = 0;
      }
    }
  }

  private handleShrugging() {
    this.actionProgress++;
    if (this.actionProgress > 120) { // 2 seconds (assuming 60fps)
      this.state = SlemmingState.WALKING;
      this.actionProgress = 0;
    }
  }

  private handleDigging(onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void, terrainData: Uint8ClampedArray, width: number) {
    this.actionProgress++;

    // Check if we ran out of ground (dug through)
    if (!this.isSolid(this.x, this.y + 5, terrainData, width)) {
      this.state = SlemmingState.FALLING;
      this.actionProgress = 0;
      return;
    }

    if (this.actionProgress % 15 === 0) {
      onTerrainChange(this.x, this.y + 4, 10, true);
      this.y += 3;
    }
  }

  private handleBashing(terrainData: Uint8ClampedArray, width: number, onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void) {
    this.actionProgress++;
    if (this.actionProgress % 10 === 0) {
      const checkX = this.x + this.direction * 6;
      // Stop if we hit air
      if (!this.isSolid(checkX, this.y, terrainData, width)) {
        this.state = SlemmingState.WALKING;
        return;
      }
      onTerrainChange(checkX, this.y - 2, 12, true);
      this.x += this.direction * 2;
    }
    if (this.actionProgress > 600) this.state = SlemmingState.WALKING;
  }

  private handleMining(terrainData: Uint8ClampedArray, width: number, onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void) {
    this.actionProgress++;
    if (this.actionProgress % 12 === 0) {
      const checkX = this.x + this.direction * 6;
      const checkY = this.y + 4;
      onTerrainChange(checkX, checkY, 12, true);
      this.x += this.direction * 2;
      this.y += 1;
    }
    if (this.actionProgress > 600) this.state = SlemmingState.WALKING;
  }

  private explode(onTerrainChange: (x: number, y: number, radius: number, remove: boolean) => void) {
    onTerrainChange(this.x, this.y, 25, true);
    this.isDead = true;
  }

  applySkill(skill: SkillType): boolean {
    switch (skill) {
      case SkillType.CLIMBER:
        this.skills.add(SkillType.CLIMBER);
        return true;
      case SkillType.FLOATER:
        this.skills.add(SkillType.FLOATER);
        return true;
      case SkillType.BOMBER:
        if (this.countdown === null) {
          this.countdown = 5;
          return true;
        }
        break;
      case SkillType.BLOCKER:
        if (this.state === SlemmingState.WALKING) {
          this.state = SlemmingState.BLOCKING;
          return true;
        }
        break;
      case SkillType.BUILDER:
        if (this.state === SlemmingState.WALKING || this.state === SlemmingState.SHRUGGING) {
          this.state = SlemmingState.BUILDING;
          this.actionProgress = 0;
          return true;
        }
        break;
        break;
      case SkillType.DIGGER:
        if (this.state === SlemmingState.WALKING) {
          this.state = SlemmingState.DIGGING;
          this.actionProgress = 0;
          return true;
        }
        break;
      case SkillType.WALKER:
        // Walker: Revert to walking from almost any state
        if (this.state !== SlemmingState.FALLING &&
          this.state !== SlemmingState.EXITED &&
          this.state !== SlemmingState.DEAD) {

          this.state = SlemmingState.WALKING;
          this.actionProgress = 0;
          this.countdown = null; // Cancel bomber if active? maybe not standard but helpful. Standard walker doesn't usually cancel bomber.
          // Let's stick to state reversion.
          return true;
        }
        break;
      case SkillType.BASHER:
        if (this.state === SlemmingState.WALKING) {
          this.state = SlemmingState.BASHING;
          this.actionProgress = 0;
          return true;
        }
        break;
      case SkillType.MINER:
        if (this.state === SlemmingState.WALKING) {
          this.state = SlemmingState.MINING;
          this.actionProgress = 0;
          return true;
        }
        break;
    }
    return false;
  }
}
