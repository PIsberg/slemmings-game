
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Slemming } from '../engine/Slemming';
import { GAME_WIDTH, GAME_HEIGHT, PIXEL_SCALE, SKILL_COLORS } from '../constants';
import { Level, GameState, SkillType, SlemmingState } from '../types';

interface Props {
  level: Level;
  gameState: GameState;
  gameSpeed: number;
  onUpdateState: (updates: Partial<GameState>) => void;
  onSlemmingExited: () => void;
  onSlemmingDied: () => void;
  onSkillUsed: (skill: SkillType) => void;
}

const GameCanvas: React.FC<Props> = ({ level, gameState, gameSpeed = 1, onUpdateState, onSlemmingExited, onSlemmingDied, onSkillUsed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement>(null);

  const slemmingsRef = useRef<Slemming[]>([]);
  const requestRef = useRef<number>(null);
  const lastSpawnTime = useRef<number>(0);
  const spawnCountRef = useRef<number>(0);

  const mousePosRef = useRef<{ x: number, y: number } | null>(null);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Initialize terrain based on layout type
  useEffect(() => {
    const canvas = terrainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.fillStyle = level.terrainColor;

    switch (level.layoutType) {
      case 'PIT':
        if (level.id === 1) {
          // Level 1: "The Blockade" Special Layout (Safe Drop < 60px)
          ctx.fillRect(100, 300, 300, 15); // Top Platform (y=300)
          ctx.fillRect(0, 350, 640, 20); // Bottom Floor (y=350, diff=50 which is SAFE)
          ctx.fillRect(0, 300, 20, 50); // Left Wall bouncer
        } else {
          // Standard Pit
          ctx.fillRect(50, 150, 200, 15);
          ctx.fillRect(300, 220, 150, 15);
          ctx.fillRect(450, 260, 150, 15);
          ctx.fillRect(50, 350, 540, 20);
          ctx.fillRect(240, 150, 10, 80);
          ctx.fillRect(530, 260, 10, 100);
        }
        break;
      case 'STAIRS':
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(50 + (i * 80), 150 + (i * 40), 100, 15);
        }
        ctx.fillRect(50, 360, 540, 20);
        break;
      case 'DIVIDE':
        if (level.id === 3) {
          // Level 3: "Step Up" - Long walk then build up (Builder needed at end)
          ctx.fillRect(20, 350, 480, 20); // Long Floor (y=350)
          ctx.fillRect(500, 250, 120, 20); // High Exit Platform (y=250)
          // No walls, just a height difference
        } else {
          ctx.fillRect(20, 150, 200, 20); // Spawn ledge

          // Level 3 Tuning: Smaller gap (100px instead of 200px)
          const gapSize = level.id === 3 ? 100 : 200; // Level 3 uses special logic above now, but keeping safe fallback
          const bridgeStart = 220 + gapSize;

          ctx.fillRect(bridgeStart, 150, 200, 20); // Far ledge
          ctx.fillRect(20, 350, 600, 30);  // Bottom
          ctx.fillRect(210, 150, 10, 200); // Left wall
          ctx.fillRect(bridgeStart - 10, 150, 10, 200); // Right wall
        }
        break;
      case 'PILLARS':
        ctx.fillRect(20, 150, 600, 15);
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(100 + (i * 120), 165, 30, 185);
        }
        ctx.fillRect(20, 350, 600, 30);
        break;
    }

    slemmingsRef.current = [];
    spawnCountRef.current = 0;
    lastSpawnTime.current = 0;
  }, [level.id, level.layoutType]);

  const modifyTerrain = useCallback((x: number, y: number, radius: number, remove: boolean) => {
    const canvas = terrainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (remove) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = level.terrainColor;
      ctx.beginPath();
      ctx.rect(x - radius, y - 1, radius * 2, 3);
      ctx.fill();
    }
    ctx.restore();
  }, [level.terrainColor]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / (rect.width / GAME_WIDTH);
    const y = (e.clientY - rect.top) / (rect.height / GAME_HEIGHT);
    mousePosRef.current = { x, y };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const currentGS = gameStateRef.current;
    if (!currentGS.activeSkill) return;

    if (!mousePosRef.current) return;
    const { x, y } = mousePosRef.current;

    const target = slemmingsRef.current.find(s =>
      !s.isDead && !s.isExited &&
      Math.abs(s.x - x) < 15 && Math.abs(s.y - y) < 15
    );

    if (target) {
      if (currentGS.activeSkill) {
        if (target.applySkill(currentGS.activeSkill)) {
          onSkillUsed(currentGS.activeSkill);
        }
      } else {
        // Unblock: click blocker to resume walking
        if (target.state === SlemmingState.BLOCKING) {
          target.state = SlemmingState.WALKING;
        }
      }
    }
  };

  const update = (time: number) => {
    const currentGS = gameStateRef.current;
    if (currentGS.isPaused) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const canvas = canvasRef.current;
    const terrainCanvas = terrainCanvasRef.current;
    if (!canvas || !terrainCanvas) return;
    const ctx = canvas.getContext('2d');
    const tCtx = terrainCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || !tCtx) return;

    ctx.fillStyle = '#111118';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.drawImage(terrainCanvas, 0, 0);


    // Speed Loop
    // Speed Loop
    const terrainData = tCtx.getImageData(0, 0, GAME_WIDTH, GAME_HEIGHT).data;

    if (!gameSpeed || gameSpeed < 1) console.warn("Invalid gameSpeed:", gameSpeed);

    for (let i = 0; i < (gameSpeed || 1); i++) {
      // Spawn Logic (Frame-based for FF compatibility)
      // Convert release rate logic to frame countdown (assuming ~60fps, 16ms per frame)
      // Old Formula: (105 - rate) * 12 ms
      // New: ((105 - rate) * 12) / 16 frames
      const spawnDelayFrames = Math.max(10, ((105 - currentGS.releaseRate) * 12) / 16);

      // We use lastSpawnTime ref as a "frames since last spawn" counter now
      // Initialize/Reset handling is implied: it increments until threshold
      lastSpawnTime.current += 1; // Increment by 1 tick

      if (spawnCountRef.current < level.totalSlemmings && lastSpawnTime.current > spawnDelayFrames) {
        const newSlemming = new Slemming(level.spawnPos.x, level.spawnPos.y - 10);
        slemmingsRef.current.push(newSlemming);
        spawnCountRef.current++;
        lastSpawnTime.current = 0; // Reset counter
        onUpdateState({ released: spawnCountRef.current });
      }

      slemmingsRef.current.forEach(s => {
        if (s.isDead || s.isExited) return;
        s.update(terrainData, GAME_WIDTH, GAME_HEIGHT, level.exitPos, slemmingsRef.current, modifyTerrain);

        if (s.isExited) {
          onSlemmingExited();
        } else if (s.isDead) {
          onSlemmingDied();
        }
      });
    }

    // DRAWING (Once per frame)

    // Find target (for reticle)
    let targetId: string | null = null;
    if (mousePosRef.current) {
      const { x, y } = mousePosRef.current;
      const potentialTarget = slemmingsRef.current.find(s =>
        !s.isDead && !s.isExited &&
        Math.abs(s.x - x) < 15 && Math.abs(s.y - y) < 15
      );
      if (potentialTarget) targetId = potentialTarget.id;
    }

    // ... (exit and spawn drawing)
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(level.spawnPos.x - 20, level.spawnPos.y - 15, 40, 10);

    const pulse = Math.sin(time / 150) * 0.2 + 0.8;
    ctx.shadowBlur = 15 * pulse;
    ctx.shadowColor = '#00f2ff';
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath();
    ctx.ellipse(level.exitPos.x, level.exitPos.y, 14 * pulse, 20 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(level.exitPos.x, level.exitPos.y, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Slemmings
    slemmingsRef.current.forEach(s => {
      if (s.isDead || s.isExited) return;
      ctx.save();
      // ... (draw logic)
      ctx.translate(s.x, s.y);

      // Draw Target Reticle
      if (s.id === targetId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        const size = 10 + Math.sin(time / 100) * 2;
        ctx.strokeRect(-size, -size - 5, size * 2, size * 2);

        // Draw skill icon cursor hint? logic could go here
      }

      const squish = Math.sin(time / 80 + s.x) * 1.2;
      ctx.fillStyle = '#4eff00';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6 + squish, 7 - squish, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      const faceDir = s.direction > 0 ? 2 : -4;
      ctx.fillRect(faceDir, -4, 2, 2);
      ctx.fillRect(faceDir + (s.direction > 0 ? 2 : -2), -4, 2, 2);

      if (s.state === SlemmingState.SHRUGGING) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#00FFFF';
        ctx.fillText('?', 2, -10);
      }

      if (s.countdown !== null) {
        ctx.fillStyle = '#ff3300';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(s.countdown).toString(), 0, -15);
      }
      if (s.state === SlemmingState.BLOCKING) {
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -10, 20, 20);
      }
      if (s.state === SlemmingState.FLOATING) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.bezierCurveTo(-10, -20, 10, -20, 10, -8);
        ctx.stroke();
      }
      ctx.restore();
    });

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [level.id]);

  // Cursor logic
  const cursorClass = gameState.activeSkill
    ? 'cursor-crosshair'
    : (mousePosRef.current && slemmingsRef.current.some(s =>
      !s.isDead && !s.isExited && s.state === SlemmingState.BLOCKING &&
      Math.abs(s.x - mousePosRef.current!.x) < 15 && Math.abs(s.y - mousePosRef.current!.y) < 15
    )) ? 'cursor-pointer' : 'cursor-default';

  return (
    <div className="relative border-4 border-zinc-700 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mousePosRef.current = null; }}
        className={`w-full h-auto max-h-[70vh] object-contain ${cursorClass}`}
      />
      {gameState.activeSkill && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-4 py-1 rounded-full text-xs font-bold border border-white/20 pointer-events-none animate-pulse">
          SKILL ACTIVE: {gameState.activeSkill}
        </div>
      )}
      <canvas
        ref={terrainCanvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="hidden"
      />
    </div>
  );
};

export default GameCanvas;
