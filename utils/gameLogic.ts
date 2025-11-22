import { PlayingCard, Suit, Difficulty, SolverResult } from '../types';

// Helper for Solver
interface ExprNode {
  val: number;
  str: string;
  opLevel: number; // 0: num, 1: +-, 2: */
  left?: ExprNode;
  right?: ExprNode;
  opStr?: string;
}

export const generateDeck = (difficulty: Difficulty): PlayingCard[] => {
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
  const deck: PlayingCard[] = [];
  const maxVal = difficulty === 'Hard' ? 13 : 10;

  for (let i = 1; i <= maxVal; i++) {
    for (const suit of suits) {
      deck.push({
        id: `${i}-${suit}-${Math.random()}`, // Unique ID
        value: i,
        suit: suit,
        color: (suit === Suit.Hearts || suit === Suit.Diamonds) ? 'red' : 'black'
      });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Check if 24 is possible and return solution info
export const solve24 = (numbers: number[]): SolverResult => {
  const EPSILON = 0.0001;
  
  // Initial nodes
  const initialNodes: ExprNode[] = numbers.map(n => ({
    val: n,
    str: n.toString(),
    opLevel: 0
  }));

  // Recursive solver that builds an expression tree
  const findSolution = (nodes: ExprNode[]): ExprNode | null => {
    if (nodes.length === 1) {
      if (Math.abs(nodes[0].val - 24) < EPSILON) {
        return nodes[0];
      }
      return null;
    }

    // Try every pair
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const a = nodes[i];
        const b = nodes[j];
        
        // Remaining nodes
        const remaining = nodes.filter((_, idx) => idx !== i && idx !== j);

        // Operations
        const ops: { op: string, func: (x: number, y: number) => number, level: number }[] = [
          { op: '+', func: (x, y) => x + y, level: 1 },
          { op: '-', func: (x, y) => x - y, level: 1 }, // a - b
          { op: '*', func: (x, y) => x * y, level: 2 },
          { op: '/', func: (x, y) => x / y, level: 2 }, // a / b
        ];

        for (const operation of ops) {
          // Skip division by zero
          if (operation.op === '/' && Math.abs(b.val) < EPSILON) continue;

          const newVal = operation.func(a.val, b.val);
          
          // Build new expression string with correct parens
          let leftStr = a.str;
          let rightStr = b.str;

          // Add parens if child op has lower precedence than current op
          // or if equal precedence and right side is minus/divide (associativity)
          if (a.opLevel > 0 && a.opLevel < operation.level) leftStr = `(${leftStr})`;
          
          if (b.opLevel > 0 && (b.opLevel < operation.level || (b.opLevel === operation.level && (operation.op === '-' || operation.op === '/')))) {
            rightStr = `(${rightStr})`;
          }

          const newStr = `${leftStr} ${operation.op} ${rightStr}`;

          const newNode: ExprNode = {
            val: newVal,
            str: newStr,
            opLevel: operation.level,
            left: a,
            right: b,
            opStr: operation.op
          };

          const result = findSolution([...remaining, newNode]);
          if (result) return result;
        }
      }
    }
    return null;
  };

  const root = findSolution(initialNodes);

  if (!root) {
    return { solvable: false };
  }

  // Extract a "First Step" hint
  const findFirstOperation = (node: ExprNode): string => {
    if (!node.left || !node.right) return "";
    
    // If both children are original numbers (no operations in them), this is a first step.
    if (!node.left.left && !node.right.left) {
      // Display format: "5 + 3"
      const opSymbol = node.opStr === '*' ? '×' : node.opStr === '/' ? '÷' : node.opStr;
      return `${node.left.val} ${opSymbol} ${node.right.val}`;
    }

    const leftResult = findFirstOperation(node.left);
    if (leftResult) return leftResult;
    
    return findFirstOperation(node.right);
  };

  // Pretty print the full solution (replace * / with × ÷)
  const prettySolution = root.str
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');

  return {
    solvable: true,
    solution: prettySolution,
    firstStepHint: findFirstOperation(root)
  };
};

export const drawCards = (count: number, difficulty: Difficulty): PlayingCard[] => {
  let attempts = 0;
  while (attempts < 100) {
    const deck = generateDeck(difficulty);
    const shuffled = shuffleDeck(deck);
    const hand = shuffled.slice(0, count);
    
    // Verify solvability
    const numbers = hand.map(c => c.value);
    const result = solve24(numbers);
    
    if (result.solvable) {
      return hand;
    }
    attempts++;
  }
  
  return generateDeck(difficulty).slice(0, count);
};

// Safe evaluation of mathematical expression
export const evaluateExpression = (expression: string): number | null => {
  try {
    // Keep basic math symbols for evaluation
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (!sanitized) return null;
    
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    
    if (!isFinite(result) || isNaN(result)) return null;
    return result;
  } catch (e) {
    return null;
  }
};