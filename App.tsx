
import React, { useState, useEffect, useCallback } from 'react';
import { PlayingCard, Operator, Difficulty } from './types';
import { drawCards, evaluateExpression, solve24 } from './utils/gameLogic';
import { getDailyScore, incrementDailyScore } from './utils/storage';
import Card from './components/Card';
import Confetti from './components/Confetti';
import { 
  RefreshCw, 
  Delete, 
  RotateCcw, 
  Lightbulb, 
  CheckCircle, 
  HelpCircle,
  Play,
  Award,
  Settings,
  Share
} from 'lucide-react';

const App: React.FC = () => {
  const [cards, setCards] = useState<PlayingCard[]>([]);
  const [expression, setExpression] = useState<string>('');
  const [usedCardIds, setUsedCardIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'neutral' }>({ text: 'Make 24!', type: 'neutral' });
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [dailyScore, setDailyScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [showDifficultyMenu, setShowDifficultyMenu] = useState<boolean>(false);

  // Initialize game
  const startNewGame = useCallback(() => {
    const newCards = drawCards(4, difficulty);
    setCards(newCards);
    setExpression('');
    setUsedCardIds([]);
    setMessage({ text: 'Select numbers to make 24', type: 'neutral' });
    setShowConfetti(false);
    setStartTime(Date.now());
    setTimer(0);
    setIsPlaying(true);
    setHistory([]);
  }, [difficulty]);

  useEffect(() => {
    // Initial load
    setDailyScore(getDailyScore());
    startNewGame();
  }, [startNewGame]);

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && startTime) {
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, startTime]);

  const handleCardClick = (card: PlayingCard) => {
    // (Unused directly, handled by inline helper)
  };

  // Stack to track history for Undo
  const [history, setHistory] = useState<{ expr: string; used: string[] }[]>([]);

  const updateExpression = (newVal: string, isCard: boolean = false, cardId?: string) => {
    setHistory(prev => [...prev, { expr: expression, used: usedCardIds }]);
    setExpression(prev => prev + newVal);
    if (isCard && cardId) {
      setUsedCardIds(prev => [...prev, cardId]);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setExpression(lastState.expr);
    setUsedCardIds(lastState.used);
    setHistory(prev => prev.slice(0, -1));
    setMessage({ text: 'Keep going!', type: 'neutral' });
  };

  const handleClear = () => {
    setHistory(prev => [...prev, { expr: expression, used: usedCardIds }]);
    setExpression('');
    setUsedCardIds([]);
    setMessage({ text: 'Start over!', type: 'neutral' });
  };

  const checkResult = () => {
    if (usedCardIds.length !== 4) {
      setMessage({ text: 'Use all 4 cards!', type: 'error' });
      return;
    }

    const result = evaluateExpression(expression);
    
    if (result && Math.abs(result - 24) < 0.001) {
      setMessage({ text: '🎉 Correct! You made 24!', type: 'success' });
      setShowConfetti(true);
      setIsPlaying(false);
      // Update daily score
      setDailyScore(incrementDailyScore());
    } else {
      setMessage({ text: `Equals ${result ? Number(result.toFixed(2)) : '?'}. Try again!`, type: 'error' });
    }
  };

  const getLocalHint = (type: 'hint' | 'solve') => {
    const numbers = cards.map(c => c.value);
    const result = solve24(numbers);

    if (!result.solvable) {
      setMessage({ text: "Impossible set. Skipping...", type: 'error' });
      setTimeout(startNewGame, 1500);
      return;
    }

    if (type === 'hint') {
      setMessage({ text: `💡 ${result.firstStepHint}`, type: 'info' });
    } else {
      setMessage({ text: `Solution: ${result.solution}`, type: 'success' });
    }
  };

  const changeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setShowDifficultyMenu(false);
  };
  
  // Trigger new game when difficulty actually changes
  useEffect(() => {
    startNewGame();
  }, [difficulty, startNewGame]);

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-4 max-w-md mx-auto font-sans">
      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-2xl shadow-sm relative z-10">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2.5 rounded-xl text-white shadow-md">
             <Award size={20} />
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-0.5">Today's Wins</span>
             <span className="text-2xl font-black text-gray-800 leading-none">{dailyScore}</span>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-lg font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg min-w-[64px] text-center">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
              className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition active:scale-95"
              aria-label="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
            
            {showDifficultyMenu && (
              <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDifficultyMenu(false)}></div>
              <div className="absolute right-0 top-14 bg-white shadow-2xl rounded-2xl p-2 min-w-[180px] border border-gray-100 z-50 animate-pop">
                <div className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">Select Difficulty</div>
                <button 
                  onClick={() => changeDifficulty('Easy')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition mb-1 flex items-center justify-between ${difficulty === 'Easy' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  Easy (1-10)
                  {difficulty === 'Easy' && <CheckCircle size={16} />}
                </button>
                <button 
                  onClick={() => changeDifficulty('Hard')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-between ${difficulty === 'Hard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                >
                  Hard (1-13)
                  {difficulty === 'Hard' && <CheckCircle size={16} />}
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Display Area */}
      <div className="w-full mb-6">
        <div className={`
          w-full h-20 bg-white rounded-2xl border-4 flex items-center justify-center p-2 shadow-inner overflow-hidden relative transition-colors duration-300
          ${message.type === 'success' ? 'border-green-400 bg-green-50' : message.type === 'error' ? 'border-red-300 bg-red-50' : 'border-blue-100'}
        `}>
            {expression ? (
              <span className="text-3xl sm:text-4xl font-bold text-gray-700 tracking-wider truncate">
                {expression}
              </span>
            ) : (
              <span className="text-gray-400 text-lg font-medium">Tap cards to start...</span>
            )}
        </div>
        
        {/* Message / Feedback */}
        <div className={`mt-2 text-center text-xs sm:text-sm font-bold transition-all duration-300 px-4 py-1.5 rounded-lg min-h-[2rem] flex items-center justify-center
           ${message.type === 'success' ? 'text-green-600 bg-green-100' : 
             message.type === 'error' ? 'text-red-500' : 
             message.type === 'info' ? 'text-purple-600 bg-purple-50' : 'text-gray-400'}
        `}>
          {message.text}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 w-full justify-items-center flex-grow items-center content-center">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            card={card} 
            onClick={() => updateExpression(card.value.toString(), true, card.id)}
            disabled={usedCardIds.includes(card.id) || !isPlaying}
            selected={usedCardIds.includes(card.id)}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="w-full bg-white/80 backdrop-blur-lg p-4 pb-6 sm:p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-white/50 mt-auto">
        
        {/* Operators */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          {['+', '-', '*', '/'].map((op) => (
             <button
               key={op}
               onClick={() => updateExpression(op)}
               disabled={!isPlaying}
               className="aspect-square sm:h-14 sm:w-auto bg-blue-50 hover:bg-blue-100 text-blue-600 text-2xl font-black rounded-2xl transition active:scale-90 disabled:opacity-50 flex items-center justify-center shadow-sm border-b-2 border-blue-100 active:border-b-0 active:translate-y-[2px]"
             >
               {op}
             </button>
          ))}
          {['(', ')'].map((op) => (
             <button
               key={op}
               onClick={() => updateExpression(op)}
               disabled={!isPlaying}
               className="aspect-square sm:h-14 sm:w-auto bg-gray-50 hover:bg-gray-100 text-gray-500 text-xl font-bold rounded-2xl transition active:scale-90 disabled:opacity-50 flex items-center justify-center border-b-2 border-gray-200 active:border-b-0 active:translate-y-[2px]"
             >
               {op}
             </button>
          ))}
           <button
             onClick={handleUndo}
             disabled={history.length === 0 || !isPlaying}
             className="aspect-square sm:h-14 sm:w-auto bg-orange-50 hover:bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center transition active:scale-90 disabled:opacity-30 border-b-2 border-orange-100 active:border-b-0 active:translate-y-[2px]"
             title="Undo"
           >
             <RotateCcw size={22} />
           </button>
           <button
             onClick={handleClear}
             disabled={expression.length === 0 || !isPlaying}
             className="aspect-square sm:h-14 sm:w-auto bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl flex items-center justify-center transition active:scale-90 disabled:opacity-30 border-b-2 border-red-100 active:border-b-0 active:translate-y-[2px]"
             title="Clear"
           >
             <Delete size={22} />
           </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {isPlaying ? (
            <>
              <button
                onClick={checkResult}
                disabled={usedCardIds.length !== 4}
                className="col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-14 rounded-2xl text-lg font-bold shadow-lg shadow-green-200 flex items-center justify-center gap-2 transition transform active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <CheckCircle size={22} /> Submit
              </button>
              
              <button 
                onClick={() => getLocalHint('hint')}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                 <Lightbulb size={18} /> Hint
              </button>
                 
              <button 
                onClick={() => getLocalHint('solve')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                 <HelpCircle size={18} /> Solve
              </button>
            </>
          ) : (
             <button
              onClick={startNewGame}
              className="col-span-2 bg-blue-500 hover:bg-blue-600 text-white h-14 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition active:scale-95 animate-pop"
             >
               <Play size={22} /> Next Card
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
