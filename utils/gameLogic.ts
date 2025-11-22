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

          // Commutative optimization: for + and *, only do it if i < j to avoid dupes? 
          // Actually, strictly speaking we need full permutation because a-b != b-a.
          // But for + and *, a+b == b+a. We can optimize, but loop is small enough.

          const newVal = operation.func(a.val, b.val);
          
          // Build new expression string with correct parens
          let leftStr = a.str;
          let rightStr = b.str;

          // Add parens if child op has lower precedence than current op
          // or if equal precedence and right side is minus/divide (associativity)
          // Simplify: Wrap if child level < current level.
          if (a.opLevel > 0 && a.opLevel < operation.level) leftStr = `(${leftStr})`;
          
          // Special care for right operand with - and /
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
  // We need to find a node where both children are leaf nodes (level 0)
  // Or effectively, traverse down to the bottom-most operation.
  const findFirstOperation = (node: ExprNode): string => {
    if (!node.left || !node.right) return "";
    
    // If both children are original numbers (no operations in them), this is a first step.
    if (!node.left.left && !node.right.left) {
      const opName = node.opStr === '+' ? 'adding' : 
                     node.opStr === '-' ? 'subtracting' :
                     node.opStr === '*' ? 'multiplying' : 'dividing';
      // Ensure we mention numbers in order for subtraction/division
      return `Try ${opName} ${node.left.val} and ${node.right.val}`;
    }

    // Recursively search children
    const leftResult = findFirstOperation(node.left);
    if (leftResult) return leftResult;
    
    return findFirstOperation(node.right);
  };

  return {
    solvable: true,
    solution: root.str,
    firstStepHint: findFirstOperation(root)
  };
};

export const drawCards = (count: number, difficulty: Difficulty): PlayingCard[] => {
  // Safety break counter to prevent infinite loops if logic is broken
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
  
  // Fallback (should rarely happen with standard deck)
  return generateDeck(difficulty).slice(0, count);
};

// Safe evaluation of mathematical expression
export const evaluateExpression = (expression: string): number | null => {
  try {
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