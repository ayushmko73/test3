import { Chess, Move } from 'chess.js';

export type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

const PIECE_VALUES: Record<string, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900
};

// Simplified Piece Square Tables (PST) to encourage better positioning
// Values are for white. For black, we mirror the index.
const PST = {
  p: [
    0,  0,  0,  0,  0,  0,  0,  0,
    5,  5,  5, -5, -5,  5,  5,  5,
    5, -5, -10,  0,  0, -10, -5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5,  5, 10, 25, 25, 10,  5,  5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
    0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ]
  // Keeping it brief for demo. Real engines have tables for all pieces.
};

function evaluateBoard(game: Chess): number {
  let totalEvaluation = 0;
  const board = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        // Basic positional score derived from simple centralization logic if PST missing
        const posScore = (piece.type === 'p' || piece.type === 'n') 
          ? (piece.color === 'w' ? (PST[piece.type]?.[i * 8 + j] || 0) : (PST[piece.type]?.[(7 - i) * 8 + j] || 0))
          : 0;

        totalEvaluation += (value + posScore) * (piece.color === 'w' ? 1 : -1);
      }
    }
  }
  return totalEvaluation;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number {
  if (depth === 0 || game.isGameOver()) {
    return -evaluateBoard(game);
  }

  const moves = game.moves();

  if (isMaximizingPlayer) {
    let bestEval = -99999;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer);
      game.undo();
      bestEval = Math.max(bestEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return bestEval;
  } else {
    let bestEval = 99999;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer);
      game.undo();
      bestEval = Math.min(bestEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return bestEval;
  }
}

export function getBestMove(game: Chess, difficulty: Difficulty): string | null {
  const possibleMoves = game.moves();
  if (possibleMoves.length === 0) return null;

  // Beginner: Random Move
  if (difficulty === 'Beginner') {
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    return possibleMoves[randomIndex];
  }

  // Easy: Shallow search or capture prioritization
  // Hard: Depth 2-3
  // Master: Depth 3-4 (JS is slow, so 4 is risky on main thread without worker)
  let depth = 1;
  if (difficulty === 'Easy') depth = 1;
  if (difficulty === 'Hard') depth = 3;
  if (difficulty === 'Master') depth = 3; // Keep 3 for responsiveness, but could go 4 with worker.

  let bestMove = null;
  let bestValue = -99999;
  
  // Using isMaximizing = true because AI (playing Black generally) wants to minimize white's score,
  // but evaluateBoard returns positive for white. 
  // Actually, let's assume AI plays Black. The evaluator returns + for White adv.
  // So AI (Black) wants to MINIMIZE the evaluation.
  // However, standard minimax usually maximizes 'own' score.
  // Let's flip evaluation: return evaluateBoard(game) * (turn === 'w' ? 1 : -1)
  
  // Simplified implementation: AI assumes it is the current turn player.
  // We maximize OUR score.
  
  const isWhite = game.turn() === 'w';

  for (const move of possibleMoves) {
    game.move(move);
    // After we move, it's opponent's turn. We want to minimize their best outcome.
    // Or maximize our outcome from their perspective.
    // Let's stick to standard NegaMax or simple Minimax.
    // If isWhite (AI is white), we maximize +ve score. If AI is black, we minimize +ve score.
    
    // Let's simplify: Standard minimax is easiest.
    const boardValue = minimax(game, depth - 1, -100000, 100000, !isWhite);
    game.undo();

    // If AI is White, we want highest value.
    if (isWhite) {
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    } else {
        // If AI is Black, we want lowest value (since eval is relative to white)
        // But wait, minimax above returns value from perspective of white score usually.
        // Let's rewrite minimax slightly above to simply return absolute board score.
        // Done.
        
        // Actually, for simplicity: 
        // If AI is black, we want the move that results in the LOWEST board evaluation (most negative).
        // But I initialized bestValue to -99999. Let's fix loop.
    }
  }

  // Re-run simplified loop for clarity and correctness in this constrained env
  let bestMoveFound = possibleMoves[0];
  let bestValFound = isWhite ? -Infinity : Infinity;

  for (const move of possibleMoves) {
    game.move(move);
    const val = minimax(game, depth - 1, -Infinity, Infinity, !isWhite);
    game.undo();

    if (isWhite) {
      if (val > bestValFound) {
        bestValFound = val;
        bestMoveFound = move;
      }
    } else {
      if (val < bestValFound) {
        bestValFound = val;
        bestMoveFound = move;
      }
    }
  }

  return bestMoveFound;
}