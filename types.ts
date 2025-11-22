export enum Suit {
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
  Spades = '♠'
}

export interface PlayingCard {
  id: string;
  value: number;
  suit: Suit;
  color: 'red' | 'black';
}

export interface AIResponse {
  solution?: string;
  hint?: string;
  explanation?: string;
  error?: string;
}

export type Operator = '+' | '-' | '*' | '/' | '(' | ')';

export type Difficulty = 'Easy' | 'Hard';

export interface SolverResult {
  solvable: boolean;
  solution?: string;
  firstStepHint?: string; // e.g. "Try adding 5 and 3"
}