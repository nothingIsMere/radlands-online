import { useState } from 'react';
import './App.css';
import CardDisplay from './components/CardDisplay';
import { CardType, TurnPhase, GameStatus } from './models';

function App() {
  const [showModelDetails, setShowModelDetails] = useState(false);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Radlands Online</h1>
        <p className="app-subtitle">A digital implementation of the post-apocalyptic card game</p>
      </header>

      <main>
        <section className="info-section">
          <p>
            Radlands is a competitive, dueling card game set in a post-apocalyptic world where players 
            aim to protect their camps while destroying their opponent's camps.
          </p>
          
          <button 
            className="toggle-button"
            onClick={() => setShowModelDetails(!showModelDetails)}
          >
            {showModelDetails ? 'Hide' : 'Show'} Data Models
          </button>
          
          {showModelDetails && (
            <div className="model-details">
              <h2>Core Data Models</h2>
              
              <div className="model-grid">
                <div className="model-section">
                  <h3>Card Types</h3>
                  <ul>
                    {Object.entries(CardType)
                      .filter(([key]) => isNaN(Number(key)))
                      .map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value}
                        </li>
                      ))
                    }
                  </ul>
                </div>
                
                <div className="model-section">
                  <h3>Game Phases</h3>
                  <ul>
                    {Object.entries(TurnPhase)
                      .filter(([key]) => isNaN(Number(key)))
                      .map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value}
                        </li>
                      ))
                    }
                  </ul>
                </div>
                
                <div className="model-section">
                  <h3>Game Status</h3>
                  <ul>
                    {Object.entries(GameStatus)
                      .filter(([key]) => isNaN(Number(key)))
                      .map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {value}
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="cards-section">
          <CardDisplay />
        </section>
      </main>

      <footer>
        <p>Radlands Online &copy; 2025 - A digital adaptation of the Radlands card game</p>
      </footer>
    </div>
  );
}

export default App;