
const STORAGE_KEY = 'math24_daily_score';

interface DailyStats {
  date: string;
  count: number;
}

export const getDailyScore = (): number => {
  if (typeof window === 'undefined') return 0;
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    
    const stats: DailyStats = JSON.parse(data);
    const today = new Date().toDateString();
    
    // If the stored date matches today, return the count. Otherwise reset.
    if (stats.date === today) {
      return stats.count;
    }
    return 0;
  } catch {
    return 0;
  }
};

export const incrementDailyScore = (): number => {
  const currentScore = getDailyScore();
  const newScore = currentScore + 1;
  const today = new Date().toDateString();
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: today,
    count: newScore
  }));
  
  return newScore;
};
