import { Chess, Move } from 'chess.js';

// Piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900
};

export type Difficulty = 'Beginner' | 'Easy' | 'Hard' | 'Master';

function evaluateBoard(game: Chess): number {
  let totalEvaluation = 0;
  const board = game.board();
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = PIECE_VALUES[piece.type] || 0;
        totalEvaluation += piece.color === 'w' ? value : -value;
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
    let bestEval = -9999;
    for (const move of moves) {
      game.move(move);
      bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, bestEval);
      if (beta <= alpha) break;
    }
    return bestEval;
  } else {
    let bestEval = 9999;
    for (const move of moves) {
      game.move(move);
      bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, true));
      game.undo();
      beta = Math.min(beta, bestEval);
      if (beta <= alpha) break;
    }
    return bestEval;
  }
}

export function getBestMove(game: Chess, difficulty: Difficulty): string | null {
  const moves = game.moves();
  if (moves.length === 0) return null;

  // Beginner: Random move
  if (difficulty === 'Beginner') {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  let depth = 1;
  if (difficulty === 'Easy') depth = 2;
  if (difficulty === 'Hard') depth = 3;
  if (difficulty === 'Master') depth = 4;

  let bestMove = null;
  let bestValue = -9999;

  // To add some variety to opening, shuffle moves initially
  const shuffledMoves = moves.sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    game.move(move);
    // We are black (AI), so we want to minimize white's advantage, 
    // but the minimax function returns board value relative to white positive.
    // If AI is black, it wants the lowest score (most negative).
    // However, the standard minimax implementation above is slightly generic.
    // Let's simplify: AI is usually playing against User.
    // Assuming AI is playing Black for simplicity in this function call context,
    // or we pass 'isMaximizing' based on turn.
    
    const boardValue = minimax(game, depth - 1, -10000, 10000, game.turn() === 'w');
    
    // If AI is Black ('b'), we want to MINIMIZE the evaluation (since white is positive)
    // If AI is White ('w'), we want to MAXIMIZE.
    const isBlack = game.turn() === 'w'; // because we just moved, turn flipped.
    
    // Wait, let's look at the state BEFORE the move.
    // We are choosing a move for the CURRENT turn.
    // If current turn is 'b', we want the move that leads to smallest value.
    
    // Actually, minimax returns value from White's perspective.
    // If AI is Black, it wants min value. 
    // If AI is White, it wants max value.
    
    const aiColor = game.turn() === 'b' ? 'w' : 'b'; // The color that just moved

    if (aiColor === 'b') {
        if (boardValue < bestValue || bestMove === null) {
            // In standard minimax for black, we usually initialize bestValue to +Infinity
            // But here I reused variables. Let's fix logic for clarity.
             // Actually, let's rely on a simpler maximizing for the AI's perspective.
        }
    }
    
    // Easier approach: Always maximize AI's score.
    // If AI is black, multiply score by -1 inside eval or here.
    
    const moveValue = (game.turn() === 'w' ? 1 : -1) * boardValue;
    // Now high moveValue is bad for the player who is about to move (opponent).
    // We want to force the opponent into a bad state.
    
    // Let's stick to standard:
    // We just made a move. Now it's opponent's turn. Minimax returns the best score the opponent can achieve.
    // We want to minimize the opponent's best score.
    
    if (game.turn() === 'b') { // White just moved (AI is White)
        if (boardValue > bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    } else { // Black just moved (AI is Black)
        // We want the board evaluation to be as low as possible (negative)
        // But bestValue was init to -9999. Let's fix init.
        if (bestMove === null || boardValue < bestValue) {
           bestValue = boardValue;
           bestMove = move;
        }
    }
    
    game.undo();
  }
  
  // Fallback if logic glitch
  if (!bestMove) return moves[0];

  return bestMove;
}