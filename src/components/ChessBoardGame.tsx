import { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { GameMode } from '../App';
import { Difficulty, getBestMove } from '../lib/chessAI';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Copy, RotateCcw } from 'lucide-react';

interface Props {
  mode: GameMode;
  difficulty?: Difficulty;
  roomId?: string | null;
  onBack: () => void;
}

export function ChessBoardGame({ mode, difficulty = 'Easy', roomId, onBack }: Props) {
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState<string>('');
  const [fen, setFen] = useState(game.fen());
  
  // Multiplayer specific
  const [playerColor, setPlayerColor] = useState<'w'|'b'>('w');
  const [isConnected, setIsConnected] = useState(false);

  // Check game status
  useEffect(() => {
    if (game.isCheckmate()) setStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`);
    else if (game.isDraw()) setStatus('Draw!');
    else if (game.isGameOver()) setStatus('Game Over.');
    else setStatus(`${game.turn() === 'w' ? 'White' : 'Black'}'s Turn`);
  }, [fen]);

  // AI Move Effect
  useEffect(() => {
    if (mode === 'ai' && game.turn() === 'b' && !game.isGameOver()) {
      const timeout = setTimeout(() => {
        const bestMove = getBestMove(game, difficulty);
        if (bestMove) {
          makeMove(bestMove);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [fen, mode, difficulty]);

  // Multiplayer Subscription
  useEffect(() => {
    if (mode === 'multiplayer' && roomId) {
      // Subscribe to changes
      const channel = supabase.channel(`game:${roomId}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${roomId}` }, 
          (payload) => {
            const newFen = payload.new.fen;
            if (newFen && newFen !== game.fen()) {
              const newGame = new Chess(newFen);
              setGame(newGame);
              setFen(newFen);
            }
          }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') setIsConnected(true);
        });

      // Initial fetch
      supabase.from('games').select('fen').eq('id', roomId).single()
        .then(({ data }) => {
          if (data && data.fen !== 'start') {
            const newGame = new Chess(data.fen);
            setGame(newGame);
            setFen(data.fen);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [mode, roomId]);

  function makeMove(move: any) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setFen(gameCopy.fen());
        
        if (mode === 'multiplayer' && roomId) {
          supabase.from('games').update({ fen: gameCopy.fen() }).eq('id', roomId).then();
        }
        return true;
      }
    } catch (e) { return false; }
    return false;
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (mode === 'ai' && game.turn() === 'b') return false;
    if (mode === 'multiplayer') {
       // Basic turn enforcement logic could go here
       // For demo, we allow both sides to move to test easily without auth context logic
    }

    return makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
  }

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    if (mode === 'multiplayer' && roomId) {
       supabase.from('games').update({ fen: newGame.fen() }).eq('id', roomId).then();
    }
  };

  const copyRoomId = () => {
    if (roomId) navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="font-bold text-lg text-emerald-400">
          {status}
        </div>
        <button onClick={resetGame} className="p-2 bg-slate-800 rounded hover:bg-slate-700 transition-colors" title="Reset Board">
          <RotateCcw size={20} />
        </button>
      </div>

      {mode === 'multiplayer' && roomId && (
        <div className="w-full flex justify-between items-center bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg text-sm">
           <span className="text-purple-300">Room ID: <span className="font-mono ml-2 text-white">{roomId}</span></span>
           <button onClick={copyRoomId} className="text-purple-300 hover:text-white"><Copy size={16} /></button>
        </div>
      )}

      <div className="w-full max-w-[600px] aspect-square shadow-2xl shadow-black rounded-lg overflow-hidden border-4 border-slate-800">
        <Chessboard 
          position={fen} 
          onPieceDrop={onDrop} 
          boardOrientation={mode === 'ai' ? 'white' : 'white'} 
          customDarkSquareStyle={{ backgroundColor: '#334155' }}
          customLightSquareStyle={{ backgroundColor: '#94a3b8' }}
        />
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg w-full text-slate-400 text-sm">
        <p>FEN: {fen}</p>
      </div>
    </div>
  );
}