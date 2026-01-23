import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Swords, User, Cpu, Globe } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function createOnlineGame() {
    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .insert([{ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', status: 'waiting' }])
      .select()
      .single();
    
    setLoading(false);
    if (error) {
      console.error(error);
      alert('Failed to create game. Check Supabase connection.');
      return;
    }
    
    if (data) {
      navigate(`/play/online/${data.id}?role=white`);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 gap-8">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
          Master Chess
        </h2>
        <p className="text-slate-400 text-lg">Choose your battlefield</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Local PvP */}
        <Link to="/play/local" 
          className="group bg-slate-800 hover:bg-slate-700 p-8 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-all shadow-xl flex flex-col items-center gap-4"
        >
          <div className="p-4 bg-amber-500/10 rounded-full group-hover:scale-110 transition-transform">
            <User className="w-12 h-12 text-amber-500" />
          </div>
          <h3 className="text-2xl font-bold">Pass & Play</h3>
          <p className="text-slate-400 text-center">Two players on one device</p>
        </Link>

        {/* VS AI */}
        <div className="flex flex-col gap-4">
             <Link to="/play/ai?level=Beginner" 
              className="bg-slate-800 hover:bg-slate-700 p-6 rounded-xl border border-slate-700 flex items-center gap-4 transition-all"
            >
              <Cpu className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="font-bold">VS Beginner AI</h3>
                <p className="text-xs text-slate-400">Just learning</p>
              </div>
            </Link>
            <Link to="/play/ai?level=Hard" 
              className="bg-slate-800 hover:bg-slate-700 p-6 rounded-xl border border-slate-700 flex items-center gap-4 transition-all"
            >
              <Swords className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-bold">VS Master AI</h3>
                <p className="text-xs text-slate-400">Prepare to lose</p>
              </div>
            </Link>
        </div>

        {/* Online */}
        <button 
          onClick={createOnlineGame}
          disabled={loading}
          className="md:col-span-2 group bg-gradient-to-br from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 p-8 rounded-2xl border border-indigo-500/30 hover:border-indigo-400 transition-all shadow-xl flex flex-col items-center gap-4"
        >
          <div className="p-4 bg-indigo-500/10 rounded-full group-hover:rotate-12 transition-transform">
            <Globe className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold">
            {loading ? 'Creating Arena...' : 'Create Online Game'}
          </h3>
          <p className="text-slate-400">Challenge a friend remotely</p>
        </button>
      </div>
    </div>
  );
}