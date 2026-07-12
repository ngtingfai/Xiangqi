# Xiangqi (Chinese Chess) Project

## Overview
A browser-based Xiangqi (Chinese Chess) game built with vanilla HTML/CSS/JavaScript (no frameworks). Rendered on an HTML5 Canvas. Supports vs AI (minimax with alpha-beta pruning) and vs Human modes, with configurable AI difficulty, board flip, undo, endgame studies, and switchable sides.

**GitHub:** https://github.com/ngtingfai/Xiangqi  
**Local path:** `C:\Users\user\Desktop\TF\VScode\Xiangqi`

## Files
| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 86 | Main HTML page with sidebar UI, canvas, game-over modal |
| `style.css` | 357 | Dark-themed UI styling with gradient background |
| `game.js` | 1017 | All game logic, AI, rendering |
| `PROJECT.md` | — | This file — project documentation |

## Architecture (game.js)

### Constants & Config
- Board: 9 columns x 10 rows (`BOARD_SIZE=9`, `BOARD_HEIGHT=10`)
- Canvas: `CELL_SIZE=65`, `MARGIN=40`
- Piece types: `king`, `advisor`, `elephant`, `horse`, `chariot`, `cannon`, `soldier`
- Chinese symbols: `RED_PIECES` and `BLACK_PIECES` objects map type to character
- `PIECE_VALUES` for AI evaluation

### Game State (`game` object, line 52)
- `board[][]` — 2D array, each cell is `{type, color}` or `null`
- `currentTurn` — `'red'` or `'black'` (Red always goes first)
- `selectedPiece` — `[row, col]` or `null`
- `moveHistory[]` — array of `{from, to, piece, captured}`
- `capturedPieces` — `{red: [], black: []}`
- `isFlipped` — boolean, board display orientation
- `vsAI` — boolean, default `true`
- `humanColor` — `'red'` or `'black'`, which color the human plays
- `aiDepth` — 1/2/3, default `2`
- `aiThinking` — boolean, prevents input during AI computation
- `gameOver` — boolean

### Key Functions
| Function | Line | Purpose |
|----------|------|---------|
| `initBoard()` | 66 | Sets up standard starting position |
| `showGameOver()` | 123 | Displays the game-over modal with title and message |
| `checkForCheckmate()` | 129 | Detects checkmate AND stalemate (both = loss for stalemated player) |
| `updateTurnText()` | 150 | Updates the turn indicator text |
| `getAllLegalMoves(color)` | 155 | All moves that don't leave king in check and don't violate kings-facing rule |
| `getPieceSymbol()` | 183 | Returns Chinese character for a piece |
| `boardToScreen(row, col)` | 188 | Converts board coords to screen coords (flips if `game.isFlipped`) |
| `screenToBoard(row, col)` | 195 | Converts screen coords back to board coords (inverse of boardToScreen) |
| `isValidPos(row, col)` | 202 | Bounds check for board coordinates |
| `isInPalace(row, col, color)` | 206 | Checks if position is within the 3x3 palace |
| `isAcrossRiver(row, color)` | 212 | Checks if a piece has crossed the river |
| `countPiecesBetween()` | 216 | Counts pieces between two points (for cannon) |
| `getValidMoves(row, col)` | 234 | Raw pseudo-legal moves for a piece (ignores check) |
| `isKingsFacing()` | 410 | Flying general rule — kings on same column with no pieces between = illegal |
| `isInCheck(color)` | 441 | Whether `color`'s king is under attack |
| `makeMove()` | 473 | Executes a move, switches turn, records in history |
| `undoMove()` | 494 | Reverses last move |
| `evaluateBoard()` | 512 | Material evaluation for AI (soldiers worth more after crossing river) |
| `minimax()` | 539 | Alpha-beta pruning AI search (uses `getAllLegalMoves`) |
| `aiMove()` | 592 | AI entry point — color-aware, evaluates all legal moves via minimax |
| `drawBoard()` | 643 | Renders board grid, river text, palace lines, pieces, selection, valid moves |
| `drawPiece()` | 747 | Renders a single piece with circle, border, Chinese character (uses `boardToScreen`) |
| `getBoardCoords()` | 774 | Converts click event to board coordinates (uses `screenToBoard`) |
| `updateUI()` | 826 | Updates turn indicator, move history, captured pieces display |

### Event Listeners
| Line | Element | Action |
|------|---------|--------|
| 850 | `#new-game-btn` | Resets board; triggers AI if human is Black |
| 859 | `#undo-btn` | Undoes 2 moves in AI mode (AI+human pair), 1 in human mode |
| 870 | `#flip-board-btn` | Toggles `game.isFlipped` and redraws |
| 875 | `#ai-depth` | Changes AI search depth |
| 879 | `#vs-ai-btn` | Switches to AI mode, resets humanColor to red, shows side toggle |
| 891 | `#vs-human-btn` | Switches to human mode, hides side toggle |
| 901 | `#switch-sides-btn` | Swaps humanColor, auto-flips board, triggers AI if now playing as Black |
| 982 | `.study-btn` | Loads endgame study puzzle, forces humanColor to red |
| 1006 | `#game-over-btn` | Restarts game; triggers AI if human is Black |

