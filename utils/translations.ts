
import { Language } from '../types';

type TranslationKey = 
  | 'dailyWins'
  | 'settings'
  | 'easy'
  | 'hard'
  | 'startMsg'
  | 'correct'
  | 'tryAgain'
  | 'useAllCards'
  | 'impossible'
  | 'solution'
  | 'submit'
  | 'hint'
  | 'hintPrefix'
  | 'solve'
  | 'nextCard'
  | 'howToPlay'
  | 'helpTitle'
  | 'helpStep1'
  | 'helpStep2'
  | 'helpStep3'
  | 'helpStep4'
  | 'close'
  | 'language'
  | 'make24'
  | 'streak';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    dailyWins: "Daily Wins",
    settings: "Settings",
    easy: "Easy (1-10)",
    hard: "Hard (1-13)",
    startMsg: "Select numbers to make 24",
    make24: "Make 24!",
    correct: "🎉 Correct! You made 24!",
    tryAgain: "Try again!",
    useAllCards: "Use all 4 cards!",
    impossible: "Impossible set. Skipping...",
    solution: "Solution",
    submit: "Submit",
    hint: "Hint",
    hintPrefix: "Try:",
    solve: "Solve",
    nextCard: "Next Card",
    howToPlay: "How to Play",
    helpTitle: "24点 Rules",
    helpStep1: "You get 4 cards with numbers.",
    helpStep2: "Use +, -, ×, ÷ to combine them.",
    helpStep3: "You must use ALL 4 cards exactly once.",
    helpStep4: "The final result must be 24.",
    close: "Close",
    language: "Language",
    streak: "Streak",
  },
  zh: {
    dailyWins: "今日胜场",
    settings: "设置",
    easy: "简单 (1-10)",
    hard: "困难 (1-13)",
    startMsg: "请用牌算出 24",
    make24: "算算 24!",
    correct: "🎉 太棒了！算对了！",
    tryAgain: "再试一次！",
    useAllCards: "必须用完4张牌！",
    impossible: "无解，换一题...",
    solution: "答案",
    submit: "提交",
    hint: "提示",
    hintPrefix: "试试:",
    solve: "答案",
    nextCard: "下一题",
    howToPlay: "游戏说明",
    helpTitle: "24点 游戏规则",
    helpStep1: "你会拿到4张数字牌。",
    helpStep2: "使用 加减乘除 来计算。",
    helpStep3: "必须正好用到所有4张牌。",
    helpStep4: "最终结果必须等于 24。",
    close: "关闭",
    language: "语言",
    streak: "连胜",
  }
};
