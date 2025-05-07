import { useState } from 'react';
import './App.css';
import GameBoard from './components/gameBoard/GameBoard';
import CardDisplay from './components/CardDisplay';

function App() {
  const [showGameBoard, setShowGameBoard] = useState(true);
  const [showCardDisplay, setShowCardDisplay] = useState(false);

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="app-title">Radlands Online</div>
        <div className="nav-buttons">
          <button 
            className={`nav-button ${showGameBoard ? 'active' : ''}`}
            onClick={() => setShowGameBoard(!showGameBoard)}
          >
            {showGameBoard ? 'Hide' : 'Show'} Game Board
          </button>
          
          <button 
            className={`nav-button ${showCardDisplay ? 'active' : ''}`}
            onClick={() => setShowCardDisplay(!showCardDisplay)}
          >
            {showCardDisplay ? 'Hide' : 'Show'} Card Display
          </button>
        </div>
      </nav>

      <main>
        {showGameBoard && (
          <section className="game-section">
            <GameBoard />
          </section>
        )}

        {showCardDisplay && (
          <section className="cards-section">
            <CardDisplay />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;