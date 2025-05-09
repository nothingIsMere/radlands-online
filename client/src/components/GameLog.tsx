import React, { useRef, useEffect } from 'react';
import './GameLog.css';

interface LogEntry {
  message: string;
  timestamp: string;
}

interface GameLogProps {
  entries: LogEntry[];
  isVisible: boolean;
}

const GameLog: React.FC<GameLogProps> = ({ entries, isVisible }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="game-log">
      <div className="game-log-header">
        <h3>Game Log</h3>
      </div>
      <div className="game-log-entries">
        {entries.length === 0 ? (
          <div className="empty-log">No events have occurred yet.</div>
        ) : (
          entries.map((entry, index) => {
            // Parse timestamp into a Date object
            const date = new Date(entry.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            return (
              <div key={index} className="log-entry">
                <div className="log-entry-time">{timeString}</div>
                <div className="log-entry-message">{entry.message}</div>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default GameLog;