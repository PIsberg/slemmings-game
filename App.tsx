
import React, { useState, useEffect } from 'react';
import { SkillType, GameState, Level } from './types';
import { SKILL_ICONS, SKILL_COLORS } from './constants';
import GameCanvas from './components/GameCanvas';
import { getSlimeLordAdvice } from './services/adviceService';

const LEVELS: Level[] = [
  {
    id: 1,
    name: "The First Ooze",
    spawnRate: 40,
    totalSlemmings: 20,
    toSave: 10,
    timeLimit: 300,
    terrainColor: '#4d2a15',
    spawnPos: { x: 100, y: 140 },
    exitPos: { x: 500, y: 340 },
    layoutType: 'PIT',
    skills: {
      [SkillType.CLIMBER]: 5, [SkillType.FLOATER]: 5, [SkillType.BOMBER]: 5,
      [SkillType.BLOCKER]: 5, [SkillType.BUILDER]: 10, [SkillType.BASHER]: 5,
      [SkillType.MINER]: 5, [SkillType.DIGGER]: 5,
    },
  },
  {
    id: 2,
    name: "Slime Steps",
    spawnRate: 50,
    totalSlemmings: 25,
    toSave: 15,
    timeLimit: 240,
    terrainColor: '#2a4d15',
    spawnPos: { x: 80, y: 140 },
    exitPos: { x: 500, y: 350 },
    layoutType: 'STAIRS',
    skills: {
      [SkillType.CLIMBER]: 10, [SkillType.FLOATER]: 5, [SkillType.BOMBER]: 5,
      [SkillType.BLOCKER]: 5, [SkillType.BUILDER]: 15, [SkillType.BASHER]: 5,
      [SkillType.MINER]: 5, [SkillType.DIGGER]: 5,
    },
  },
  {
    id: 3,
    name: "The Deep Gorge",
    spawnRate: 35,
    totalSlemmings: 30,
    toSave: 20,
    timeLimit: 360,
    terrainColor: '#152a4d',
    spawnPos: { x: 50, y: 140 },
    exitPos: { x: 550, y: 140 },
    layoutType: 'DIVIDE',
    skills: {
      [SkillType.CLIMBER]: 5, [SkillType.FLOATER]: 10, [SkillType.BOMBER]: 5,
      [SkillType.BLOCKER]: 10, [SkillType.BUILDER]: 30, [SkillType.BASHER]: 5,
      [SkillType.MINER]: 5, [SkillType.DIGGER]: 5,
    },
  },
  {
    id: 4,
    name: "Pillar Ooze",
    spawnRate: 45,
    totalSlemmings: 20,
    toSave: 12,
    timeLimit: 300,
    terrainColor: '#4d154d',
    spawnPos: { x: 50, y: 140 },
    exitPos: { x: 550, y: 340 },
    layoutType: 'PILLARS',
    skills: {
      [SkillType.CLIMBER]: 5, [SkillType.FLOATER]: 5, [SkillType.BOMBER]: 5,
      [SkillType.BLOCKER]: 5, [SkillType.BUILDER]: 10, [SkillType.BASHER]: 15,
      [SkillType.MINER]: 15, [SkillType.DIGGER]: 15,
    },
  }
];

