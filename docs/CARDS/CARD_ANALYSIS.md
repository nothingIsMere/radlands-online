# Radlands Online - Card Analysis

## Purpose

This document provides a comprehensive analysis of every card in Radlands to support our online implementation. Each card is examined to identify:

1. Game state tracking requirements
2. Interaction patterns for abilities/effects
3. Edge cases and special handling requirements
4. Dependencies between cards or mechanics
5. Implementation notes for technical considerations

This analysis will help us anticipate implementation challenges before coding begins and avoid major refactoring later in development.

## Table of Contents

- [Camp Cards](#camp-cards)
- [Person Cards](#person-cards)
- [Event Cards](#event-cards)
- [Special Cards](#special-cards)
- [Implementation Priorities](#implementation-priorities)

---

## Camp Cards

### Railgun

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Basic damage ability  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 2 water
- Player selects an unprotected enemy card
- Selected card is damaged

#### Edge Cases
- Standard damage targeting rules apply
- One of the simplest camp abilities in the game

#### Dependencies
- Standard damage implementation

#### Implementation Notes
- Standard damage ability implementation
- Target validation for unprotected enemy card
- Good reference implementation for basic damage effects

### Atomic Garden

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Restore a damaged person and make them ready  

#### State Tracking Requirements
- Track damaged state of people
- Track ready/not ready status of people

#### Interaction Pattern
- Player activates ability for 2 water
- Player selects a damaged person
- Selected person is restored and becomes ready

#### Edge Cases
- Makes the person ready in addition to restoring (unique combination)
- Combines two effects in one ability
- Can target any damaged person, including those that just used their ability
- Can potentially allow a person to use their ability twice in one turn

#### Dependencies
- Interacts with damaged state and ready status
- Synergizes with high-value abilities that would normally only be usable once per turn

#### Implementation Notes
- Ensure both restore and ready status are applied
- Clear visual indication that person becomes ready
- Animation showing both the restoration and ready status change

### Cannon

**Type:** Camp  
**Initial Card Draw:** 2  
**Key Effects:** Damage ability that only works if undamaged, but starts the game damaged  

#### State Tracking Requirements
- Track damaged/undamaged state
- Special starting state (begins game damaged)

#### Interaction Pattern
- Player attempts to activate ability for 2 water
- System checks if card is undamaged
- If undamaged, allow targeting of an unprotected enemy card

#### Edge Cases
- Card starts the game in damaged state (unlike other camps)
- Ability can only be used after the camp has been restored

#### Dependencies
- Interacts with Restore effects
- Conditional ability based on card state

#### Implementation Notes
- Initialize this camp in damaged state during game setup
- Needs clear visual indicator of starting damaged state
- UI should disable ability when damaged

### Pillbox

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Damage ability with cost reduction based on destroyed camps  

#### State Tracking Requirements
- Track number of destroyed camps controlled by player
- Track current effective cost of ability
- Track changes to camp destruction states

#### Interaction Pattern
- System calculates current ability cost based on destroyed camps
- Display reduced cost to player (3 minus number of destroyed camps)
- If activated, allow targeting of unprotected enemy card

#### Edge Cases
- Cost recalculation needed whenever camp destruction state changes
- Cost reduction based on player's own destroyed camps
- Ability can cost as little as 0 water if all three camps are destroyed
- Cost calculation must happen at time of use, not at time of last state change

#### Dependencies
- Depends on camp destruction tracking
- Dynamic cost calculation
- Becomes more powerful as player is closer to losing

#### Implementation Notes
- Need dynamic cost display that updates when destroyed camp count changes
- Could use "Calculated Cost: X" in ability description when rendered
- Cost reduction should be clearly visible to player
- Consider special highlighting when cost becomes 0

### Scud Launcher

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Damage ability where opponent chooses the target  

#### State Tracking Requirements
- Track whose turn it is currently
- Track when control should pass to opponent for targeting

#### Interaction Pattern
- Player activates ability for 1 water
- Control temporarily passes to opponent
- Opponent selects one of their own cards to be damaged
- Control returns to active player

#### Edge Cases
- Temporary control transfer during active player's turn
- Opponent gets to choose which of their cards receives damage
- Need timeout handling for opponent selection

#### Dependencies
- Requires opponent interaction during active player's turn
- Unique implementation of targeting mechanics

#### Implementation Notes
- Need UI system for temporary opponent control
- Need timeout mechanism if opponent doesn't respond
- Visual indicator that opponent is selecting target
- Validation that opponent selected one of their own cards

### Victory Totem

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Damage ability and Raid ability  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player can choose between two abilities:
  - Damage for 2 water: Target an unprotected enemy card
  - Raid for 2 water: Play or advance Raiders event

#### Edge Cases
- Only camp with two distinct abilities
- Provides strategic options based on game state

#### Dependencies
- Raid ability interacts with Raiders event card
- Standard damage targeting

#### Implementation Notes
- Clear UI for ability selection
- Consistent handling of both abilities
- Visual distinction between the two ability options

### Catapult

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Damage ability that requires sacrificing one of your people  

#### State Tracking Requirements
- Track if player has at least one person in play

#### Interaction Pattern
- Player activates ability for 2 water
- Player selects any card to damage
- Then player must select one of their own people to destroy
- Both effects resolve sequentially

#### Edge Cases
- Damage can target any card (ignores protection)
- Player must have at least one person to use this ability
- Two-step selection process
- Required sacrifice after primary effect

#### Dependencies
- Interacts with targeting and destruction mechanics
- Requires player to have people in play

#### Implementation Notes
- Two-step selection UI
- Validation that player has people in play before enabling ability
- Clear indication that people selection is for destruction

### Nest of Spies

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Conditional damage based on playing 2+ people in a turn  

#### State Tracking Requirements
- Track how many people played this turn
- Track when turn started/ended

#### Interaction Pattern
- System tracks people played this turn (including Punks)
- Ability is only available if 2+ people played this turn
- Player activates ability for 1 water and selects target

#### Edge Cases
- Counts any 2 people (including Punks)
- If people are played then removed, they still count
- Counter resets at end of turn

#### Dependencies
- Interacts with people placement tracking
- Turn-based condition

#### Implementation Notes
- Turn-based counter for people played
- Dynamic ability availability based on counter
- Visual indicator showing current people played count

### Command Post

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Damage ability with cost reduction based on number of Punks  

#### State Tracking Requirements
- Track number of Punks controlled by player
- Track current effective cost of ability

#### Interaction Pattern
- System calculates current ability cost based on Punks in play
- Display reduced cost to player
- If activated, allow targeting of unprotected enemy card
- Cost can be reduced to 0

#### Edge Cases
- Cost recalculation needed whenever Punk count changes
- If temporary effects make cards into Punks, cost should update

#### Dependencies
- Depends on Punk tracking
- Dynamic cost calculation

#### Implementation Notes
- Need dynamic cost display that updates when Punk count changes
- Could use "Calculated Cost: X" in ability description when rendered
- Cost reduction should be clearly visible to player

### Obelisk

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Wins the game when the last card is drawn from the deck  

#### State Tracking Requirements
- Track deck emptying events
- Track which player controls Obelisk

#### Interaction Pattern
- When last card is drawn, check if any player has undamaged Obelisk
- If yes, that player wins immediately
- No direct player interaction with ability

#### Edge Cases
- If both players have Obelisk, need to determine which triggers first
- May need to handle redirected/prevented card draws
- Interaction with deck reshuffling (when deck runs out first time)

#### Dependencies
- Interacts with card draw mechanics
- Provides an alternative win condition

#### Implementation Notes
- Need hook on card draw events to check win condition
- Special win condition screen/animation
- Consider sequence if both players have Obelisk (active player first?)

### Mercenary Camp

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Damage any camp if you have 4+ people  

#### State Tracking Requirements
- Track number of people controlled by player (including punks)
- Track when people count changes (enter/leave play)

#### Interaction Pattern
- System checks if player has 4 or more people
- If condition met, ability becomes available
- Player activates ability for 2 water
- Player selects any enemy camp to damage (protected or unprotected)

#### Edge Cases
- Conditional on having sufficient people
- Can target any camp (even protected ones) - bypasses normal protection rules
- Ability dynamically becomes available/unavailable as people count changes
- Punks count toward the 4+ people requirement

#### Dependencies
- Interacts with people counting
- Conditional ability availability
- Bypasses protection mechanics

#### Implementation Notes
- Dynamic ability availability based on people count
- People counter that includes punks
- Clear visual indication of when ability is available
- Special targeting rules that ignore protection
- Visual feedback when ability becomes available after reaching 4 people

### Reactor

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Self-destruct ability that destroys all people  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 2 water
- This camp is destroyed and all people in play are destroyed

#### Edge Cases
- Mass destruction effect that drastically changes board state
- Affects both players' people
- Self-destruction of the camp

#### Dependencies
- Interacts with destruction mechanics

#### Implementation Notes
- Animation for global destruction effect
- Clear indication that it affects all people (both players)
- Confirm dialog due to major board impact

### The Octagon

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Forces both players to destroy one of their people  

#### State Tracking Requirements
- Track player selection sequence

#### Interaction Pattern
- Player activates ability for 1 water
- Player destroys one of their people
- Then opponent must destroy one of their people

#### Edge Cases
- If player has no people, they can't use the ability
- If opponent has no people, only player destroys one
- Temporary control transfer during active player's turn

#### Dependencies
- Requires opponent interaction during active player's turn
- Conditional effect based on board state

#### Implementation Notes
- Selection UI for both players
- Timeout handling for opponent selection
- Clear sequence indication

### Juggernaut

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Movement-based camp that destroys an opponent's camp after three moves  

#### State Tracking Requirements
- Current position state (home, position 1, position 2, position 3)
- People positions relative to Juggernaut (in front, behind)
- Track during position changes how people should be rearranged

#### Interaction Pattern
- Player activates ability for 1 water
- Juggernaut advances one space forward
- After third activation, returns to original position and triggers opponent camp destruction
- Opponent must select one of their camps to destroy

#### Edge Cases
- When destroyed, it is placed facedown in camp row
- People in front must be moved appropriately
- People behind Juggernaut are protected as if behind another person
- When Juggernaut moves, people's relative positions must be maintained
- If a column already has 2 people and Juggernaut with 1 person behind it moves into that column, special handling needed

#### Dependencies
- Interacts with protection mechanics
- Affects column structure and card positioning
- Unique implementation of the "protected" concept

#### Implementation Notes
- Requires a special column state model that tracks Juggernaut's current position
- Need visual indicators for Juggernaut's current position
- Animation requirements for movement
- Special UI for showing protected status behind Juggernaut

### Scavenger Camp

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Discard a card for a punk or extra water  

#### State Tracking Requirements
- Track hand state for available cards
- Track discard selection and chosen effect

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects a card from hand to discard (not Water Silo)
- Player chooses either gain a punk or gain extra water
- Selected effect resolves

#### Edge Cases
- Zero water cost but requires discarding a card (resource conversion)
- Cannot discard Water Silo (explicit restriction)
- Choice between two different effects (flexibility)
- Works even if player has no cards in hand to discard (ability would be unavailable)

#### Dependencies
- Interacts with hand management
- Interacts with punk and water mechanics
- Provides resource conversion options

#### Implementation Notes
- Two-step selection UI (discard card, then choose effect)
- Validation to prevent discarding Water Silo
- Clear UI for choosing between effects
- Zero-cost ability handling
- Visual distinction between the two possible outcomes
- Disable ability if no valid cards to discard

### Outpost

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Raid ability and restore ability  

#### State Tracking Requirements
- Track Raiders event card status
- Track damaged cards that can be restored

#### Interaction Pattern
- Player can choose between two abilities:
  - Raid for 2 water: Play or advance Raiders event
  - Restore for 2 water: Select a damaged card to restore

#### Edge Cases
- Two distinct abilities with different purposes (offensive and defensive)
- Standard raid and restore mechanics apply
- Both abilities have the same water cost (2)
- Provides tactical flexibility based on game situation

#### Dependencies
- Interacts with Raiders event card
- Interacts with restoration mechanics
- Balanced card with two common but useful effects

#### Implementation Notes
- Clear UI for ability selection
- Standard raid handling
- Standard restore implementation
- Visual distinction between the two ability options
- Consider grouping with other multi-ability camps like Victory Totem

### Transplant Lab

**Type:** Camp  
**Initial Card Draw:** 2  
**Key Effects:** Conditional restore based on playing 2+ people in a turn  

#### State Tracking Requirements
- Track how many people played this turn
- Track when turn started/ended

#### Interaction Pattern
- System tracks people played this turn (including Punks)
- Ability is only available if 2+ people played this turn
- Player activates ability for 1 water and selects damaged card to restore
- Cannot target itself

#### Edge Cases
- Counts any 2 people (including Punks)
- Cannot restore itself (explicit rule)
- Counter resets at end of turn

#### Dependencies
- Interacts with people placement tracking
- Turn-based condition

#### Implementation Notes
- Turn-based counter for people played
- Dynamic ability availability based on counter
- Visual indicator showing current people played count
- Target validation to prevent self-targeting

### Resonator

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Cheap damage ability that restricts other ability usage  

#### State Tracking Requirements
- Track if player has used any other abilities this turn
- Track if this ability has been used this turn

#### Interaction Pattern
- Player can activate ability for only 1 water
- If activated, player cannot use any other abilities for the turn
- If other abilities have been used, this ability is unavailable

#### Edge Cases
- Restriction applies to all abilities (camp and people)
- Once used, all other abilities should be disabled for the turn
- If used, ability should be clearly marked as restricting other abilities

#### Dependencies
- Interacts with ability usage tracking
- Turn-based restriction

#### Implementation Notes
- Turn-based flag for ability usage
- UI to disable all other abilities when this is used
- Clear visual indication of the restriction when active

### Bonfire

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Self-damage to restore any number of cards, cannot be restored itself  

#### State Tracking Requirements
- Track that this card cannot be restored (permanent trait)

#### Interaction Pattern
- Player activates ability for 0 water
- This card is automatically damaged
- Player selects any number of damaged cards to restore
- All selected cards are restored

#### Edge Cases
- Zero water cost but has a self-damage drawback
- Card has a trait preventing it from being restored
- Multi-selection for unlimited targets
- If already damaged, using ability will destroy it

#### Dependencies
- Interacts with restoration mechanics
- Self-damage mechanic

#### Implementation Notes
- Multi-selection UI for targets
- Permanent trait flag for "cannot be restored"
- Clear warning if using when already damaged (will destroy)
- Zero-cost ability handling

### Cache

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Raid and gain a punk in one ability  

#### State Tracking Requirements
- Track Raiders event card status
- Track punk placement

#### Interaction Pattern
- Player activates ability for 2 water
- Raiders card is played or advanced according to raid rules
- Player also automatically gains a punk
- Player selects placement for the new punk

#### Edge Cases
- Combines two separate effects in one ability for efficiency
- Both effects execute regardless of board state
- If there's no room for the punk, player must destroy an existing person
- Standard raid mechanics apply

#### Dependencies
- Interacts with Raiders event card
- Interacts with punk mechanics
- Combines offensive and resource-generation effects

#### Implementation Notes
- Sequential resolution (raid effect then punk gain)
- Animation for both effects
- Standard raid handling
- UI for punk placement selection
- Handle edge case where columns are full

### Watchtower

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Damage if any event resolved this turn  

#### State Tracking Requirements
- Track events resolved this turn (from either player)
- Track when turn started/ended
- Track event resolution source (Raiders, 0-queue, normal queue)

#### Interaction Pattern
- System tracks if any event has resolved this turn (including Raiders and 0 events)
- If any event has resolved, ability becomes available
- Player activates ability for 1 water
- Player selects an unprotected enemy card to damage

#### Edge Cases
- Condition depends on events from either player
- Raiders events explicitly count
- 0-queue events explicitly count
- Condition depends on resolution, not just advancement
- Counter resets at end of turn

#### Dependencies
- Interacts with event resolution tracking
- Turn-based condition
- Reactive to opponent's events as well as player's events

#### Implementation Notes
- Turn-based flag for event resolution
- Dynamic ability availability based on event resolution
- Clear visual indication of when ability is available
- Visual history of events that have resolved this turn
- Enable ability immediately when any event resolves

### Construction Yard

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Move any person to any place and raid ability  

#### State Tracking Requirements
- Track valid placement locations for people
- Track current column configurations

#### Interaction Pattern
- Player can choose between two abilities:
  - Move person for 1 water: Player selects a person and a new valid location
  - Raid for 2 water: Play or advance Raiders event

#### Edge Cases
- Can move any person to any valid location on their side of the board
- Can move protected or unprotected people
- People can be pushed in front of or behind existing people
- Can move people between columns
- Can reorganize protection status by moving people
- Can move people to or from Juggernaut column

#### Dependencies
- Interacts with column structure
- Interacts with protection mechanics
- Interacts with Raiders event card
- Potential complex interaction with Juggernaut

#### Implementation Notes
- UI for selecting person and new placement location
- Validation for valid placement locations
- Animation for person movement
- Standard raid handling
- Clear indication of new protection status after movement
- Special handling for Juggernaut column interactions

### Adrenaline Lab

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Use ability of damaged person for free, then destroy it  

#### State Tracking Requirements
- Track damaged state of all player's people
- Track available abilities on damaged people

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects a damaged person with an ability
- Player pays the water cost of the selected person's ability
- Selected ability resolves
- Selected person is destroyed

#### Edge Cases
- Only works on damaged people
- Can use ability of a person that already used its ability this turn
- Requires paying the original ability's water cost
- Destroys the person after using ability

#### Dependencies
- Complex interaction with other card abilities
- Interacts with damaged state tracking

#### Implementation Notes
- Ability selection UI limited to damaged people
- Dynamic cost display (free camp ability, pay for person ability)
- Sequential resolution (use ability, then destroy)
- Reference resolution ("this" in copied ability refers to the person)

### Mulcher

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Destroy one of your people to draw a card  

#### State Tracking Requirements
- Track if player has at least one person in play
- Track sacrifice selection

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects one of their people to destroy
- Selected person is destroyed and player draws a card

#### Edge Cases
- Requires having at least one person to sacrifice (explicit rule)
- Zero water cost but has a sacrifice drawback
- Cannot be used without a valid sacrifice target
- Converting a person into a card (resource conversion)

#### Dependencies
- Interacts with destruction mechanics
- Interacts with card draw mechanics
- Card economy management

#### Implementation Notes
- Validation that player has people in play before enabling ability
- Zero-cost ability handling
- Clear indication of the sacrifice requirement
- Explicit UI feedback if attempting to use without valid sacrifice targets
- Animation showing the conversion of person to card

### Blood Bank

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Destroy one of your people to gain extra water  

#### State Tracking Requirements
- Track if player has at least one person in play
- Track sacrifice selection

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects one of their people to destroy
- Selected person is destroyed and player gains extra water

#### Edge Cases
- Requires having at least one person to sacrifice (explicit rule)
- Zero water cost but has a sacrifice drawback
- Cannot be used without a valid sacrifice target
- Converting a person into water (resource conversion)

#### Dependencies
- Interacts with destruction mechanics
- Interacts with water resource mechanics
- Resource management strategy

#### Implementation Notes
- Validation that player has people in play before enabling ability
- Zero-cost ability handling
- Clear indication of the sacrifice requirement
- Explicit UI feedback if attempting to use without valid sacrifice targets
- Animation showing the conversion of person to water resource

### Arcade

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Gain a punk if player has 0-1 people  

#### State Tracking Requirements
- Track number of people controlled by player (including punks)
- Track changes to people count

#### Interaction Pattern
- System checks if player has 0 or 1 people total
- If condition met, ability becomes available
- Player activates ability for 1 water
- Player automatically gains a punk

#### Edge Cases
- Punks count as people for this ability's condition (explicit rule)
- Condition depends on current board state
- The gained punk will make the ability unavailable (self-limiting)
- Recovery mechanism for players with few people

#### Dependencies
- Interacts with people counting
- Conditional ability availability
- Provides comeback potential

#### Implementation Notes
- Dynamic ability availability based on people count
- People counter that includes punks
- Clear visual indication of when ability is available
- Update availability immediately after gaining the punk
- Highlight as a recovery option when player is behind

### Training Camp

**Type:** Camp  
**Initial Card Draw:** 2  
**Key Effects:** Damage if you have 2 people in this camp's column  

#### State Tracking Requirements
- Track number of people in this camp's column
- Track changes to column composition

#### Interaction Pattern
- System checks if this column has exactly 2 people
- If condition met, ability becomes available
- Player activates ability for 2 water
- Player selects an unprotected enemy card to damage

#### Edge Cases
- Condition depends on column-specific state (not global people count)
- Must have exactly 2 people in column (not 1, not 0, not 3)
- Condition updates whenever column composition changes
- Encourages concentrating people in one column

#### Dependencies
- Interacts with column structure
- Conditional ability availability
- Strategic placement of people

#### Implementation Notes
- Dynamic ability availability based on column state
- Clear visual indication of when ability is available
- Column-specific people counter
- Visual highlighting of the column when condition is met
- Consider special column highlighting when dragging people to show potential activation

### Supply Depot

**Type:** Camp  
**Initial Card Draw:** 2  
**Key Effects:** Draw 2 cards then discard one of them  

#### State Tracking Requirements
- Track which cards were drawn by this effect

#### Interaction Pattern
- Player activates ability for 2 water
- Player automatically draws 2 cards
- Player must select one of these newly drawn cards to discard
- Selected card is discarded

#### Edge Cases
- Selection must be from the newly drawn cards only
- Ensures net +1 card advantage

#### Dependencies
- Interacts with card draw and discard mechanics

#### Implementation Notes
- UI highlighting the newly drawn cards for selection
- Validation that discarded card is one of the newly drawn ones
- Clear indication of which cards are eligible for discard

### Omen Clock

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Advance any event by 1 queue position  

#### State Tracking Requirements
- Track events in both players' queues
- Track availability of spaces in event queues

#### Interaction Pattern
- Player activates ability for 1 water
- Player selects any event in either player's queue
- Selected event advances 1 space forward if space is available

#### Edge Cases
- Can target opponent's events
- Cannot advance if next space is occupied
- Cannot advance if event is already in position 1
- When opponent's event is advanced and resolves, it remains their event

#### Dependencies
- Interacts with event queue mechanics
- Can affect opponent's events

#### Implementation Notes
- Complex targeting UI showing both players' event queues
- Validation for available space in queue
- Clear indication that advancing opponent's events is possible
- Handle ownership properly when events resolve

### Warehouse

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Conditional restore if opponent has an unprotected camp  

#### State Tracking Requirements
- Track protection status of opponent's camps

#### Interaction Pattern
- System checks if opponent has at least one unprotected camp
- If condition met, ability becomes available
- Player activates ability for 1 water
- Player selects a damaged card to restore

#### Edge Cases
- Condition depends on opponent's board state
- Standard restore targeting applies

#### Dependencies
- Interacts with protection mechanics
- Conditional ability availability

#### Implementation Notes
- Dynamic ability availability based on opponent's board state
- Clear visual indication of when ability is available
- Standard restore implementation

### Garage

**Type:** Camp  
**Initial Card Draw:** 0  
**Key Effects:** Basic raid ability  

#### State Tracking Requirements
- Track Raiders event card status

#### Interaction Pattern
- Player activates ability for 1 water
- Raiders card is played or advanced according to raid rules

#### Edge Cases
- Standard raid mechanics apply
- Low cost raid effect

#### Dependencies
- Interacts with Raiders event card
- Standard raid implementation

#### Implementation Notes
- Standard raid handling
- Animation for Raiders advancement
- Clear visualization of Raiders event status

### Oasis

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Discount for playing people in this column if empty  

#### State Tracking Requirements
- Track number of people in this camp's column
- Track people play costs dynamically

#### Interaction Pattern
- System continuously checks if column has no people
- If empty, ability becomes active
- When player plays a person to this column, cost is reduced by 1
- Cost reduction disappears if column becomes occupied

#### Edge Cases
- Passive trait that doesn't require activation
- Dynamic cost reduction based on column state
- Minimum cost is still 0 (can't go negative)

#### Dependencies
- Interacts with people placement mechanics
- Dynamic cost calculation

#### Implementation Notes
- Visual indicator when column is empty and discount is available
- Dynamic cost display when dragging a person over this column
- Cost recalculation whenever column state changes

### Parachute Base

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Play a person and use their ability immediately, then damage them  

#### State Tracking Requirements
- Track hand state for available people
- Track ability usage sequence

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects a person card from hand
- Player pays water cost to play selected person
- Person enters play and is immediately ready
- Player selects and pays for one of the person's abilities
- Ability resolves
- Person is automatically damaged

#### Edge Cases
- Complex multi-step sequence
- Person is ready immediately (bypasses normal "not ready when played" rule)
- Person is damaged after ability use
- Zero water cost for camp ability, but requires paying person and ability costs

#### Dependencies
- Interacts with people placement, ability usage, and damage mechanics

#### Implementation Notes
- Multi-step selection UI
- Special ready state handling for immediate ability use
- Sequential resolution of play, ability use, and damage
- Clear cost indications for each step

### Labor Camp

**Type:** Camp  
**Initial Card Draw:** 1  
**Key Effects:** Destroy one of your people to restore a card  

#### State Tracking Requirements
- Track if player has at least one person in play

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects one of their people to destroy
- Player selects a damaged card to restore (cannot be Labor Camp itself)
- Selected person is destroyed and selected card is restored

#### Edge Cases
- Cannot restore itself (explicit rule)
- Requires having at least one person to sacrifice
- Zero water cost but has a sacrifice drawback
- Two-step selection process

#### Dependencies
- Interacts with destruction and restoration mechanics

#### Implementation Notes
- Two-step selection UI
- Validation that player has people in play before enabling ability
- Target validation to prevent self-targeting for restoration
- Zero-cost ability handling

---

## Person Cards

### Looter

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Damage ability that grants card draw if it hits a camp  

#### State Tracking Requirements
- Track what type of card was damaged by ability
- Track when damage hits successfully

#### Interaction Pattern
- Player activates ability for 2 water
- Player selects an unprotected enemy target
- If target is a camp, player draws a card automatically

#### Edge Cases
- Need to check if target was a camp after damage is applied
- If target was about to be damaged but was protected by a new effect, draw should not happen

#### Dependencies
- Interacts with camp targeting
- Conditional card draw effect

#### Implementation Notes
- Need to check card type of damaged target
- Success check for damage effect
- Card draw animation if condition met

### Wounded Soldier

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Self-damaging trait when entering play, basic damage ability  

#### State Tracking Requirements
- Track "enters play" events
- Track order of operations for card draw and self-damage

#### Interaction Pattern
- When played, automatically draw a card
- After card draw, automatically damage itself
- Player can later activate damage ability if card survives

#### Edge Cases
- If other effects modify "enters play" effects, ordering matters
- If card would be destroyed by the self-damage, destroy happens after draw

#### Dependencies
- Interacts with card draw mechanics
- Self-targeting damage

#### Implementation Notes
- Need event handler for card entering play
- Clear sequencing of the enter-play, draw, and damage effects
- Visual feedback showing the self-damage as a separate step from placement

### Cult Leader

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Free damage ability that requires sacrificing a person  

#### State Tracking Requirements
- Track if player has at least one person in play (including Cult Leader)

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects one of their people to destroy (can be Cult Leader)
- If selection valid, damage effect resolves

#### Edge Cases
- Can sacrifice itself (unusual self-destruction)
- If sacrificing itself, damage still resolves
- Zero water cost but has a sacrifice drawback

#### Dependencies
- Interacts with destruction mechanics
- Potential self-targeting

#### Implementation Notes
- Self-targeting validation
- Sequential resolution if targeting self
- Clear indication that targeting self is valid
- Zero-cost ability handling

### Repair Bot

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Restore effect when it enters play, restore ability  

#### State Tracking Requirements
- Track "enters play" events

#### Interaction Pattern
- When played, automatically prompts for a damaged card to restore
- Player selects target and restoration occurs
- Later, player can activate ability for 2 water to restore again

#### Edge Cases
- Entry effect happens before player can use any other actions
- Can target itself with entry effect (if somehow damaged when entering)
- Normal restoration targeting rules apply

#### Dependencies
- Interacts with restoration mechanics
- Auto-triggered effect on entry

#### Implementation Notes
- Auto-triggered target selection UI on play
- Standard ability implementation for manual activation
- Clear distinction between entry effect and regular ability

### Gunner

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Mass injure effect for all unprotected enemies  

#### State Tracking Requirements
- Track protection status of all enemy cards

#### Interaction Pattern
- Player activates ability for 2 water
- All unprotected enemy people are automatically injured

#### Edge Cases
- Mass damage effect that can drastically change board state
- If no unprotected enemies exist, ability has no effect but still costs water

#### Dependencies
- Interacts with protection mechanics
- Mass card damage effect

#### Implementation Notes
- System for identifying all unprotected enemy people
- Animation for mass damage effect
- Clear feedback if no valid targets exist

### Assassin

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Destroy an unprotected enemy person  

#### State Tracking Requirements
- Track protection status of enemy people

#### Interaction Pattern
- Player activates ability for 2 water
- Player selects an unprotected enemy person
- Selected person is destroyed

#### Edge Cases
- Cannot target protected people
- Cannot target camps
- If no valid targets exist, ability cannot be used

#### Dependencies
- Interacts with protection mechanics

#### Implementation Notes
- Target validation to ensure only unprotected enemy people
- Clear feedback if no valid targets exist
- Distinct visual effect for destruction vs damage

### Scientist

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Mills 3 cards and lets you use a junk effect  

#### State Tracking Requirements
- Track which cards were milled by this effect

#### Interaction Pattern
- Player activates ability for 1 water
- Top 3 cards of deck are revealed and discarded
- Player may select one of the revealed cards to use its junk effect
- Player may also choose to use none

#### Edge Cases
- If deck has fewer than 3 cards, mill as many as possible
- Player can decline to use any junk effects
- If selected junk effect requires targeting, handle that separately

#### Dependencies
- Interacts with deck/discard mechanics
- Interacts with junk effects system

#### Implementation Notes
- UI for displaying milled cards
- Selection interface for choosing a junk effect
- Secondary targeting UI if needed for junk effect
- Clear option to decline all effects

### Mutant

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Free damage and/or restore ability that self-damages  

#### State Tracking Requirements
- Track which effects player has selected (damage, restore, or both)

#### Interaction Pattern
- Player activates ability for 0 water
- Player selects which effects to use (damage, restore, or both)
- Player selects targets for chosen effects
- Effects resolve in order
- Mutant is automatically damaged after resolution

#### Edge Cases
- Can choose either effect or both
- Self-damage occurs regardless of chosen effects
- Zero water cost but has a self-damage drawback
- If already damaged, using ability will destroy it

#### Dependencies
- Interacts with damage and restore mechanics
- Self-damage mechanic

#### Implementation Notes
- UI for selecting which effects to use
- Sequential targeting for each selected effect
- Clear warning if using when already damaged (will destroy)
- Zero-cost ability handling

### Vigilante

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Basic injure ability  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 1 water
- Player selects an unprotected enemy person
- Selected person is injured

#### Edge Cases
- Cannot target protected people
- Cannot target camps
- Standard injure mechanics apply

#### Dependencies
- Interacts with protection mechanics

#### Implementation Notes
- Standard injure ability implementation
- Target validation for unprotected enemy people
- Clear visual distinction between injure and damage effects

### Rescue Team

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Enters play ready, can return a person to hand  

#### State Tracking Requirements
- Track that this card enters play ready (unlike other people)

#### Interaction Pattern
- When played, enters play ready (can use ability immediately)
- Player activates ability for 0 water
- Player selects one of their people (including Rescue Team itself)
- Selected person is returned to player's hand

#### Edge Cases
- Enters play ready (special trait)
- Can target itself
- Returned Punks become normal cards in hand
- Zero water cost for powerful effect

#### Dependencies
- Interacts with ready status mechanics
- Interacts with hand management

#### Implementation Notes
- Initialize as ready when entering play
- Self-targeting validation
- Handle conversion of Punks to regular cards when returned to hand
- Zero-cost ability handling

### Muse

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Free extra water ability  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 0 water
- Player automatically gains 1 extra water token
- Card becomes not ready

#### Edge Cases
- Zero water cost for resource generation
- Simple but economically powerful effect

#### Dependencies
- Interacts with water resource mechanics

#### Implementation Notes
- Zero-cost ability handling
- Animation for gaining extra water
- Clear indication that card becomes not ready

### Mimic

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Ability to use other cards' abilities  

#### State Tracking Requirements
- Track all eligible abilities on the board
- Track which ability is being copied
- Track water cost of copied ability

#### Interaction Pattern
- Player activates Mimic ability
- Player selects a ready ally or undamaged enemy with an ability
- Ability cost and effect are copied
- Player pays cost and resolves effect

#### Edge Cases
- Copied ability references ("this card") should refer to Mimic
- Need to determine what happens with multi-ability cards
- Prevent infinite loops with ability copying

#### Dependencies
- Complex interaction with all other card abilities
- Interacts with ready status tracking

#### Implementation Notes
- Need ability selection UI
- Dynamic cost display
- Method to copy ability logic without duplicating code
- Handle self-references in copied abilities

### Exterminator

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Destroys all damaged enemies  

#### State Tracking Requirements
- Track damaged state of all enemy cards

#### Interaction Pattern
- Player activates ability for 1 water
- All damaged enemy people are automatically destroyed

#### Edge Cases
- Mass destruction effect that can drastically change board state
- If no damaged enemies exist, ability has no effect but still costs water

#### Dependencies
- Interacts with damaged state tracking
- Mass card removal effect

#### Implementation Notes
- Need system for identifying all damaged enemy people
- Animation for mass destruction
- Clear feedback if no valid targets exist

### Scout

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Basic raid ability  

#### State Tracking Requirements
- Track Raiders event card status

#### Interaction Pattern
- Player activates ability for 1 water
- Raiders card is played or advanced according to raid rules

#### Edge Cases
- Standard raid mechanics apply
- Simple implementation of raid effect on a person

#### Dependencies
- Interacts with Raiders event card
- Standard raid implementation

#### Implementation Notes
- Standard raid handling
- Animation for Raiders advancement
- Clear visualization of Raiders event status

### Pyromaniac

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Damage an unprotected camp  

#### State Tracking Requirements
- Track protection status of enemy camps

#### Interaction Pattern
- Player activates ability for 1 water
- Player selects an unprotected enemy camp
- Selected camp is damaged

#### Edge Cases
- Can only target camps (not people)
- Target must be unprotected
- Specialized version of damage that only affects camps

#### Dependencies
- Interacts with protection mechanics
- Camp-specific targeting

#### Implementation Notes
- Target validation to ensure only unprotected enemy camps
- Clear feedback if no valid targets exist
- Visual highlighting of eligible camp targets

### Holdout

**Type:** Person  
**Play Cost:** 2 (or 0 with condition)  
**Key Effects:** Discounted play cost if you have a destroyed camp  

#### State Tracking Requirements
- Track destroyed camps controlled by player
- Track play cost dynamically

#### Interaction Pattern
- System checks if player has at least one destroyed camp
- If condition met, display alternate cost (0) when card is selected for play
- Player plays card and pays appropriate cost

#### Edge Cases
- Dynamic play cost based on board state
- Can only be placed in a column with a destroyed camp for the discount
- Cost reduction is significant (from 2 to 0)

#### Dependencies
- Interacts with camp destruction state
- Dynamic cost calculation

#### Implementation Notes
- Visual indicator of alternate cost when condition is met
- Validation that placement is in appropriate column for discount
- Dynamic cost display

### Doomsayer

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Move opponent events back, conditional damage if opponent has an event  

#### State Tracking Requirements
- Track events in opponent's queue
- Track "enters play" events

#### Interaction Pattern
- When played, player may choose to move all opponent events back 1 in queue
- For ability, system checks if opponent has any events in queue
- If condition met, ability becomes available
- Player activates ability for 1 water and selects unprotected enemy target

#### Edge Cases
- Entry effect is optional
- Cannot move events back if there's no space
- If can't move any events back, can still play the card
- Ability condition depends on opponent's event queue

#### Dependencies
- Interacts with event queue mechanics
- Conditional ability availability

#### Implementation Notes
- Optional entry effect UI
- Dynamic ability availability based on opponent's event queue
- Clear indication when ability is available

### Rabble Rouser

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Two abilities - gain punk and conditional damage  

#### State Tracking Requirements
- Track if player has at least one punk in play

#### Interaction Pattern
- Player can choose between two abilities:
  - Gain punk for 1 water: Automatically gain a punk
  - Conditional damage for 1 water: If player has a punk, damage an unprotected enemy

#### Edge Cases
- Second ability is conditional on having at least one punk
- One of few people cards with two distinct abilities
- First ability directly enables the second

#### Dependencies
- Second ability depends on punk presence
- Interacts with punk mechanics

#### Implementation Notes
- Clear UI for ability selection
- Dynamic enabling/disabling of second ability based on punk presence
- Visual indication of ability availability

### Magnus Karv

**Type:** Person  
**Play Cost:** 3  
**Key Effects:** Damage all cards in one enemy column  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 2 water
- Player selects one enemy column
- All cards in that column (camp and people) are damaged

#### Edge Cases
- Mass damage effect that targets a full column
- Affects all cards in column regardless of protection
- Can damage multiple cards with one ability

#### Dependencies
- Interacts with column structure

#### Implementation Notes
- Column selection UI
- Animation for column-wide damage effect
- Clear indication that all cards in column will be affected

### Zeto Kahn

**Type:** Person  
**Play Cost:** 3  
**Key Effects:** Draw 3 cards then discard 3, first event each turn is 0-queue  

#### State Tracking Requirements
- Track which cards were drawn by his ability
- Track if player has played an event this turn
- Track when turn started/ended

#### Interaction Pattern
- For ability: Player activates for 1 water, draws 3 cards, then must discard 3 cards
- Trait: First event player plays each turn (including Raiders) becomes 0-queue

#### Edge Cases
- Multi-card selection for discard
- Cannot discard Water Silo
- Trait has no effect on events already in queue
- Trait applies to Raiders events as well as regular events
- Trait makes event resolve immediately (0-queue) rather than go into queue

#### Dependencies
- Interacts with card draw and discard mechanics
- Interacts with event queue mechanics
- Turn-based trait tracking

#### Implementation Notes
- UI for multi-card discard selection
- Validation to prevent discarding Water Silo
- Turn-based flag for event played
- Modification of event queue placement rules
- Clear visual indication when trait is active (affects next event)

### Vera Vosh

**Type:** Person  
**Play Cost:** 3  
**Key Effects:** Keep cards ready after first ability use each turn  

#### State Tracking Requirements
- Track if player has used an ability this turn
- Track which ability was used first in the turn
- Track when turn started/ended

#### Interaction Pattern
- Player uses any card's ability
- If it's the first ability used this turn, card stays ready
- Vera herself has a basic injure ability for 1 water

#### Edge Cases
- Trait applies to Vera herself
- Trait applies to both camps and people
- If Vera becomes active after an ability has been used, that ability does not become usable again
- Benefit applies only to the very first ability used each turn

#### Dependencies
- Interacts with ready status mechanics
- Turn-based trait tracking

#### Implementation Notes
- Turn-based flag for first ability used
- Special handling for ready status after ability use
- Visual indicator showing which card benefited from the trait
- Clear distinction between regular abilities and Vera-enhanced abilities

### Karli Blaze

**Type:** Person  
**Play Cost:** 3  
**Key Effects:** All people enter play ready, basic damage ability  

#### State Tracking Requirements
- Track "enters play" events for all people
- Track which player controls Karli
- Track when Karli's trait is active (when undamaged)

#### Interaction Pattern
- When player controls undamaged Karli, all their people enter play ready
- Player can use regular person damage ability for 1 water

#### Edge Cases
- Trait applies to Karli herself when she enters play
- Trait applies when Karli is restored but her ability is not ready
- Trait does not work when Karli is damaged

#### Dependencies
- Interacts with "ready" status mechanics
- Potentially interacts with Training Camp effects

#### Implementation Notes
- Need to modify default "not ready" state for new people when Karli is in play
- Visual indicator for people entering play ready
- Clear distinction between trait effect and ability effect

### Molgur Stang

**Type:** Person  
**Play Cost:** 4  
**Key Effects:** Can destroy any camp, ignoring protection  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 1 water
- Player selects any opponent camp (protected or unprotected)
- Selected camp is destroyed

#### Edge Cases
- Can target protected camps (bypasses normal protection rules)
- Extremely powerful effect with very low water cost

#### Dependencies
- Overrides protection mechanics

#### Implementation Notes
- Special targeting rules that ignore protection
- Clear UI indication that any camp can be targeted
- Potentially unique animation for this powerful effect

### Argo Yesky

**Type:** Person  
**Play Cost:** 3  
**Key Effects:** Grants its ability to all your people (including Punks), gains a Punk when played  

#### State Tracking Requirements
- Track which player controls Argo (to grant abilities to their people)
- Track when Argo enters/leaves play or becomes damaged/restored
- Track which other people should have Argo's ability

#### Interaction Pattern
- When played, automatically gain a Punk
- All player's people (including Punks) gain Argo's "Damage" ability
- Each person with the granted ability needs a visual indicator showing they can use it

#### Edge Cases
- If Argo is damaged, all people lose the ability
- If Argo is restored, all people regain the ability
- Punks with abilities should be marked as not ready when entering play (unlike normal Punks)
- If Argo leaves play, all granted abilities should be removed

#### Dependencies
- Modifies how Punks work (they normally have no abilities)
- Interacts with "ready" status tracking
- Might interact with other ability-copying effects

#### Implementation Notes
- Need a system to dynamically grant/revoke abilities based on Argo's state
- Should visually distinguish Punks with abilities from regular Punks
- Need to properly handle ready/not ready status for Punks when they gain abilities

### Vanguard

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Damage with opponent counter-damage, gains a punk when played  

#### State Tracking Requirements
- Track "enters play" events
- Track damage resolution sequence
- Track temporary control transfer

#### Interaction Pattern
- When played, automatically gain a punk
- Player activates ability for 1 water and selects target
- After damage resolves, opponent automatically gets to deal damage back
- Control temporarily transfers to opponent for counter-damage targeting

#### Edge Cases
- If original damage destroys opponent's last camp, player wins before counter-damage
- Temporary control transfer during active player's turn
- Need timeout handling for opponent selection

#### Dependencies
- Interacts with punk mechanics
- Requires opponent interaction during active player's turn

#### Implementation Notes
- Need UI system for temporary opponent control
- Need timeout mechanism if opponent doesn't respond
- Clear sequence indication for attack and counter-attack
- Win condition check before counter-damage

### Sniper

**Type:** Person  
**Play Cost:** 1  
**Key Effects:** Can damage any card, ignoring protection  

#### State Tracking Requirements
- No special tracking needed

#### Interaction Pattern
- Player activates ability for 2 water
- Player can select any opponent card as target, protected or not
- Selected card is damaged

#### Edge Cases
- Bypasses protection rules
- Opens up targeting options not normally available

#### Dependencies
- Overrides protection mechanics

#### Implementation Notes
- Special targeting rules that ignore protection
- Clear UI indication that any card can be targeted
- Distinct visual effect to highlight the special nature of this ability

---

## Event Cards Analysis

### Interrogate

**Type:** Event  
**Play Cost:** 1  
**Event Queue:** 0  
**Key Effects:** Draw 4 cards then discard 3 of them  

#### State Tracking Requirements
- Track which cards were drawn by this effect
- Track discard selection process

#### Interaction Pattern
- When played, immediately draw 4 cards
- Player must select 3 cards to discard
- Selected cards are discarded

#### Edge Cases
- May cause player to exceed normal hand size temporarily
- Large card selection requirement
- Multi-select UI needed
- Gives player significant card filtering ability

#### Dependencies
- Interacts with card draw and discard mechanics
- Card selection and filtering

#### Implementation Notes
- Special UI for selecting multiple cards to discard
- Need to track which cards were just drawn for better UX
- Potential timeout for selection if player is taking too long
- Animation showing 4 cards entering hand, then 3 leaving

### Truce

**Type:** Event  
**Play Cost:** 2  
**Event Queue:** 0  
**Key Effects:** Return all people to their owners' hands  

#### State Tracking Requirements
- Track original owners of all people cards
- Track card conversion for punks

#### Interaction Pattern
- When played, immediately returns all people to their owners' hands
- Punks become regular cards in hand

#### Edge Cases
- Punks become normal cards in hand, not face-down
- Cards do not "remember" their previous state when returned to play
- Cards that entered play damaged or used abilities don't retain those states
- Global effect that can drastically change board state

#### Dependencies
- Interacts with column structure (emptying columns)
- Interacts with punk mechanics
- Interacts with hand management

#### Implementation Notes
- Need to handle conversion of punks to regular cards when returned to hand
- Need to reset any temporary state on cards when returned
- Animation requirements for mass card movement
- Clear indication that punks become normal cards

### Uprising

**Type:** Event  
**Play Cost:** 1  
**Event Queue:** 2  
**Key Effects:** Gain 3 punks  

#### State Tracking Requirements
- Track current number of people in play
- Track maximum capacity for people
- Track punk placement locations

#### Interaction Pattern
- When resolved, player gains 3 punks in positions they choose
- If player cannot place all 3 punks, they only gain as many as possible

#### Edge Cases
- If player already has maximum people in play, may need to destroy existing people
- Player chooses placement for multiple punks
- Player may choose to gain fewer than 3 if desired
- Rule specifies: "If this causes you to have more than six people, you do not gain the extra punks"

#### Dependencies
- Interacts with column capacity mechanics
- Interacts with punk mechanics
- Mass card creation

#### Implementation Notes
- UI for selecting multiple placement locations
- Logic for handling partial effect resolution
- Clear indication of maximum people limit
- Animation for multiple punk appearances

### Radiation

**Type:** Event  
**Play Cost:** 2  
**Event Queue:** 1  
**Key Effects:** Injure all people in play (including own)  

#### State Tracking Requirements
- Track all people in play from both players
- Track which people are destroyed by this effect (punks)

#### Interaction Pattern
- When resolved, all people in play (both players) are injured
- Resolution should be simultaneous

#### Edge Cases
- Mass damage effect that affects both players
- Can drastically alter board state
- Punks would be destroyed by this effect (since they're destroyed when damaged)
- Self-damaging effect (unusual)

#### Dependencies
- Interacts with damage/injure mechanics
- Global effect
- Potentially game-altering impact

#### Implementation Notes
- Animation for global effect
- Special handling for punk destruction
- Ordered resolution for any triggered effects
- Clear visual indication that it affects all people, including your own

### Famine

**Type:** Event  
**Play Cost:** 1  
**Event Queue:** 1  
**Key Effects:** Each player destroys all but one of their people  

#### State Tracking Requirements
- Track player selection sequence
- Track people selection state

#### Interaction Pattern
- When resolved, active player selects one person to keep
- All other people of active player are destroyed
- Then opponent selects one person to keep
- All other people of opponent are destroyed

#### Edge Cases
- If player has no people, nothing happens for them
- If player has exactly one person, no choice needed
- Forced selection with potentially major board impact
- Starting with the active player is important for sequence

#### Dependencies
- Requires selection from both players
- Mass destruction effect
- Temporary opponent control

#### Implementation Notes
- Selection UI for both players
- Logic for handling player with zero or one person
- Clear sequence indication for which player is selecting
- Timeout handling if player doesn't select
- Animation for mass destruction

### Napalm

**Type:** Event  
**Play Cost:** 2  
**Event Queue:** 1  
**Key Effects:** Destroy all enemies in one column  

#### State Tracking Requirements
- Track column selection
- Track destruction sequence

#### Interaction Pattern
- When resolved, player selects one enemy column
- All enemy people in that column are destroyed

#### Edge Cases
- If selected column has no people, no effect on people (but still must select a column)
- Affects all people in column regardless of protection
- Does not affect the camp in the column
- Mass destruction in a targeted area

#### Dependencies
- Interacts with column structure
- Targeted mass removal

#### Implementation Notes
- Column selection UI
- Animation for column-wide destruction
- Clear feedback if no valid targets exist
- Visual highlighting of entire column during selection

### Strafe

**Type:** Event  
**Play Cost:** 2  
**Event Queue:** 0  
**Key Effects:** Injure all unprotected enemies  

#### State Tracking Requirements
- Track protection status of all enemy people
- Track which people are affected

#### Interaction Pattern
- When played, immediately injure all unprotected enemy people
- Resolution should be simultaneous

#### Edge Cases
- Mass damage effect that can drastically change board state
- If no unprotected enemies exist, ability has no effect but still costs water
- Any punks hit would be destroyed

#### Dependencies
- Interacts with protection mechanics
- Mass card damage effect
- Potentially game-altering impact

#### Implementation Notes
- System for identifying all unprotected enemy people
- Animation for mass damage effect
- Clear feedback if no valid targets exist
- Visual highlighting of affected targets

### Bombardment

**Type:** Event  
**Play Cost:** 4  
**Event Queue:** 3  
**Key Effects:** Damage all opponent's camps, then draw cards based on destroyed camps  

#### State Tracking Requirements
- Track how many camps were destroyed by this effect
- Track camp states before and after effect
- Track card draw sequence

#### Interaction Pattern
- When resolved, damage all opponent camps
- Count newly destroyed camps
- Draw that many cards

#### Edge Cases
- If opponent camps are already damaged, they will be destroyed
- Card draw is based on number of destroyed camps after resolution
- Potential for significant card advantage
- Highest water cost event in the game (4)
- Long queue time (3) balanced by powerful effect

#### Dependencies
- Interacts with camp damage/destruction mechanics
- Conditional card draw
- Potentially game-winning impact

#### Implementation Notes
- Need to track which camps were already destroyed vs newly destroyed
- Animation for mass damage effect
- Sequential resolution of damage then card draw
- Clear visual connection between destroyed camps and cards drawn

### High Ground

**Type:** Event  
**Play Cost:** 0  
**Event Queue:** 1  
**Key Effects:** Rearrange your people, opponent's cards unprotected this turn  

#### State Tracking Requirements
- Track turn when High Ground was played
- Track "unprotected" status override for opponent's cards
- Track original positions if implementing undo functionality
- Track rearrangement process

#### Interaction Pattern
- When resolved, player enters special "rearrangement mode"
- UI should allow dragging people to new valid positions
- After rearrangement, a global effect makes all opponent cards unprotected for the turn

#### Edge Cases
- Player can choose to rearrange people back to the same positions
- Protection from columns/other cards is ignored for the opponent this turn
- "Unprotected" state should end when turn ends
- Zero water cost for powerful effect
- Combines two strong effects (rearrangement and protection bypass)

#### Dependencies
- Interacts with protection mechanics
- Affects targeting eligibility for other cards
- Temporary game state modification

#### Implementation Notes
- Needs temporary game state modifier for "unprotected" status
- Need clear visual indication that opponent's cards are unprotected
- Special UI mode for rearranging people cards
- Turn-based effect tracking
- Animation showing protection status change

### Banish

**Type:** Event  
**Play Cost:** 1  
**Event Queue:** 1  
**Key Effects:** Destroy any enemy  

#### State Tracking Requirements
- Track targeting selection
- Track destruction process

#### Interaction Pattern
- When resolved, player selects any enemy (person or camp)
- Selected card is destroyed regardless of protection

#### Edge Cases
- Bypasses protection rules
- Can target any enemy card (people or camps)
- Low cost for powerful single-target removal
- Unconditional destruction

#### Dependencies
- Overrides protection mechanics
- Direct destruction (not damage)

#### Implementation Notes
- Special targeting rules that ignore protection
- Clear UI indication that any enemy can be targeted
- Distinct visual effect to highlight the special nature of this ability
- Animation showing the targeted destruction

---

## Special Cards

### Raiders

**Type:** Special Event (Starts in play area)  
**Key Effects:** Forces opponent to damage one of their camps when resolved  

#### State Tracking Requirements
- Track special status as starting in play area (not deck)
- Track current position in event queue if played
- Track raid effects that advance it

#### Interaction Pattern
- When resolved through raid effects or advancement
- Opponent selects one of their camps to damage
- Card returns to player's play area after resolution

#### Edge Cases
- Special event that starts outside deck
- Repeatedly usable (returns to play area)
- Control transfers to opponent for target selection
- Cannot be advanced if next queue space is occupied

#### Dependencies
- Interacts with raid effects from various cards
- Requires opponent interaction during active player's turn
- Core mechanic referenced by many cards

#### Implementation Notes
- Special handling for card returning to play area
- UI for opponent camp selection
- Timeout handling for opponent selection
- Animation showing raid effect
- Clear indication of current queue position if in queue

### Water Silo

**Type:** Special Card (Starts in play area)  
**Key Effects:** Can be taken into hand and junked for extra water  

#### State Tracking Requirements
- Track special status as starting in play area
- Track if currently in hand or play area
- Track if it has been used this turn

#### Interaction Pattern
- Player spends 1 water to take into hand
- Can be junked from hand for extra water
- Returns to play area after junking (not discarded)

#### Edge Cases
- Special card that starts outside deck
- Repeatedly usable
- Returns to play area instead of discard pile when junked
- Cannot be discarded by effects that discard cards

#### Dependencies
- Interacts with water resource mechanics
- Special junk handling
- Resource management strategy

#### Implementation Notes
- Special handling for initial placement and return to play area
- Distinct visualization showing availability in play area
- Clear indication that it returns to play area when junked
- Validation to prevent discarding through other effects

## Implementation Priorities

Based on this analysis, we recommend implementing cards in the following order:

### Phase 1: Core Mechanics
1. Basic effects (Damage, Injure, Destroy, Restore)
2. Special cards (Raiders, Water Silo)
3. Simple camp cards with direct effects (Railgun, Garage)
4. Simple person cards with direct effects (Vigilante, Scout)
5. Simple events with immediate effects (Strafe, Banish)

### Phase 2: Conditional Mechanics
1. Cards with simple conditions (Command Post, Warehouse)
2. Cards with turn-based conditions (Watchtower, Resonator)
3. Cards with board state conditions (Mercenary Camp, Training Camp)
4. Cards with complex targeting (Sniper, Catapult)

### Phase 3: Complex Interactions
1. Cards with multi-step sequences (Parachute Base, Adrenaline Lab)
2. Cards with opponent interaction (Scud Launcher, Vanguard)
3. Cards that modify game rules (Karli Blaze, Vera Vosh)
4. Cards with global effects (Radiation, Reactor)

### Phase 4: Advanced Mechanics
1. Cards with column manipulation (Construction Yard, Juggernaut)
2. Cards with ability copying/granting (Mimic, Argo Yesky)
3. Cards with alternative win conditions (Obelisk)
4. Cards with complex UI requirements (High Ground, Famine)

This implementation order ensures we can build a working game with basic functionality first, then layer in more complex card interactions gradually, testing each layer before moving to the next.
