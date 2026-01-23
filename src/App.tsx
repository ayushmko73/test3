import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h1 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                <span>♚</span> Forge Chess
            </h1>
        </header>
        <main className="flex-grow flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/play/:mode" element={<GameRoom />} />
            <Route path="/play/online/:gameId" element={<GameRoom />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;