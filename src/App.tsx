import { Client } from 'boardgame.io/react';
import { Local } from 'boardgame.io/multiplayer';
import { MyCardGame } from './game/Game';
import { CardGameBoard } from './components/Board';

// 初始化遊戲客戶端
// debug: true 會在畫面右邊開啟一個很強大的除錯工具
const CardGameClient = Client({
  game: MyCardGame,
  board: CardGameBoard,
  multiplayer: Local(), // 單機雙人模式 (會在同一個瀏覽器跑兩個客戶端)
  debug: true, 
});

function App() {
  return (
    <div className="w-full h-full">
      {/* 這裡模擬兩個玩家視角，方便你開發時自己跟自己打 */}
      <div className="flex flex-row h-screen">
        <div className="w-1/2 border-r border-gray-700">
          <CardGameClient playerID="0" />
        </div>
        <div className="w-1/2">
          <CardGameClient playerID="1" />
        </div>
      </div>
    </div>
  );
}

export default App;