const App: React.FC = () => {
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [gameState, setGameState] = useState<GameState>({
    released: 0,
    saved: 0,
    dead: 0,
    timeLeft: LEVELS[0].timeLimit,
    releaseRate: LEVELS[0].spawnRate,
    activeSkill: null,
    skillsLeft: { ...LEVELS[0].skills },
    isPaused: false,
    gameStatus: 'MENU'
  });

  const [hint, setHint] = useState<string>("Slemmings ready to squish!");

  useEffect(() => {
    if (gameState.gameStatus === 'PLAYING' && !gameState.isPaused) {
      const timer = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 0) return { ...prev, gameStatus: 'LOST' };
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState.gameStatus, gameState.isPaused]);

  useEffect(() => {
    if (gameState.gameStatus === 'PLAYING') {
      getSlimeLordAdvice(level.name, gameState).then(setHint);
    }
  }, [gameState.gameStatus, level.name]);

  const handleSkillUsed = (skill: SkillType) => {
    setGameState(prev => ({
      ...prev,
      skillsLeft: {
        ...prev.skillsLeft,
        [skill]: prev.skillsLeft[skill] - 1
      }
    }));
  };

  const startGame = () => {
    const randomLevel = LEVELS[Math.floor(Math.random() * LEVELS.length)];
    setLevel(randomLevel);
    setGameState({
      gameStatus: 'PLAYING',
      released: 0,
      saved: 0,
      dead: 0,
      timeLeft: randomLevel.timeLimit,
      releaseRate: randomLevel.spawnRate,
      skillsLeft: { ...randomLevel.skills },
      activeSkill: null,
      isPaused: false
    });
  };

  const handleNuke = () => {
    if (confirm("NUKE ALL SLEMMINGS? This ends the level.")) {
      setGameState(prev => ({ ...prev, gameStatus: 'LOST' }));
    }
  };

  if (gameState.gameStatus === 'MENU') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-green-950 text-white p-4">
        <h1 className="text-6xl font-bold mb-4 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] tracking-tighter">SLEMMINGS</h1>
        <div className="bg-black/70 p-8 rounded-2xl border-4 border-green-500 max-w-lg text-center shadow-2xl">
          <p className="mb-6 text-sm leading-relaxed text-green-100">
            The slime pits are overflowing! Guide your squishy minions to the exit portal.
            Assign roles like <span className="text-yellow-400 font-bold">BUILDER</span> to cross gaps or <span className="text-orange-500 font-bold">BLOCKER</span> to direct traffic.
          </p>
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-12 rounded-full text-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            ENTER THE OOZE
          </button>
        </div>
        <p className="mt-8 text-[10px] text-green-700 animate-pulse uppercase tracking-widest">Random Maps Enabled</p>
      </div>
    );
  }

  const isWin = gameState.saved >= level.toSave;
  const totalPossible = level.totalSlemmings;
  const isLoss = (gameState.dead > totalPossible - level.toSave) || gameState.timeLeft <= 0;

  if (isWin || (isLoss && gameState.released >= totalPossible && gameState.saved < level.toSave)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
        <h2 className={`text-6xl font-bold mb-8 animate-bounce ${isWin ? 'text-green-400' : 'text-red-500'}`}>
          {isWin ? 'VICTORY!' : 'GOOPED!'}
        </h2>
        <div className="bg-gray-900 border-2 border-gray-700 p-8 rounded-xl text-center space-y-4 shadow-2xl">
          <div className="grid grid-cols-2 gap-4 text-lg">
            <span className="text-gray-400">SAVED:</span>
            <span className={gameState.saved >= level.toSave ? 'text-green-400' : 'text-red-400'}>{gameState.saved}</span>
            <span className="text-gray-400">NEEDED:</span>
            <span>{level.toSave}</span>
          </div>
          <hr className="border-gray-700" />
          <p className="text-sm italic text-gray-400">"{isWin ? "The Slime Lord is pleased with your goop-management." : "Such a waste of perfectly good slime..."}"</p>
        </div>
        <button
          onClick={startGame}
          className="mt-8 bg-white text-black font-bold py-4 px-10 rounded-lg hover:bg-green-400 transition-colors uppercase tracking-widest"
        >
          Next Random Level
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center py-4 px-2 select-none overflow-hidden font-mono">
      <div className="w-full max-w-[1280px] flex justify-between items-center bg-zinc-900 p-3 rounded-t-xl border-x-4 border-t-4 border-zinc-800 text-[10px] md:text-xs">
        <div className="flex space-x-6">
          <div className="flex flex-col">
            <span className="text-zinc-500 uppercase text-[8px]">Saved</span>
            <span className="text-green-400 font-bold">{gameState.saved}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500 uppercase text-[8px]">Dead</span>
            <span className="text-red-400 font-bold">{gameState.dead}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500 uppercase text-[8px]">Released</span>
            <span className="text-blue-400 font-bold">{gameState.released}/{level.totalSlemmings}</span>
          </div>
        </div>
        <div className="text-center">
          <span className="text-zinc-500 uppercase text-[8px] block">{level.name}</span>
          <span className={`font-bold text-lg ${gameState.timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            {Math.floor(gameState.timeLeft / 60)}:{String(gameState.timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGameState(p => ({ ...p, isPaused: !p.isPaused }))}
            className={`px-3 py-1 rounded border border-zinc-600 transition-colors ${gameState.isPaused ? 'bg-red-600 border-red-400' : 'bg-zinc-700 hover:bg-zinc-600'}`}
          >
            {gameState.isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1280px]">
        <GameCanvas
          level={level}
          gameState={gameState}
          onUpdateState={(u) => setGameState(prev => ({ ...prev, ...u }))}
          onSlemmingExited={() => setGameState(prev => ({ ...prev, saved: prev.saved + 1 }))}
          onSlemmingDied={() => setGameState(prev => ({ ...prev, dead: prev.dead + 1 }))}
          onSkillUsed={handleSkillUsed}
        />
      </div>

      <div className="w-full max-w-[1280px] bg-zinc-900 p-3 rounded-b-xl border-x-4 border-b-4 border-zinc-800 shadow-2xl">
        <div className="grid grid-cols-4 md:grid-cols-10 gap-2">
          <div className="col-span-1 flex flex-col justify-between">
            <button onClick={() => setGameState(p => ({ ...p, releaseRate: Math.min(99, p.releaseRate + 5) }))} className="bg-zinc-700 hover:bg-zinc-600 py-1 rounded text-xs">▲</button>
            <div className="bg-black text-center py-1 text-xs font-bold border border-zinc-700 rounded my-1">{gameState.releaseRate}</div>
            <button onClick={() => setGameState(p => ({ ...p, releaseRate: Math.max(0, p.releaseRate - 5) }))} className="bg-zinc-700 hover:bg-zinc-600 py-1 rounded text-xs">▼</button>
          </div>

          {(Object.keys(SkillType) as SkillType[]).map((skill) => (
            <button
              key={skill}
              disabled={gameState.skillsLeft[skill] <= 0}
              onClick={() => setGameState(prev => ({ ...prev, activeSkill: prev.activeSkill === skill ? null : skill }))}
              className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all border-2 shadow-inner
                ${gameState.activeSkill === skill ? 'border-white brightness-125 scale-110 z-10' : 'border-zinc-700 opacity-80'}
                ${gameState.skillsLeft[skill] > 0 ? SKILL_COLORS[skill] : 'bg-zinc-800 opacity-30 grayscale'}
                hover:opacity-100 hover:brightness-110
              `}
            >
              <span className="text-xl text-white drop-shadow-md">{SKILL_ICONS[skill]}</span>
              <span className="text-[10px] font-bold mt-1 bg-black/40 px-1 rounded-sm text-white">
                {gameState.skillsLeft[skill]}
              </span>
            </button>
          ))}

          <button onClick={handleNuke} className="bg-red-950 hover:bg-red-800 border-2 border-red-900 rounded-lg flex items-center justify-center transition-transform active:scale-90">
            <i className="fas fa-radiation text-red-500 text-xl"></i>
          </button>
        </div>

        <div className="mt-4 bg-black/50 p-2 rounded-lg text-[10px] italic text-green-400 border border-green-900/30 flex items-center space-x-2">
          <i className="fas fa-comment-dots opacity-50"></i>
          <span className="flex-1 text-center truncate">"{hint}"</span>
        </div>
      </div>
    </div>
  );
};

export default App;
