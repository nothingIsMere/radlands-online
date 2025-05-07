# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radlands Online is a browser-based implementation of the Radlands card game, a two-player dueling card game set in a post-apocalyptic world. Players aim to destroy their opponent's three camps while protecting their own using people cards, events, and special abilities.

## Repository Structure

- `client/` - Frontend application code (React)
- `server/` - Backend server code (Node.js)
- `docs/` - Game rules, architecture, card documentation, and other resources
  - `GAME_RULES.md` - Complete game rules
  - `ARCHITECTURE.md` - Technical architecture
  - `CARDS/` - Detailed card information and analysis
  - `PROGRESS.md` - Development progress tracking

## Technical Architecture

### Core Game Models

- **Cards**: BaseCard → CampCard, PersonCard, EventCard
- **Effects System**: Different effect types (Damage, Restore, Draw, etc.)
- **Abilities**: Card abilities with targeting requirements
- **Game State**: Tracks players, cards, resources, and turn phases
- **Column Structure**: Organizes camps and people into columns

### Important Concepts

1. **Cards and Card Types**:
   - Camp cards (player's base that must be protected)
   - Person cards (protect camps and provide abilities)
   - Event cards (provide delayed effects)
   - Special cards (Water Silo and Raiders that start in play)

2. **Card States**:
   - Damaged/Undamaged
   - Protected/Unprotected
   - Ready/Not Ready
   - Destroyed (for camps)

3. **Game Flow**:
   - Event Phase (resolve and advance events)
   - Replenish Phase (draw card, collect water)
   - Actions Phase (play cards, use abilities, etc.)

4. **Resources**:
   - Water (main resource for playing cards and using abilities)
   - Extra water (temporary additional water for the turn)
   - Cards in hand

5. **Key Mechanics**:
   - Protection system (people protect camps and other people)
   - Event queue (countdown timer for events)
   - Targeting rules (many abilities require target selection)
   - Punk cards (facedown cards with no abilities)
   - Junk effects (discard card for immediate effect)

## Development Plan

1. Implement core game engine
2. Build card effect system
3. Create UI components for game board
4. Implement networking for multiplayer functionality

## UI Architecture

- Component-based architecture with React
- Player Areas (hand, camps, resources, event queue)
- Interactive Elements (card selection, targeting)
- Visual Indicators (card states, game phases)

## Important Game Rules

- Each player has 3 camps to protect
- Win by destroying all opponent camps
- Water tokens are the main resource
- People cards protect camps from damage
- Players share the same draw deck
- Cards can be junked from hand for quick effects
- Event cards take time to resolve based on queue position
- Some cards (Water Silo, Raiders) have special rules

## Complex Interactions

When implementing the game, pay special attention to:

1. Card interactions with multiple effects
2. Conditional abilities based on game state
3. Sequence handling during complex abilities
4. Temporary control transfers to opponents
5. Protection and targeting rules
6. Punk card behavior and conversions
7. Event queue management

## Technical Implementation Notes

1. State updates should be atomic and reversible (for future undo functionality)
2. Card effect execution needs robust validation
3. UI feedback should clearly indicate valid actions
4. Visual distinction for different card states is critical
5. Network protocol needs to handle asynchronous player actions