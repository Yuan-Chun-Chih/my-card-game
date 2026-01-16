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
  
  // [新增] 用來強制重置遊戲的 key
  // 每次這個 ID 改變，CardGameClient 就會被視為全新的組件重新掛載
  const [gameSessionId, setGameSessionId] = useState(0);

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

  // [新增] 開始單機遊戲的專用函式
  const startSinglePlayer = () => {
    // 讓 ID +1，強制產生新的 matchID 和 key
    setGameSessionId((prev) => prev + 1);
    setScreen('single');
  };

  if (screen === 'menu') {
    return (
      <MainMenu 
        onSelect={(next) => {
          if (next === 'single') {
            startSinglePlayer();
          } else {
            setScreen(next);
          }
        }} 
        onExit={handleExit} 
      />
    );
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
          {/* [關鍵修改] 加上 key 與 matchID */}
          {/* key 改變會觸發 React 卸載舊組件 */}
          {/* matchID 改變會讓 boardgame.io 建立新的遊戲實例 (觸發 setup) */}
          <CardGameClient 
            key={`p0-${gameSessionId}`} 
            matchID={`local-match-${gameSessionId}`} 
            playerID="0" 
          />
        </div>
        <div className="w-full lg:w-1/2">
          <CardGameClient 
            key={`p1-${gameSessionId}`} 
            matchID={`local-match-${gameSessionId}`} 
            playerID="1" 
          />
        </div>
      </div>
    </div>
  );
}

export default App;