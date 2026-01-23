import { Chess, Square, Move } from 'chess.js';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

interface BoardProps {
  game: Chess;
  onMove: (from: Square, to: Square) => void;
  orientation?: 'w' | 'b';
  interactive: boolean;
}

const PIECES: Record<string, string> = {
  'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
  'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

export default function Board({ game, onMove, orientation = 'w', interactive }: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);

  // Reset selection when game changes
  useEffect(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [game.fen()]);

  const board = game.board();
  const isFlipped = orientation === 'b';

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  if (isFlipped) {
    files.reverse();
    ranks.reverse();
  }

  function handleSquareClick(square: Square) {
    if (!interactive) return;

    // If clicking same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // If a square is already selected, try to move
    if (selectedSquare) {
      const move = possibleMoves.find(m => m.to === square);
      if (move) {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }
    }

    // Select new piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
        // Check if this color matches our orientation (if restricted)
        // But in local play, we might play both.
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true }) as Move[];
        setPossibleMoves(moves);
    } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
    }
  }

  return (
    <div className="grid grid-cols-8 gap-0 border-4 border-slate-700 bg-slate-800 w-full max-w-[600px] aspect-square mx-auto shadow-2xl select-none">
      {ranks.map(rank => (
        files.map((file, colIndex) => {
          const square = (file + rank) as Square;
          const piece = game.get(square);
          const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 !== 0;
          
          const isSelected = selectedSquare === square;
          const isPossibleMove = possibleMoves.some(m => m.to === square);
          const isCapture = isPossibleMove && piece;

          return (
            <div
              key={square}
              onClick={() => handleSquareClick(square)}
              className={clsx(
                "relative flex items-center justify-center text-4xl sm:text-5xl cursor-pointer transition-colors duration-150",
                isLight ? "bg-[#769656] text-[#eeeed2]" : "bg-[#eeeed2] text-[#769656]",
                isSelected && "ring-inset ring-4 ring-yellow-400",
                !isSelected && isPossibleMove && !isCapture && "after:content-[''] after:w-3 after:h-3 after:bg-black/20 after:rounded-full",
                !isSelected && isCapture && "ring-inset ring-4 ring-red-400/50"
              )}
            >
               {/* Rank/File Labels for corners */}
               {file === (isFlipped ? 'h' : 'a') && (
                 <span className={clsx("absolute top-0.5 left-0.5 text-[10px] font-bold", isLight ? "text-[#eeeed2]" : "text-[#769656]")}>
                   {rank}
                 </span>
               )}
               {rank === (isFlipped ? '8' : '1') && (
                 <span className={clsx("absolute bottom-0.5 right-0.5 text-[10px] font-bold", isLight ? "text-[#eeeed2]" : "text-[#769656]")}>
                   {file}
                 </span>
               )}

               {piece && (
                 <span className={clsx(
                   "drop-shadow-md transform hover:scale-105 transition-transform",
                   piece.color === 'w' ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" : "text-black"
                 )}>
                   {PIECES[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                 </span>
               )}
            </div>
          );
        })
      ))}
    </div>
  );
}