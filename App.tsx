
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PlayingCard, Difficulty, Language, ExpressionToken } from './types';
import { drawCards, evaluateExpression, solve24 } from './utils/gameLogic';
import { getDailyScore, incrementDailyScore } from './utils/storage';
import { playSound } from './utils/sound';
import { translations } from './utils/translations';
import Card from './components/Card';
import Confetti from './components/Confetti';
import { 
  Delete, 
  Lightbulb, 
  CheckCircle, 
  HelpCircle,
  Play,
  Award,
  Settings,
  X,
  Languages,
  Info,
  ArrowLeft,
  ArrowRight,
  Eraser,
  Flame
} from 'lucide-react';

const App: React.FC = () => {
  const [cards, setCards] = useState<PlayingCard[]>([]);
  
  // Token-based State for Math Expression
  const [tokens, setTokens] = useState<ExpressionToken[]>([]);
  const [cursorIndex, setCursorIndex] = useState<number>(0);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'neutral' }>({ text: '', type: 'neutral' });
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [dailyScore, setDailyScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0); // New Streak State
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [showDifficultyMenu, setShowDifficultyMenu] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('en');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false); // For error animation
  
  const displayRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Derived state for expression string and used cards
  const expressionString = useMemo(() => tokens.map(t => t.value).join(''), [tokens]);
  const usedCardIds = useMemo(() => tokens.filter(t => t.type === 'number' && t.cardId).map(t => t.cardId!), [tokens]);

  // Initialize game
  const startNewGame = useCallback(() => {
    const newCards = drawCards(4, difficulty);
    setCards(newCards);
    setTokens([]);
    setCursorIndex(0);
    setMessage({ text: translations[language].startMsg, type: 'neutral' });
    setShowConfetti(false);
    setStartTime(Date.now());
    setTimer(0);
    setIsPlaying(true);
    playSound('shuffle');
  }, [difficulty, language]);

  useEffect(() => {
    setDailyScore(getDailyScore());
    startNewGame();
  }, []); 

  // Update messages when language changes
  useEffect(() => {
    if (message.type === 'neutral') {
      setMessage(prev => ({ ...prev, text: t.startMsg }));
    } else if (message.type !== 'success') {
      setMessage({ text: t.startMsg, type: 'neutral' });
    }
  }, [language, t.startMsg]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && startTime) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, startTime]);

  // Input Handlers
  const handleInsertToken = (value: string, type: 'number' | 'operator', cardId?: string) => {
    playSound(type === 'number' ? 'pop' : 'click');
    
    const newToken: ExpressionToken = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value,
      cardId
    };

    const newTokens = [...tokens];
    newTokens.splice(cursorIndex, 0, newToken);
    
    setTokens(newTokens);
    setCursorIndex(prev => prev + 1);
  };

  const handleBackspace = () => {
    playSound('click');
    if (cursorIndex === 0) return;

    const newTokens = [...tokens];
    newTokens.splice(cursorIndex - 1, 1);
    
    setTokens(newTokens);
    setCursorIndex(prev => prev - 1);
  };

  const handleClear = () => {
    playSound('click');
    setTokens([]);
    setCursorIndex(0);
    setMessage({ text: t.startMsg, type: 'neutral' });
  };

  const handleMoveCursor = (direction: 'left' | 'right') => {
    playSound('click');
    if (direction === 'left') {
      setCursorIndex(prev => Math.max(0, prev - 1));
    } else {
      setCursorIndex(prev => Math.min(tokens.length, prev + 1));
    }
  };

  const handleSetCursor = (index: number) => {
    setCursorIndex(index);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const checkResult = () => {
    if (usedCardIds.length !== 4) {
      setMessage({ text: t.useAllCards, type: 'error' });
      playSound('error');
      triggerShake();
      return;
    }

    const result = evaluateExpression(expressionString);
    
    if (result && Math.abs(result - 24) < 0.001) {
      setMessage({ text: t.correct, type: 'success' });
      setShowConfetti(true);
      setIsPlaying(false);
      setDailyScore(incrementDailyScore());
      setStreak(s => s + 1); // Increase streak
      playSound('success');
    } else {
      setMessage({ 
        text: `${t.tryAgain} (= ${result ? Number(result.toFixed(2)) : '?'})`, 
        type: 'error' 
      });
      playSound('error');
      triggerShake();
      setStreak(0); // Reset streak on wrong answer
    }
  };

  const getLocalHint = (type: 'hint' | 'solve') => {
    playSound('click');
    const numbers = cards.map(c => c.value);
    const result = solve24(numbers);

    // Using a hint breaks the streak!
    if (streak > 0) setStreak(0);

    if (!result.solvable) {
      setMessage({ text: t.impossible, type: 'error' });
      playSound('error');
      setTimeout(startNewGame, 1500);
      return;
    }

    if (type === 'hint') {
      setMessage({ text: `💡 ${t.hintPrefix} ${result.firstStepHint}`, type: 'info' });
    } else {
      setMessage({ text: `${t.solution}: ${result.solution}`, type: 'success' });
    }
  };

  const changeDifficulty = (diff: Difficulty) => {
    playSound('click');
    setDifficulty(diff);
    setShowDifficultyMenu(false);
    setStreak(0);
    setTimeout(() => startNewGame(), 50);
  };
  
  const toggleLanguage = () => {
    playSound('click');
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
    setShowDifficultyMenu(false);
  };

  // Helper to render Cursor
  const Cursor = () => (
    <span className="inline-block w-0.5 h-8 bg-blue-600 animate-blink align-middle relative -top-0.5 mx-[1px] pointer-events-none rounded-full"></span>
  );

  // Operator button data for loop
  const operatorButtons = [
    { op: '+', color: 'bg-green-100 text-green-600 border-green-200' },
    { op: '-', color: 'bg-red-100 text-red-600 border-red-200' },
    { op: '*', label: '×', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    { op: '/', label: '÷', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center py-2 px-4 max-w-md mx-auto font-sans select-none">
      {showConfetti && <Confetti />}

      {/* Top Bar: Settings & Timer */}
      <div className="w-full flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
           <div className="bg-white px-3 py-1 rounded-full shadow-sm text-blue-600 font-bold font-mono text-sm border border-blue-100">
             {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
           </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => { playSound('click'); setShowHelp(true); }}
            className="p-2 bg-white hover:bg-blue-50 text-blue-500 rounded-full shadow-sm border border-blue-100 transition active:scale-90"
          >
            <HelpCircle size={20} />
          </button>
          <div className="relative">
            <button 
              onClick={() => { playSound('click'); setShowDifficultyMenu(!showDifficultyMenu); }}
              className="p-2 bg-white hover:bg-blue-50 text-blue-500 rounded-full shadow-sm border border-blue-100 transition active:scale-90"
            >
              <Settings size={20} />
            </button>
            {showDifficultyMenu && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDifficultyMenu(false)}></div>
              <div className="absolute right-0 top-12 bg-white shadow-xl rounded-2xl p-2 min-w-[180px] border border-blue-100 z-50 animate-pop origin-top-right">
                <button onClick={() => changeDifficulty('Easy')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition mb-1 flex items-center justify-between ${difficulty === 'Easy' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
                  {t.easy} {difficulty === 'Easy' && <CheckCircle size={16} />}
                </button>
                <button onClick={() => changeDifficulty('Hard')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition mb-1 flex items-center justify-between ${difficulty === 'Hard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}`}>
                  {t.hard} {difficulty === 'Hard' && <CheckCircle size={16} />}
                </button>
                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                <button onClick={toggleLanguage} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition text-gray-600 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Languages size={16} /> {t.language}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{language === 'en' ? 'EN' : '中文'}</span>
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Header */}
      <div className="w-full flex justify-between items-stretch mb-4 gap-3">
        {/* Daily Wins */}
        <div className="flex-1 bg-white p-2 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between px-4">
           <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.dailyWins}</span>
             <span className="text-2xl font-black text-gray-800">{dailyScore}</span>
           </div>
           <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600">
             <Award size={20} />
           </div>
        </div>
        
        {/* Streak Counter */}
        <div className="flex-1 bg-white p-2 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-between px-4">
           <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.streak}</span>
             <span className="text-2xl font-black text-orange-500">{streak}</span>
           </div>
           <div className={`bg-orange-100 p-2 rounded-xl text-orange-500 ${streak > 1 ? 'animate-bounce' : ''}`}>
             <Flame size={20} fill={streak > 1 ? "currentColor" : "none"} />
           </div>
        </div>
      </div>

      {/* Interactive Display Area */}
      <div className={`w-full mb-4 relative transition-transform ${isShaking ? 'animate-shake' : ''}`}>
        <div 
          ref={displayRef}
          className={`
            w-full h-28 bg-white rounded-3xl border-[3px] flex items-center justify-center px-2 shadow-lg relative transition-all duration-300 cursor-text overflow-hidden
            ${message.type === 'success' ? 'border-green-400 ring-4 ring-green-100' : message.type === 'error' ? 'border-red-300' : 'border-indigo-100'}
          `}
          onClick={(e) => {
             if (e.target === displayRef.current) {
               const rect = displayRef.current.getBoundingClientRect();
               const x = e.clientX - rect.left;
               handleSetCursor(x < rect.width / 2 ? 0 : tokens.length);
             }
          }}
        >
            {/* Decoration circles in corners */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gray-200"></div>

            <div className="flex items-center flex-wrap justify-center w-full h-full pointer-events-none z-10">
              <div className="flex flex-wrap justify-center items-center pointer-events-auto">
                {cursorIndex === 0 && <Cursor />}
                {tokens.map((token, idx) => (
                  <React.Fragment key={token.id}>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        handleSetCursor(e.clientX - rect.left < rect.width / 2 ? idx : idx + 1);
                      }}
                      className={`
                        text-4xl font-bold tracking-wide cursor-pointer hover:scale-110 transition-transform
                        py-2 px-0.5 select-none
                        ${token.type === 'operator' ? 'text-blue-500 px-1' : 'text-gray-800'}
                      `}
                    >
                      {token.value === '*' ? '×' : token.value === '/' ? '÷' : token.value}
                    </span>
                    {idx + 1 === cursorIndex && <Cursor />}
                  </React.Fragment>
                ))}
              </div>
              
              {tokens.length === 0 && cursorIndex === 0 && (
                 <span className="text-gray-300 text-2xl font-bold absolute pointer-events-none opacity-40">{t.make24}</span>
              )}
            </div>
        </div>
        
        {/* Message Bubble */}
        <div className={`
          absolute -bottom-3 left-0 right-0 mx-auto w-max max-w-[90%] 
          text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-md flex items-center justify-center z-20
          transition-all duration-300 transform
          ${message.type === 'success' ? 'bg-green-500 text-white scale-105' : 
            message.type === 'error' ? 'bg-red-500 text-white' : 
            message.type === 'info' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500 opacity-0 translate-y-2'}
        `}>
          {message.text}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-2 w-full justify-items-center flex-grow items-center content-center px-1">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            card={card} 
            onClick={() => handleInsertToken(card.value.toString(), 'number', card.id)}
            disabled={usedCardIds.includes(card.id) || !isPlaying}
            selected={usedCardIds.includes(card.id)}
          />
        ))}
      </div>

      {/* Controls Panel */}
      <div className="w-full mt-auto">
        {/* Operators Row */}
        <div className="grid grid-cols-4 gap-3 mb-3 px-2">
          {operatorButtons.map((btn) => (
             <button
               key={btn.op}
               onClick={() => handleInsertToken(btn.op, 'operator')}
               disabled={!isPlaying}
               className={`
                 aspect-square sm:h-16 sm:w-auto ${btn.color} 
                 text-3xl font-black rounded-2xl transition-all active:scale-90 disabled:opacity-50 disabled:grayscale
                 flex items-center justify-center shadow-[0_4px_0_rgb(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] border-b-4
               `}
             >
               {btn.label || btn.op}
             </button>
          ))}
        </div>

        {/* Navigation & Editing Row */}
        <div className="grid grid-cols-5 gap-2 mb-4 px-2">
           {['(', ')'].map((op) => (
             <button
               key={op}
               onClick={() => handleInsertToken(op, 'operator')}
               disabled={!isPlaying}
               className="aspect-square bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-xl font-bold rounded-xl transition active:scale-90 disabled:opacity-50 flex items-center justify-center shadow-sm border border-gray-200"
             >
               {op}
             </button>
          ))}
          
           <button
             onClick={() => handleMoveCursor('left')}
             disabled={cursorIndex === 0 || !isPlaying}
             className="aspect-square bg-white text-gray-500 hover:bg-gray-50 rounded-xl flex items-center justify-center transition active:scale-90 disabled:opacity-30 shadow-sm border border-gray-200"
           >
             <ArrowLeft size={22} />
           </button>
           
           <button
             onClick={() => handleMoveCursor('right')}
             disabled={cursorIndex === tokens.length || !isPlaying}
             className="aspect-square bg-white text-gray-500 hover:bg-gray-50 rounded-xl flex items-center justify-center transition active:scale-90 disabled:opacity-30 shadow-sm border border-gray-200"
           >
             <ArrowRight size={22} />
           </button>

           <button
             onClick={handleBackspace}
             disabled={cursorIndex === 0 || !isPlaying}
             className="aspect-square bg-red-50 text-red-400 hover:bg-red-100 rounded-xl flex items-center justify-center transition active:scale-90 disabled:opacity-30 shadow-sm border border-red-100"
           >
             <Delete size={22} />
           </button>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-4 gap-3 pb-safe px-2">
          {isPlaying ? (
            <>
              <button 
                onClick={handleClear}
                className="col-span-1 bg-white text-gray-400 hover:text-gray-600 h-14 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-sm border border-gray-200"
              >
                <Eraser size={24} />
              </button>
              
              <button
                onClick={checkResult}
                disabled={usedCardIds.length !== 4}
                className="col-span-2 bg-gradient-to-b from-blue-500 to-blue-600 text-white h-14 rounded-2xl text-xl font-black shadow-[0_6px_0_#1e40af] active:shadow-none active:translate-y-[6px] border-b-0 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {t.submit}
              </button>
              
              <div className="col-span-1 flex flex-col gap-2">
                <button 
                  onClick={() => getLocalHint('hint')}
                  className="flex-1 bg-yellow-100 text-yellow-600 rounded-xl font-bold text-xs flex items-center justify-center transition active:scale-95 hover:bg-yellow-200"
                >
                   <Lightbulb size={20} />
                </button>
                <button 
                  onClick={() => getLocalHint('solve')}
                  className="flex-1 bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs flex items-center justify-center transition active:scale-95 hover:bg-indigo-200"
                >
                   <Info size={20} />
                </button>
              </div>
            </>
          ) : (
             <button
              onClick={startNewGame}
              className="col-span-4 bg-gradient-to-b from-green-500 to-green-600 text-white h-16 rounded-2xl text-2xl font-black flex items-center justify-center gap-2 shadow-[0_6px_0_#15803d] active:shadow-none active:translate-y-[6px] transition-all animate-pop"
             >
               <Play size={28} fill="currentColor" /> {t.nextCard}
             </button>
          )}
        </div>
      </div>

      {/* How to Play Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative transform transition-all scale-100 animate-pop border-4 border-blue-100">
             <button 
               onClick={() => { playSound('click'); setShowHelp(false); }}
               className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1"
             >
               <X size={24} />
             </button>
             
             <div className="flex flex-col items-center text-center">
               <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-4">
                 <HelpCircle size={32} />
               </div>
               <h2 className="text-xl font-black text-gray-800 mb-4">{t.helpTitle}</h2>
               
               <div className="space-y-3 text-left w-full">
                 <div className="flex gap-3 items-center bg-blue-50 p-3 rounded-2xl border border-blue-100">
                   <span className="bg-blue-500 text-white font-black w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm">1</span>
                   <p className="text-sm text-gray-700 font-bold leading-tight">{t.helpStep1}</p>
                 </div>
                 <div className="flex gap-3 items-center bg-purple-50 p-3 rounded-2xl border border-purple-100">
                   <span className="bg-purple-500 text-white font-black w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm">2</span>
                   <p className="text-sm text-gray-700 font-bold leading-tight">{t.helpStep2}</p>
                 </div>
                 <div className="flex gap-3 items-center bg-orange-50 p-3 rounded-2xl border border-orange-100">
                   <span className="bg-orange-500 text-white font-black w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm">3</span>
                   <p className="text-sm text-gray-700 font-bold leading-tight">{t.helpStep3}</p>
                 </div>
                 <div className="flex gap-3 items-center bg-green-50 p-3 rounded-2xl border border-green-100">
                   <span className="bg-green-500 text-white font-black w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm shadow-sm">4</span>
                   <p className="text-sm text-gray-700 font-bold leading-tight">{t.helpStep4}</p>
                 </div>
               </div>
               
               <button 
                 onClick={() => { playSound('click'); setShowHelp(false); }}
                 className="mt-6 w-full py-3 bg-gray-800 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition"
               >
                 {t.close}
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