### Move Validation per Piece Type (lines 234-409)
- **King**: 1 step orthogonally, must stay in palace (rows 0-2 cols 3-5 for black, rows 7-9 cols 3-5 for red)
- **Advisor**: 1 step diagonal, must stay in palace
- **Elephant**: 2-step diagonal (like bishop), blocked if intervening point occupied, cannot cross river
- **Horse**: L-shape (like knight), blocked if adjacent orthogonal point occupied
- **Chariot**: Any orthogonal distance (like rook), cannot jump
- **Cannon**: Moves like chariot, but captures by jumping over exactly one piece
- **Soldier**: Forward 1 step always; after crossing river, also left/right 1 step; never backward

### Xiangqi-Specific Rules Implemented
1. **Flying General (kings facing)**: Two kings cannot face each other on the same column with no pieces between — treated as illegal position
2. **Stalemate = Loss**: Unlike western chess, stalemate in Xiangqi is a loss for the stalemated player (not a draw)
3. **Palace restriction**: King and Advisor confined to 3x3 palace
4. **River restriction**: Elephant cannot cross river; Soldier gains lateral movement after crossing

### AI
- Minimax with alpha-beta pruning
- Depth configurable 1-3 (default 2)
- Color-aware: adjusts maximizing/minimizing direction based on `game.humanColor`
  - If AI is black (human is red): AI minimizes, opponent maximizes
  - If AI is red (human is black): AI maximizes, opponent minimizes
- Uses `getAllLegalMoves` for correct stalemate/checkmate detection
- Terminal states: no legal moves = -100000 or +100000
- Evaluation: material count only (no positional tables)

### Coordinate System (Board Flip)
- `boardToScreen(row, col)` — when `game.isFlipped`, transforms `(r,c)` → `(BOARD_HEIGHT-1-r, BOARD_SIZE-1-c)`, mirroring both axes
- `screenToBoard(row, col)` — inverse transform for click handling
- Used by `drawPiece()`, selection/move indicators in `drawBoard()`, and `getBoardCoords()`
- Board grid, river text, and palace diagonals are drawn at fixed visual positions (symmetric, no flip needed)
- Auto-flips when switching sides to play as Black

### Endgame Studies (6 puzzles, line 914)
1. **Basic Checkmate** — Chariot + King vs King (flying general trap). Black King (0,3), Red King (9,4), Red Chariot (5,0). Solution: Chariot → (2,3).
2. **Chariot & Horse Mate** — Coordination pattern
3. **Cannon Mate** — Cannon with platform piece
4. **Double Cannon** — Two cannons mating net
5. **Horse & Cannon** — Classic attacking pair
6. **Chariot Mate** — Chariot with advisor block

### UI Features
- **vs Computer / vs Human** mode toggle
- **Switch Sides** button (visible in AI mode) — swaps human/AI colors, auto-flips board, AI opens if Red
- **AI Difficulty** dropdown (Easy/Medium/Hard = depth 1/2/3)
- **Undo move** — undoes 2 moves in AI mode (AI+human pair), 1 in human mode
- **Flip board** — mirrors the board display via coordinate transformation
- **Move history** — scrollable list in sidebar
- **Captured pieces** — displayed below the board for both sides
- **Game-over modal** — overlay with result and "Play Again" button
- **Click-to-select, click-to-move** with valid move indicators (yellow circles)
- **Endgame study** buttons — load preset puzzle positions

## GitHub Repo
- Repo: https://github.com/ngtingfai/Xiangqi
- Branch: `main`
- Authenticated via `gh` CLI as user `ngtingfai`

## Session History
- **Session 1**: Initial project creation, pushed to GitHub. Fixed Example 1 endgame study (was unsolvable — no one-move checkmate existed). Fixed AI minimax to use `getAllLegalMoves` instead of `getAllMoves`.
- **Session 2**: Removed unused `getAllMoves` function. Fixed flip board button (was toggling state but `drawBoard`/`drawPiece`/`getBoardCoords` never used it — added `boardToScreen`/`screenToBoard` helpers). Added Switch Sides feature (`game.humanColor`, color-aware `aiMove`, auto-flip, AI first move trigger).

## Known Issues / TODO Ideas
- AI evaluation is material-only, no positional awareness or piece-square tables
- No draw rule (repetition/50-move) — games could theoretically go forever
- No check/checkmate sound effects or animations
- Endgame studies only set up position; no "solution" validation
