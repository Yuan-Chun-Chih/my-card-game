import { useMemo, useState } from 'react';
import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { MyCardGame } from './game/Game';
import { CardGameBoard } from './components/Board';
import { MainMenu } from './screens/MainMenu';
import { DeckEditor } from './screens/DeckEditor';
import { OnlineLobby } from './screens/OnlineLobby';
import './App.css';

type Screen = 'menu' | 'single' | 'online' | 'deck';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');

  const CardGameClient = useMemo(
    () =>
      Client({
        game: MyCardGame,
        board: CardGameBoard,
        multiplayer: Local(),
        debug: true
      }),
    []
  );

  const handleExit = () => {
    if (typeof window !== 'undefined' && window.close) {
      window.close();
    } else {
      setScreen('menu');
    }
  };

  if (screen === 'menu') {
    return <MainMenu onSelect={(next) => setScreen(next)} onExit={handleExit} />;
  }

  if (screen === 'deck') {
    return <DeckEditor onBack={() => setScreen('menu')} />;
  }

  if (screen === 'online') {
    return <OnlineLobby onBack={() => setScreen('menu')} />;
  }

  return (
    <div className="w-full h-full bg-black">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Aether Nexus</div>
        <button
          onClick={() => setScreen('menu')}
          className="text-xs uppercase tracking-widest text-gray-300 hover:text-white transition-colors"
        >
          Back to Menu
        </button>
      </div>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-800">
          <CardGameClient playerID="0" />
        </div>
        <div className="w-full lg:w-1/2">
          <CardGameClient playerID="1" />
        </div>
      </div>
    </div>
  );
}

export default App;
