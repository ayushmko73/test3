import { useState } from 'react';
import { GameSetup } from './components/GameSetup';
import { ChessBoardGame } from './components/ChessBoardGame';
import { Difficulty } from './lib/chessAI';

export type GameMode = 'local' | 'ai' | 'multiplayer';

function App() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleStartGame = (mode: GameMode, level?: Difficulty, room?: string) => {
    setGameMode(mode);
    if (level) setDifficulty(level);
    if (room) setRoomId(room);
  };

  const handleBack = () => {
    setGameMode(null);
    setRoomId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-100 flex items-center gap-3 justify-center">
           ♔ Forge Chess
        </h1>
        <p className="text-slate-400 mt-2">Master the board, conquer the AI, or challenge the world.</p>
      </header>

      <main className="w-full max-w-4xl">
        {!gameMode ? (
          <GameSetup onStart={handleStartGame} />
        ) : (
          <ChessBoardGame 
            mode={gameMode} 
            difficulty={difficulty} 
            roomId={roomId}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}

export default App;