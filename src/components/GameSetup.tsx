import { useState } from 'react';
import { Difficulty } from '../lib/chessAI';
import { Swords, Bot, Globe, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  onStart: (mode: 'local' | 'ai' | 'multiplayer', level?: Difficulty, roomId?: string) => void;
}

export function GameSetup({ onStart }: Props) {
  const [aiLevel, setAiLevel] = useState<Difficulty>('Easy');
  const [isCreating, setIsCreating] = useState(false);
  const [joinId, setJoinId] = useState('');

  const createMultiplayerGame = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .insert([{ fen: 'start', status: 'waiting' }])
        .select()
        .single();
      
      if (error) throw error;
      if (data) onStart('multiplayer', undefined, data.id);
    } catch (err) {
      console.error('Error creating game:', err);
      alert('Failed to create multiplayer game. Check Supabase config.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Local Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => onStart('local')}>
        <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20">
          <Swords className="text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Pass & Play</h3>
        <p className="text-slate-400 text-sm">Two players on the same device.</p>
      </div>

      {/* AI Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative">
        <div className="h-12 w-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
          <Bot className="text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Vs Computer</h3>
        <p className="text-slate-400 text-sm mb-4">Challenge our engine.</p>
        
        <div className="space-y-2">
          {(['Beginner', 'Easy', 'Hard', 'Master'] as Difficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => setAiLevel(level)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex justify-between items-center ${aiLevel === level ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-750'}`}
            >
              {level}
              {aiLevel === level && <ChevronRight size={16} />}
            </button>
          ))}
        </div>
        <button 
          onClick={() => onStart('ai', aiLevel)}
          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-medium transition-colors"
        >
          Start Game
        </button>
      </div>

      {/* Multiplayer Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
          <Globe className="text-purple-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Online Multiplayer</h3>
        <p className="text-slate-400 text-sm mb-4">Play with friends remotely.</p>
        
        <button 
          onClick={createMultiplayerGame}
          disabled={isCreating}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-2 rounded-lg font-medium mb-4 flex justify-center items-center gap-2"
        >
          {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Create New Game'}
        </button>

        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Game ID..."
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          />
          <button 
            onClick={() => joinId && onStart('multiplayer', undefined, joinId)}
            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}