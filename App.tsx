
import React, { useState, useEffect } from 'react';
import { SkillType, GameState, Level } from './types';
import { SKILL_ICONS, SKILL_COLORS, SKILL_DESCRIPTIONS } from './constants';
import { LEVELS } from './constants/levels';
import GameCanvas from './components/GameCanvas';
import { getSlimeLordAdvice } from './services/adviceService';

const App: React.FC = () => {
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('slemmings_unlocked');
    return saved ? parseInt(saved) : 1;
  });

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
  const [hoveredSkill, setHoveredSkill] = useState<SkillType | null>(null);
  const [menuView, setMenuView] = useState<'SPLASH' | 'LEVELS'>('SPLASH');

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

  const startLevel = (levelId: number) => {
    const selectedLevel = LEVELS.find(l => l.id === levelId);
    if (!selectedLevel) return;

    setLevel(selectedLevel);
    setGameState({
      gameStatus: 'PLAYING',
      released: 0,
      saved: 0,
      dead: 0,
      timeLeft: selectedLevel.timeLimit,
      releaseRate: selectedLevel.spawnRate,
      skillsLeft: { ...selectedLevel.skills },
      activeSkill: null,
      isPaused: false
    });
  };

  const handleLevelComplete = () => {
    const nextLevelId = level.id + 1;
    if (nextLevelId > unlockedLevel && nextLevelId <= LEVELS.length) {
      setUnlockedLevel(nextLevelId);
      localStorage.setItem('slemmings_unlocked', nextLevelId.toString());
    }
  };

  const handleNuke = () => {
    if (confirm("NUKE ALL SLEMMINGS? This ends the level.")) {
      setGameState(prev => ({ ...prev, gameStatus: 'LOST' }));
    }
  };

  // Check Win/Loss Condition
  useEffect(() => {
    if (gameState.gameStatus !== 'PLAYING') return;

    if (gameState.saved >= level.toSave) {
      setGameState(prev => ({ ...prev, gameStatus: 'WON' }));
      handleLevelComplete();
    } else if ((gameState.dead > level.totalSlemmings - level.toSave) || gameState.timeLeft <= 0) {
      // Only set lost if we really can't win
      if (gameState.released >= level.totalSlemmings && gameState.saved < level.toSave) {
        setGameState(prev => ({ ...prev, gameStatus: 'LOST' }));
      }
    }
  }, [gameState.saved, gameState.dead, gameState.timeLeft, gameState.released]);


  if (gameState.gameStatus === 'MENU') {
    if (menuView === 'SPLASH') {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-green-950 text-white p-4 font-mono">
          <h1 className="text-6xl font-bold mb-4 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] tracking-tighter">SLEMMINGS</h1>
          <div className="bg-black/70 p-8 rounded-2xl border-4 border-green-500 max-w-lg text-center shadow-2xl">
            <p className="mb-6 text-sm leading-relaxed text-green-100">
              The slime pits are overflowing! Guide your squishy minions to the exit portal.
              Assign roles like <span className="text-yellow-400 font-bold">BUILDER</span> to cross gaps or <span className="text-orange-500 font-bold">BLOCKER</span> to direct traffic.
            </p>
            <button
              onClick={() => setMenuView('LEVELS')}
              className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 px-12 rounded-full text-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              ENTER THE OOZE
            </button>
          </div>
          <p className="mt-8 text-[10px] text-green-700 animate-pulse uppercase tracking-widest">v1.0 - Level System Update</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-950 text-white p-4 font-mono">
        <h1 className="text-6xl font-bold mb-8 text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] tracking-tighter">SLEMMINGS</h1>

        <div className="max-w-4xl w-full relative">
          <button
            onClick={() => setMenuView('SPLASH')}
            className="absolute -top-12 left-0 text-green-400 hover:text-green-200 flex items-center space-x-2 text-xs uppercase font-bold"
          >
            <i className="fas fa-arrow-left"></i> <span>Back to Title</span>
          </button>

          <h2 className="text-2xl mb-4 text-center text-green-200">SELECT LEVEL</h2>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-4">
            {LEVELS.map((l) => {
              const isUnlocked = l.id <= unlockedLevel;
              return (
                <button
                  key={l.id}
                  disabled={!isUnlocked}
                  onClick={() => startLevel(l.id)}
                  className={`
                                relative p-4 rounded-xl border-2 transition-all group
                                ${isUnlocked
                      ? 'bg-zinc-900 border-green-500 hover:bg-green-900 hover:scale-105 cursor-pointer'
                      : 'bg-zinc-950 border-zinc-800 opacity-50 cursor-not-allowed'}
                            `}
                >
                  <span className={`text-2xl font-bold block mb-1 ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                    {l.id}
                  </span>
                  <span className="text-[10px] uppercase text-zinc-400 truncate block">
                    {l.name}
                  </span>
                  {isUnlocked && l.id === unlockedLevel && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      NEW
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 text-center text-zinc-500 text-xs">
          <p>PROGRESS SAVED AUTOMATICALLY</p>
        </div>
      </div>
    );
  }

  const isWin = gameState.gameStatus === 'WON';
  const isLoss = gameState.gameStatus === 'LOST';

  if (isWin || isLoss) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4 font-mono">
        <h2 className={`text-6xl font-bold mb-8 animate-bounce ${isWin ? 'text-green-400' : 'text-red-500'}`}>
          {isWin ? 'VICTORY!' : 'GOOPED!'}
        </h2>
        <div className="bg-gray-900 border-2 border-gray-700 p-8 rounded-xl text-center space-y-4 shadow-2xl min-w-[300px]">
          <div className="grid grid-cols-2 gap-4 text-lg">
            <span className="text-gray-400">SAVED:</span>
            <span className={gameState.saved >= level.toSave ? 'text-green-400' : 'text-red-400'}>{gameState.saved}</span>
            <span className="text-gray-400">NEEDED:</span>
            <span>{level.toSave}</span>
          </div>
          <hr className="border-gray-700" />
          <p className="text-sm italic text-gray-400">
            "{isWin ? "The Slime Lord is pleased." : "Such a waste of perfectly good slime..."}"
          </p>
        </div>

        <div className="flex space-x-4 mt-8">
          <button
            onClick={() => setGameState(prev => ({ ...prev, gameStatus: 'MENU' }))}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-8 rounded-lg transition-colors uppercase tracking-widest"
          >
            Menu
          </button>
          <button
            onClick={() => startLevel(level.id)}
            className="bg-white text-black font-bold py-3 px-8 rounded-lg hover:bg-green-400 transition-colors uppercase tracking-widest"
          >
            Retry
          </button>
          {isWin && level.id < LEVELS.length && (
            <button
              onClick={() => startLevel(level.id + 1)}
              className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.5)] uppercase tracking-widest"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center py-4 px-2 select-none overflow-hidden font-mono">
      <div className="w-full max-w-[1280px] flex justify-between items-center bg-zinc-900 p-3 rounded-t-xl border-x-4 border-t-4 border-zinc-800 text-[10px] md:text-xs">
        <div className="flex space-x-6">
          <div className="flex flex-col">
            <span className="text-zinc-500 uppercase text-[8px]">Saved</span>
            <span className="text-green-400 font-bold">{gameState.saved}/{level.toSave}</span>
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
          <div className="flex items-center justify-center space-x-2">
            <span className="text-zinc-400 font-bold">LVL {level.id}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300 uppercase text-[10px]">{level.name}</span>
          </div>
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
          <button
            onClick={() => setGameState(p => ({ ...p, gameStatus: 'MENU' }))}
            className="px-3 py-1 rounded border border-zinc-600 bg-zinc-800 hover:bg-zinc-700"
          >
            EXIT
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1280px] relative">
        <GameCanvas
          level={level}
          gameState={gameState}
          onUpdateState={(u) => setGameState(prev => ({ ...prev, ...u }))}
          onSlemmingExited={() => setGameState(prev => ({ ...prev, saved: prev.saved + 1 }))}
          onSlemmingDied={() => setGameState(prev => ({ ...prev, dead: prev.dead + 1 }))}
          onSkillUsed={handleSkillUsed}
        />
        {/* HINT OVERLAY IF LEVEL HAS HINT */}
        {level.hint && gameState.timeLeft > level.timeLimit - 10 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 border border-green-500 text-green-100 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm animate-bounce-in pointer-events-none max-w-md text-center bg-gradient-to-b from-green-900/50 to-black/80">
            <div className="text-yellow-400 text-xs font-bold uppercase mb-1">Slime Lord's Tip</div>
            <div className="text-lg">{level.hint}</div>
          </div>
        )}
      </div>

      <div className="w-full max-w-[1280px] bg-zinc-900 p-3 rounded-b-xl border-x-4 border-b-4 border-zinc-800 shadow-2xl">
        <div className="grid grid-cols-4 md:grid-cols-10 gap-2">
          <div className="col-span-1 flex flex-col justify-between">
            <button onClick={() => setGameState(p => ({ ...p, releaseRate: Math.min(99, p.releaseRate + 5) }))} className="bg-zinc-700 hover:bg-zinc-600 py-1 rounded text-xs">▲</button>
            <div className="bg-black text-center py-1 text-xs font-bold border border-zinc-700 rounded my-1">{gameState.releaseRate}</div>
            <button onClick={() => setGameState(p => ({ ...p, releaseRate: Math.max(0, p.releaseRate - 5) }))} className="bg-zinc-700 hover:bg-zinc-600 py-1 rounded text-xs">▼</button>
          </div>

          {(Object.keys(SkillType) as SkillType[]).map((skill) => (
            <div key={skill} className="relative group">
              {hoveredSkill === skill && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-zinc-900 border border-zinc-500 text-zinc-100 text-[10px] p-2 rounded shadow-lg z-50 text-center pointer-events-none">
                  {SKILL_DESCRIPTIONS[skill]}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-500 rotate-45"></div>
                </div>
              )}
              <button
                disabled={gameState.skillsLeft[skill] <= 0}
                onClick={() => setGameState(prev => ({ ...prev, activeSkill: prev.activeSkill === skill ? null : skill }))}
                onMouseEnter={() => setHoveredSkill(skill)}
                onMouseLeave={() => setHoveredSkill(null)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all border-2 shadow-inner w-full
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
            </div>
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
