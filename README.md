# Xiangqi (Chinese Chess) Project

## Quick Start
Open `index.html` in a browser (double-click, or `Start-Process index.html` on Windows). No build step, no dependencies.

**Tests:** `node --test` (uses Node's built-in test runner; no dependencies).

**Repo:** https://github.com/ngtingfai/Xiangqi — `main` branch, `gh` CLI authed as `ngtingfai`. Only commit/push when explicitly asked.

## Overview
A browser-based Xiangqi (Chinese Chess) game built with vanilla HTML/CSS/JavaScript (no frameworks). Rendered on an HTML5 Canvas. Supports vs AI (minimax with alpha-beta pruning) and vs Human modes, with configurable AI difficulty, board flip, undo, endgame studies, switchable sides, and move history in WXF or traditional Chinese notation (toggleable).

**Local path:** `C:\Users\user\Desktop\TF\VScode\Xiangqi`

## Files
| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 110 | Main HTML page with sidebar UI, canvas, notation panel + eval bar, game-over modal |
| `style.css` | 478 | Dark-themed UI styling with gradient background |
| `game.js` | 1174 | All game logic, AI, rendering |
| `test/harness.js` | 107 | Loads `game.js` in a sandboxed VM with DOM stubs |
| `test/game.test.js` | 501 | Regression tests (rules, AI eval, checkmate/stalemate, notation, history restore, eval bar) |
| `README.md` | — | This file — project documentation |

## Tests
- Run with `node --test` from the repo root. Built-in `node:test` runner, zero dependencies.
- `test/harness.js` evaluates `game.js` inside a `vm` context with stubbed `document`/canvas/`ctx`, then exposes the module's functions via a `globalThis.__api` epilogue. An element stub records event listeners so button handlers can be exercised via `.click()`.
- Tests cover: standard setup, 44 legal opening moves each, palace/river helpers, board-flip transforms, per-piece move rules, kings-facing filter, check detection, pinned-piece rules, capture/undo, checkmate + stalemate (loss), evaluation values, WXF/Chinese notation incl. 前/後 disambiguation, history restore (`restorePosition` replays ✅, branch truncation, captured-pieces recompute, clickable move links), and the evaluation bar (centering, red advantage, capture updates, restore updates, clamping).
- Note: values returned by game.js come from a different JS realm (vm), so tests use `assert.deepEqual` (not `deepStrictEqual`) for objects/arrays.

## Architecture (game.js)

### Constants & Config
- Board: 9 columns x 10 rows (`BOARD_SIZE=9`, `BOARD_HEIGHT=10`)
- Canvas: `CELL_SIZE=65`, `MARGIN=40`
- Piece types: `king`, `advisor`, `elephant`, `horse`, `chariot`, `cannon`, `soldier`
- Chinese symbols: `RED_PIECES` and `BLACK_PIECES` objects map type to character
- `PIECE_VALUES` for AI evaluation
- `EVAL_RANGE = 100` — full-scales the eval bar to roughly a chariot (± value), beyond which the bar clamps

### Game State (`game` object, line 52)
- `board[][]` — 2D array, each cell is `{type, color}` or `null`
- `currentTurn` — `'red'` or `'black'` (Red always goes first)
- `selectedPiece` — `[row, col]` or `null`
- `moveHistory[]` — array of `{from, to, piece, captured}`; the full game record used for history restore
- `capturedPieces` — `{red: [], black: []}`
- `initialBoard` — snapshot of the start position, the base for `restorePosition` replays
- `historyIndex` — index of the currently displayed position in `moveHistory`; `-1` = initial position; `makeMove` truncates later history when branching from a restored position
- `isFlipped` — boolean, board display orientation
- `vsAI` — boolean, default `true`
- `humanColor` — `'red'` or `'black'`, which color the human plays
- `aiDepth` — 1/2/3, default `2`
- `aiThinking` — boolean, prevents input during AI computation
- `gameOver` — boolean
- `notation` — `'chinese'` or `'wxf'` (move-history display format, default `'chinese'`)

### Key Functions
| Function | Line | Purpose |
|----------|------|---------|
| `initBoard()` | 71 | Sets up standard starting position |
| `showGameOver()` | 132 | Displays the game-over modal with title and message |
| `checkForCheckmate()` | 138 | Detects checkmate AND stalemate (both = loss for stalemated player) |
| `updateTurnText()` | 159 | Updates the turn indicator text |
| `getAllLegalMoves(color)` | 164 | All moves that don't leave king in check and don't violate kings-facing rule |
| `getPieceSymbol()` | 192 | Returns Chinese character for a piece |
| `boardToScreen(row, col)` | 197 | Converts board coords to screen coords (flips if `game.isFlipped`) |
| `screenToBoard(row, col)` | 204 | Converts screen coords back to board coords (inverse of boardToScreen) |
| `isValidPos(row, col)` | 211 | Bounds check for board coordinates |
| `isInPalace(row, col, color)` | 215 | Checks if position is within the 3x3 palace |
| `isAcrossRiver(row, color)` | 221 | Checks if a piece has crossed the river |
| `countPiecesBetween()` | 225 | Counts pieces between two points (for cannon) |
| `getValidMoves(row, col)` | 243 | Raw pseudo-legal moves for a piece (ignores check) |
| `isKingsFacing()` | 419 | Flying general rule — kings on same column with no pieces between = illegal |
| `isInCheck(color)` | 450 | Whether `color`'s king is under attack |
| `makeMove()` | 482 | Executes a move, switches turn, records in history; truncates later moves when branching from a restored position |
| `undoMove()` | 509 | Reverses last move |
| `toWXFMove()` | 530 | 4-digit WXF code: `{fromFile}{fromRank}{toFile}{toRank}` |
| `toChineseMove()` | 557 | Traditional Chinese notation (進/退/平, red files 1-9 from right, black 1-9 from left, 前/後/中 disambiguation) |
| `formatMove()` | 582 | Formats a history move using `game.notation` |
| `restorePosition(index)` | 591 | Replays `moveHistory[0..index]` from `initialBoard` to restore any earlier position (recomputes board, turn, captured pieces); `-1` = start position |
| `evaluateBoard()` | 620 | Material evaluation for AI (soldiers worth more after crossing river) |
| `minimax()` | 647 | Alpha-beta pruning AI search (uses `getAllLegalMoves`) |
| `aiMove()` | 700 | AI entry point — color-aware, evaluates all legal moves via minimax |
| `drawBoard()` | 753 | Renders board grid, river text, palace lines, pieces, selection, valid moves |
| `drawPiece()` | 857 | Renders a single piece with circle, border, Chinese character (uses `boardToScreen`) |
| `getBoardCoords()` | 884 | Converts click event to board coordinates (uses `screenToBoard`) |
| `updateUI()` | 938 | Updates turn indicator, notation table, captured pieces display, eval bar |
| `updateEvalBar()` | 975 | Renders the eval bar: red fills from top proportional to `evaluateBoard()` (positive = Red), clamped to `±EVAL_RANGE`; updates on every `updateUI`, so move history clicks re-evaluate too |

### Event Listeners
| Line | Element | Action |
|------|---------|--------|
| 860 | `#new-game-btn` | Resets board; triggers AI if human is Black |
| 980 | `#undo-btn` | Undoes 2 moves in AI mode (AI+human pair), 1 in human mode |
| 991 | `#notation-table` | Clicking a move link restores that position (`restorePosition`) |
| 998 | `#flip-board-btn` | Toggles `game.isFlipped` and redraws |
| 1003 | `#notation-btn` | Toggles move notation between 中文 and WXF, re-renders the table |
| 1009 | `#ai-depth` | Changes AI search depth |
| 1013 | `#vs-ai-btn` | Switches to AI mode, resets humanColor to red, shows side toggle |
| 1025 | `#vs-human-btn` | Switches to human mode, hides side toggle |
| 1035 | `#switch-sides-btn` | Swaps humanColor, auto-flips board, triggers AI if now playing as Black |
| 1116 | `.study-btn` | Loads endgame study puzzle, forces humanColor to red; snapshots `initialBoard`, resets history |
| 1144 | `#game-over-btn` | Restarts game; triggers AI if human is Black |

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
- **Notation table** — its own panel to the right of the board; a scrollable table with move number, Red and Black columns
- **Clickable moves** — clicking any move in the notation table restores the board to that exact position (Red/Black pairs by move number, current position highlighted in gold)
- **Notation toggle** — button switches the table's format between `中文` (e.g. 炮八平五) and `WXF` (e.g. 俥 0919)
- **Evaluation bar** — vertical bar to the left of the moves table; red fills from the top proportional to material advantage (positive = ahead for Red, negative = Black). Recomputes after every move **and** whenever a move is clicked to restore a previous position (via `updateUI`). Hover shows the numeric score; full scale ≈ one chariot (`EVAL_RANGE=100`).
- **History branching** — making a new move from a restored position truncates all later moves
- **Captured pieces** — displayed below the board for both sides
- **Game-over modal** — overlay with result and "Play Again" button
- **Click-to-select, click-to-move** with valid move indicators (yellow circles)
- **Endgame study** buttons — load preset puzzle positions

## Session History
- **Session 1**: Initial project creation, pushed to GitHub. Fixed Example 1 endgame study (was unsolvable — no one-move checkmate existed). Fixed AI minimax to use `getAllLegalMoves` instead of `getAllMoves`.
- **Session 2**: Removed unused `getAllMoves` function. Fixed flip board button (was toggling state but `drawBoard`/`drawPiece`/`getBoardCoords` never used it — added `boardToScreen`/`screenToBoard` helpers). Added Switch Sides feature (`game.humanColor`, color-aware `aiMove`, auto-flip, AI first move trigger).
- **Session 3**: Added `README.md`; merged `PROJECT.md` documentation into this file.
- **Session 4**: Added regression tests (`node --test`, sandboxed VM harness with DOM stubs). Added move-history notation: WXF digit code + traditional Chinese (進/退/平 with 前/後/中 disambiguation), with a toggle button.
- **Session 5**: Moved notation into its own table panel to the right of the board (move number + Red/Black columns). Made every move a clickable link that restores that position via `restorePosition(index)` (replays from `initialBoard` snapshot — recomputes board, turn, captured pieces; current position highlighted). Making a move from a restored position truncates later history. Pending AI moves are invalidated after restore/new game. 35 tests passing.
- **Session 6**: Added an evaluation bar next to the moves table (vertical, red-from-top = Red advantage, clamped to `±EVAL_RANGE=100`). The bar re-renders on every `updateUI`, so it follows normal moves **and** clicking any move in the table to jump to that position re-evaluates the bar. 40 tests passing.

## Known Issues / TODO Ideas
- AI evaluation is material-only, no positional awareness or piece-square tables
- No draw rule (repetition/50-move) — games could theoretically go forever
- No check/checkmate sound effects or animations
- Endgame studies only set up position; no "solution" validation