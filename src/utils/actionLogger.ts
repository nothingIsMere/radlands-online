// actionLogger.ts
import { GameActionType } from '@/types/actionTypes';

/**
 * Logs game actions for debugging, replay, and network synchronization
 */
export class ActionLogger {
  private actionLog: GameActionType[] = [];
  private logToConsole: boolean;
  
  constructor(logToConsole: boolean = true) {
    this.logToConsole = logToConsole;
  }
  
  /**
   * Log a new action
   */
  logAction(action: GameActionType): void {
    this.actionLog.push(action);
    
    if (this.logToConsole) {
      console.log('Game Action:', action);
    }
  }
  
  /**
   * Get the complete action log
   */
  getActionLog(): GameActionType[] {
    return [...this.actionLog];
  }
  
  /**
   * Clear the action log
   */
  clearLog(): void {
    this.actionLog = [];
  }
  
  /**
   * Get serialized action log (for network transmission)
   */
  getSerializedLog(): string {
    return JSON.stringify(this.actionLog);
  }
  
  /**
   * Get actions by player
   */
  getPlayerActions(playerId: 'left' | 'right'): GameActionType[] {
    return this.actionLog.filter(action => action.playerId === playerId);
  }
}

// Export a singleton instance for use throughout the app
export const gameLogger = new ActionLogger();
