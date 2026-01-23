import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Chess, Move } from 'chess.js';
import Board from '../components/Board';
import { getBestMove, Difficulty } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { Copy, ArrowLeft, RefreshCw } from 'lucide-react';

export default function GameRoom() {
  const { mode, gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState(new Chess());
  const [status, setStatus] = useState<string>('active');
  const [playerRole, setPlayerRole] = useState<'w' | 'b' | 'spectator'>('w');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('Easy');
  
  // For online sync
  const gameIdRef = useRef<string | null>(gameId || null);

  // Initialize
  useEffect(() => {
    const level = searchParams.get('level') as Difficulty;
    if (level) setAiDifficulty(level);

    if (mode === 'local') {
      setPlayerRole('w'); // In local, we toggle interactivity dynamically or allow both
    } else if (mode === 'ai') {
      setPlayerRole('w'); // Player is always white vs AI for simplicity here
    } else if (gameId) {
      // Online initialization
      const role = searchParams.get('role');
      setPlayerRole(role === 'white' ? 'w' : 'b');
      loadOnlineGame();
      subscribeToGame();
    }
  }, [mode, gameId]);

  // AI Logic
  useEffect(() => {
    if (mode === 'ai' && game.turn() === 'b' && !game.isGameOver()) {
      const timeout = setTimeout(() => {
        const bestMove = getBestMove(new Chess(game.fen()), aiDifficulty);
        if (bestMove) {
          safeMove(bestMove);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [game.fen(), mode]);

  function safeMove(moveStr: string | { from: string; to: string; promotion?: string }) {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(moveStr);
      if (result) {
        setGame(gameCopy);
        checkGameOver(gameCopy);
        if (gameId) updateOnlineGame(gameCopy);
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  function handleBoardMove(from: string, to: string) {
    // Validate turn
    if (mode === 'ai' && game.turn() !== 'w') return;
    if (gameId && game.turn() !== playerRole) return;

    safeMove({ from, to, promotion: 'q' }); // Auto promote to queen for simplicity
  }

  function checkGameOver(g: Chess) {
    if (g.isGameOver()) {
      if (g.isCheckmate()) setStatus(`Checkmate! ${g.turn() === 'w' ? 'Black' : 'White'} wins.`);
      else if (g.isDraw()) setStatus('Draw!');
      else setStatus('Game Over');
    }
  }

  // --- Online Logic ---
  async function loadOnlineGame() {
    if (!gameId) return;
    const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (data) {
        const remoteGame = new Chess(data.fen);
        setGame(remoteGame);
        checkGameOver(remoteGame);
    }
  }

  async function updateOnlineGame(g: Chess) {
    if (!gameId) return;
    await supabase.from('games').update({
      fen: g.fen(),
      pgn: g.pgn(),
      turn: g.turn()
    }).eq('id', gameId);
  }

  function subscribeToGame() {
    if (!gameId) return;
    const channel = supabase.channel(`game_${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
        const newFen = payload.new.fen;
        if (newFen !== game.fen()) {
          const newGame = new Chess(newFen);
          setGame(newGame);
          checkGameOver(newGame);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Clipboard
  function copyLink() {
    const url = `${window.location.origin}/play/online/${gameId}?role=black`; // Opponent link
    navigator.clipboard.writeText(url);
    alert('Link copied! Send it to your friend.');
  }

  return (
    <div className="flex flex-col items-center p-4 gap-6 w-full max-w-6xl mx-auto">
      {/* Header Controls */}
      <div className="w-full flex justify-between items-center">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" /> Exit
        </button>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 font-mono">
          {mode === 'ai' ? `vs AI (${aiDifficulty})` : mode === 'local' ? 'Local Game' : 'Online Match'}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full">
        {/* Board */}
        <div className="w-full max-w-[600px]">
           <Board 
             game={game} 
             onMove={handleBoardMove} 
             orientation={playerRole === 'b' ? 'b' : 'w'} 
             interactive={status === 'active' || !game.isGameOver()}
           />
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2 text-amber-500">Game Status</h3>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-slate-400">Turn</span>
                 <span className="font-bold uppercase px-2 py-1 bg-slate-700 rounded">
                    {game.turn() === 'w' ? 'White' : 'Black'}
                 </span>
               </div>

               {gameId && (
                 <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-200 mb-2">Invite Opponent</p>
                    <button onClick={copyLink} className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded w-full justify-center transition-colors">
                       <Copy className="w-3 h-3" /> Copy Player 2 Link
                    </button>
                 </div>
               )}

               {game.isGameOver() && (
                 <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center">
                    <p className="text-red-200 font-bold animate-pulse">{status}</p>
                    <button 
                      onClick={() => setGame(new Chess())} 
                      className="mt-3 flex items-center justify-center gap-2 text-sm bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full"
                    >
                       <RefreshCw className="w-4 h-4" /> Rematch
                    </button>
                 </div>
               )}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex-grow">
            <h3 className="text-lg font-bold mb-2 text-slate-300">History</h3>
            <div className="h-48 overflow-y-auto text-sm font-mono text-slate-400 p-2 bg-slate-900 rounded border border-slate-800">
                {game.history().map((move, i) => (
                    <span key={i} className="inline-block mr-2">
                        {(i % 2 === 0) ? `${Math.floor(i/2) + 1}.` : ''} <span className="text-slate-200">{move}</span>
                    </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}