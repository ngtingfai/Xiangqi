# Xiangqi (Chinese Chess) Project

## Quick Start
Open `index.html` in a browser (double-click, or `Start-Process index.html` on Windows). No build step, no dependencies.

**Tests:** `node --test` (uses Node's built-in test runner; no dependencies).

**Repo:** https://github.com/ngtingfai/Xiangqi — `main` branch, `gh` CLI authed as `ngtingfai`. Only commit/push when explicitly asked.

## Overview
A browser-based Xiangqi (Chinese Chess) game built with vanilla HTML/CSS/JavaScript (no frameworks). Rendered on an HTML5 Canvas. Supports vs AI (minimax with alpha-beta pruning) and vs Human modes, with configurable AI difficulty, board flip, undo, endgame studies, switchable sides, and move history in WXF or traditional Chinese notation (toggleable).

**Local path:** `C:\Users\user\Desktop\TF\VScode\Xiangqi`

## Files
> Line counts are approximate snapshots; test files were split by theme in Session 13.
| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 144 | Main HTML page with sidebar UI, canvas, notation panel + eval bar, background-music audio, game-over modal, setup-position panel |
| `style.css` | 659 | Dark-themed UI styling with gradient background |
| `board.js` | 368 | Board model: constants, piece symbols, `game` state, `initBoard`, geometry/palace/river/flip helpers, position-setup engine functions |
| `rules.js` | 423 | Movement rules: `getValidMoves`, `getAllLegalMoves`, `isInCheck` (direct attack detection), `isKingsFacing`, WXF chase helpers (`canLegallyCapture`, `isProtectedVictim`, `isExchangeAttack`, `computeMoveStatus`) |
| `move.js` | 278 | Move engine: `makeMove` (records elapsed time + position hash/status), `undoMove`, `restorePosition`, `checkForCheckmate`, WXF repetition judging (`positionHash`, `judgePlayer`, `judgeGame`, `judgeRepetition`), notation (`toWXFMove`/`toChineseMove`/`formatMove`) |
| `ai.js` | 157 | AI: `PIECE_VALUES`, `EVAL_RANGE`, `evaluateBoard`, `minimax` (alpha-beta + MVV-LVA move ordering), `aiMove` |
| `render.js` | 274 | Rendering + UI: canvas setup, `drawBoard`, `drawPiece`, `getBoardCoords`, `updateUI`, `updateEvalBar`, `formatElapsedTime`, `showGameOver`, music functions |
| `main.js` | 281 | Wiring: all event listeners, canvas click handler, setup-panel/palette wiring, `ENDGAME_STUDIES`, startup |
| `test/harness.js` | 133 | Loads the source files in order in a sandboxed VM with DOM stubs |
| `test/game.test.js` | 300 | Core regression tests: setup, geometry, piece movement, check/legal filtering, move exec/undo, end-of-game, evaluation |
| `test/notation.test.js` | 166 | Notation (`toWXFMove`/`toChineseMove`/`formatMove`, toggle) + `restorePosition` / clickable-move links |
| `test/repetition.test.js` | 157 | WXF repetition rules: perpetual check/chase losses, threefold idle draw, capture-breaks-cycle, mutual check/chase draws |
| `test/setup.test.js` | 138 | Position setup: enter/clear/erase, validation, commit, cancel-restore, standard load, exit-on-reset |
| `test/ui.test.js` | 129 | DOM-coupled UI: evaluation bar, music toggle, move timing |
| `music/Qiu_Feng_Ci.ogg` | — | Background music track (see Background Music section below) |
| `README.md` | — | This file — project documentation |

## Tests
- Run with `node --test` from the repo root. Built-in `node:test` runner, zero dependencies.
- `test/harness.js` evaluates the six source files (`board.js` → `rules.js` → `move.js` → `ai.js` → `render.js` → `main.js`, concatenated in that order, matching the `index.html` script tags) inside a `vm` context with stubbed `document`/canvas/`ctx`, then exposes the module's functions via a `globalThis.__api` epilogue. An element stub records event listeners so button handlers can be exercised via `.click()`. Every test file calls `loadGame()` itself — each suite gets its own sandboxed copy, so tests never share state.
- Test files (each discovered by `node --test` automatically): `game.test.js` (core engine), `notation.test.js` (notation + history restore), `repetition.test.js` (WXF draw rules), `setup.test.js` (position editor), `ui.test.js` (eval bar, music, timing).
- Coverage highlights: standard setup, 44 legal opening moves each, palace/river helpers, board-flip transforms, per-piece move rules, kings-facing filter, check detection, pinned-piece rules, capture/undo, checkmate + stalemate (loss), evaluation values, WXF/Chinese notation incl. 前/後 disambiguation, history restore (`restorePosition` replays ✅, branch truncation, captured-pieces recompute, clickable move links), the evaluation bar (centering, red advantage, capture updates, restore updates, clamping), the music toggle (off-by-default, on/off flipping), move timing (elapsed recording, clock reset, table rendering), WXF repetition (perpetual check/chase, threefold draw, capture-breaks-cycle, mutual check/chase), and position setup (place/erase, clear, validation failures, facing-kings rejection, commit, cancel-restore, standard load, exit-on-reset).
- Note: values returned by the sources come from a different JS realm (vm), so tests use `assert.deepEqual` (not `deepStrictEqual`) for objects/arrays.

## Architecture (client-side, no build step)

The game is split into six plain scripts loaded in dependency order from `index.html`; they share the page's global scope (`const game` lives in `board.js`, so order matters only for load-time code — all cross-file calls happen at runtime).

### File breakdown & dependency order
1. **`board.js`** — constants (`BOARD_SIZE=9`, `BOARD_HEIGHT=10`, `CELL_SIZE=65`, `MARGIN=40`), piece symbols (`RED_PIECES`/`BLACK_PIECES`), the `game` state object, `aiMoveSequence` guard, `initBoard()`, geometry helpers (`isValidPos`, `isInPalace`, `isAcrossRiver`, `boardToScreen`/`screenToBoard`), and the position-setup engine (`startPositionSetup`, `placeSetupPiece`, `validateSetupPosition`, `commitPositionSetup`, `cancelPositionSetup`, etc.).
2. **`rules.js`** — pseudo-legal and legal move generation (`getValidMoves`, `getAllLegalMoves`), check (`isInCheck`), flying-general (`isKingsFacing`), and the WXF chase-detection helpers (`canLegallyCapture`, `isProtectedVictim`, `isExchangeAttack`, `computeMoveStatus`).
3. **`move.js`** — move/history engine (`makeMove`, `undoMove`, `restorePosition`, `checkForCheckmate`), WXF repetition judging (`positionHash`, `judgePlayer`, `judgeGame`, `judgeRepetition`), and notation (`toWXFMove`, `getChineseFile`, `getChineseMovePrefix`, `toChineseMove`, `formatMove`).
4. **`ai.js`** — `PIECE_VALUES`, `EVAL_RANGE`, `evaluateBoard`, `minimax` (alpha-beta), `aiMove`.
5. **`render.js`** — canvas setup and constants, `drawBoard`, `drawPiece`, `getBoardCoords`, DOM UI (`updateUI`, `updateEvalBar`, `formatElapsedTime`, `showGameOver`, `updateTurnText`), music control (`enableMusic`/`disableMusic`/`toggleMusic`/`updateMusicButton`).
6. **`main.js`** — the canvas click handler, all button/table listeners (incl. the setup panel), `ENDGAME_STUDIES`, and the startup sequence (`initBoard(); drawBoard(); updateUI(); updateMusicButton(); updateSetupPalette();` plus building the piece palette).

### Constants & Config
- Board: 9 columns x 10 rows (`BOARD_SIZE=9`, `BOARD_HEIGHT=10`) — `board.js`
- Canvas: `CELL_SIZE=65`, `MARGIN=40` — `board.js`
- Piece types: `king`, `advisor`, `elephant`, `horse`, `chariot`, `cannon`, `soldier`
- Chinese symbols: `RED_PIECES` and `BLACK_PIECES` objects map type to character — `board.js`
- `PIECE_VALUES` for AI evaluation — `ai.js`
- `EVAL_RANGE = 100` — full-scales the eval bar to roughly a chariot (± value), beyond which the bar clamps — `ai.js`

### Game State (`game` object, in `board.js`)
- `board[][]` — 2D array, each cell is `{type, color}` or `null`
- `currentTurn` — `'red'` or `'black'` (Red always goes first)
- `selectedPiece` — `[row, col]` or `null`
- `moveHistory[]` — array of `{from, to, piece, captured, timeMs, hash, status, chased}`; the full game record used for history restore and repetition judging (`timeMs` = elapsed clock, `hash` = position hash `'color,type...'` string for repetition, `status` = `POSITION_CANCEL/CHECK/CHASE/IDLE`, `chased` = set of chased victims this move)
- `capturedPieces` — `{red: [], black: []}`
- `initialBoard` — snapshot of the start position, the base for `restorePosition` replays
- `historyIndex` — index of the currently displayed position in `moveHistory`; `-1` = initial position; `makeMove` truncates later history when branching from a restored position
- `isFlipped` — boolean, board display orientation
- `vsAI` — boolean, default `true`
- `humanColor` — `'red'` or `'black'`, which color the human plays
- `aiDepth` — 1/2/3/4, default `2`
- `aiThinking` — boolean, prevents input during AI computation
- `gameOver` — boolean
- `notation` — `'chinese'` or `'wxf'` (move-history display format, default `'chinese'`)
- `musicOn` — boolean, whether background music is playing (default `false`)
- `moveStartTime` — timestamp marking when the current player's clock started, used by `makeMove` to record each move's elapsed time (`timeMs` on the history entry)
- `setupMode` — boolean, position-setup mode active
- `setupSelection` — `{type, color}` of the palette selection, `null` = eraser
- `setupBackup*` — snapshot of board/history/turn/captured/index/gameOver/overlay taken by `startPositionSetup` so `cancelPositionSetup` can restore it exactly

### Key Functions
| Function | File | Purpose |
|----------|------|---------|
| `initBoard()` | board.js | Sets up standard starting position |
| `getPieceSymbol()` | board.js | Returns Chinese character for a piece |
| `boardToScreen(row, col)` | board.js | Converts board coords to screen coords (flips if `game.isFlipped`) |
| `screenToBoard(row, col)` | board.js | Converts screen coords back to board coords (inverse of boardToScreen) |
| `isValidPos(row, col)` | board.js | Bounds check for board coordinates |
| `isInPalace(row, col, color)` | board.js | Checks if position is within the 3x3 palace |
| `isAcrossRiver(row, color)` | board.js | Checks if a piece has crossed the river |
| `countPiecesBetween()` | board.js | Counts pieces between two points (for cannon) |
| `getAllLegalMoves(color)` | rules.js | All moves that don't leave king in check and don't violate kings-facing rule |
| `getValidMoves(row, col)` | rules.js | Raw pseudo-legal moves for a piece (ignores check) |
| `isKingsFacing()` | rules.js | Flying general rule — kings on same column with no pieces between = illegal |
| `isInCheck(color)` | rules.js | Whether `color`'s king is under attack |
| `canLegallyCapture(attacker, victim)` | rules.js | Whether `attacker` can evade any check to legally capture `victim` (full legality incl. kings-facing) — the WXF chase predicate |
| `isProtectedVictim(attacker, victim)` | rules.js | True if any friendly piece of `victim` can legally capture `attacker` (chases against protected pieces are not chases) |
| `isExchangeAttack(attacker, victim)` | rules.js | True if the capturer is materially protected/equal — even exchanges are not chases |
| `computeMoveStatus(from, to)` | rules.js | Returns `{status, chased}` for the move about to be made: `POSITION_CANCEL` (capture/soldier advance), `POSITION_CHECK`, `POSITION_CHASE`, or `POSITION_IDLE` |
| `positionHash(board)` | move.js | A position key: `color,type` of every occupied square + side-to-move, used for repetition comparison |
| `judgeRepetition()` | move.js | WXF ruling entry point (called from `checkForCheckmate`) on a threefold repetition: perpetual check → checker loses, perpetual chase → chaser loses, mutual perpetual check/chase or idle threefold → draw. Sets `gameOver` and shows the overlay |
| `judgePlayer(playerMoves)` | move.js | Ranks one side's streak by WXF precedence (perpetual check beats perpetual chase beats idle); returns `VIOLATION_*` level |
| `judgeGame(redMoves, blackMoves)` | move.js | Compares both sides' violations to pick the verdict (who loses vs. draw) |
| `makeMove()` | move.js | Executes a move, switches turn, records in history (incl. `timeMs`, `hash`, `status`, `chased`); truncates later moves when branching from a restored position |
| `undoMove()` | move.js | Reverses last move |
| `checkForCheckmate()` | move.js | Detects checkmate AND stalemate (both = loss for stalemated player); then invokes `judgeRepetition` (no-op unless the position just repeated three times) |
| `toWXFMove()` | move.js | 4-digit WXF code: `{fromFile}{fromRank}{toFile}{toRank}` |
| `toChineseMove()` | move.js | Traditional Chinese notation (進/退/平, red files 1-9 from right, black 1-9 from left, 前/後/中 disambiguation) |
| `formatMove()` | move.js | Formats a history move using `game.notation` |
| `restorePosition(index)` | move.js | Replays `moveHistory[0..index]` from `initialBoard` to restore any earlier position (recomputes board, turn, captured pieces); `-1` = start position |
| `evaluateBoard()` | ai.js | Material evaluation for AI (soldiers worth more after crossing river) |
| `minimax()` | ai.js | Alpha-beta pruning AI search (uses `getAllLegalMoves`) |
| `aiMove()` | ai.js | AI entry point — color-aware, evaluates all legal moves via minimax |
| `drawBoard()` | render.js | Renders board grid, river text, palace lines, pieces, selection, valid moves |
| `drawPiece()` | render.js | Renders a single piece with circle, border, Chinese character (uses `boardToScreen`) |
| `getBoardCoords()` | render.js | Converts click event to board coordinates (uses `screenToBoard`) |
| `showGameOver()` | render.js | Displays the game-over modal with title and message |
| `updateTurnText()` | render.js | Updates the turn indicator text |
| `updateUI()` | render.js | Updates turn indicator, notation table, captured pieces display, eval bar |
| `updateEvalBar()` | render.js | Renders the eval bar: red fills from top proportional to `evaluateBoard()` (positive = Red), clamped to `±EVAL_RANGE`; updates on every `updateUI`, so move history clicks re-evaluate too |
| `formatElapsedTime(ms)` | render.js | Formats a move's `timeMs` as `8.4s` / `2:05` for the notation table |
| `startPositionSetup()` | board.js | Enters setup mode: snapshots the current game, clears the board, hides the game-over overlay |
| `selectSetupPiece(type, color)` | board.js | Picks the palette piece to place (or `selectSetupEraser()` for erase mode) |
| `placeSetupPiece(row, col)` | board.js | Places the selected piece on a square, or erases it in eraser mode |
| `clearSetupBoard()` | board.js | Empties the board in setup mode |
| `loadSetupStandard()` | board.js | Fills the setup board with the standard 32-piece start (via `initBoard`, remains in setup) |
| `validateSetupPosition()` | board.js | Enforces: exactly one king per side in its palace, no facing kings |
| `commitPositionSetup()` | board.js | Validates and commits the setup as a fresh game: snapshots `initialBoard`, resets history, exits setup, triggers the AI if it is their turn |
| `cancelPositionSetup()` | board.js | Restores the exact pre-setup snapshot (board, history, turn, captures, game-over state) |
| `enableMusic()` | render.js | Starts the background audio (handles browser autoplay rejection); sets `musicOn` and updates the button |
| `disableMusic()` | render.js | Pauses background audio, sets `musicOn=false` |
| `toggleMusic()` | render.js | Flips the music on/off state |
| `updateMusicButton()` | render.js | Reflects `game.musicOn` in the `#music-btn` label/class |

### Event Listeners (all in `main.js`)
| Element | Action |
|---------|--------|
| `#board` (canvas click) | Select/move pieces; first interaction auto-starts music; triggers `aiMove` after the human move in vs-AI mode; in setup mode, places/erases the selected piece and redraws |
| `#new-game-btn` | Resets board; triggers AI if human is Black (also exits any active setup mode) |
| `#undo-btn` | Undoes 2 moves in AI mode (AI+human pair), 1 in human mode (disabled during setup) |
| `#notation-table` | Clicking a move link restores that position (`restorePosition`) |
| `#flip-board-btn` | Toggles `game.isFlipped` and redraws |
| `#music-btn` | Toggles background music on/off |
| `#notation-btn` | Toggles move notation between 中文 and WXF, re-renders the table |
| `#ai-depth` | Changes AI search depth |
| `#vs-ai-btn` | Switches to AI mode, resets humanColor to red, shows side toggle |
| `#vs-human-btn` | Switches to human mode, hides side toggle |
| `#switch-sides-btn` | Swaps humanColor, auto-flips board, triggers AI if now playing as Black |
| `#setup-btn` | Opens the position-setup panel (`startPositionSetup`); while open, **Cancel Setup** closes it (`cancelPositionSetup`) |
| `#setup-palette .setup-piece-btn` | Selects a piece to place (`selectSetupPiece(type, color)`) |
| `#setup-eraser-btn` | Selects erase mode |
| `#setup-clear-btn` | Empties the setup board (`clearSetupBoard`) |
| `#setup-standard-btn` | Loads the standard start into setup (`loadSetupStandard`) |
| `#setup-turn-red-btn` / `#setup-turn-black-btn` | Chooses which side moves first after committing |
| `#setup-start-btn` | Commits the position (`commitPositionSetup`) or shows a validation error in `#setup-message` |
| `#setup-cancel-btn` | Returns to the pre-setup position (`cancelPositionSetup`) |
| `.study-btn` | Loads endgame study puzzle, forces humanColor to red; snapshots `initialBoard`, resets history (also exits any active setup mode) |
| `#game-over-btn` | Restarts game; triggers AI if human is Black |

### Move Validation per Piece Type (in `rules.js`, `getValidMoves`)
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
5. **WXF repetition rules** (threefold repetition → adjudication): perpetual check → the checking side loses; perpetual chase → the chasing side loses; mutual perpetual check or chase → draw; idle threefold repetition → draw. A capture or soldier advance "resets" (counts as `POSITION_CANCEL` and breaks the cycle). See `test/repetition.test.js`.

### AI
- Minimax with alpha-beta pruning
- **Move ordering (MVV-LVA)** — capture moves are searched first (most valuable victim, cheapest attacker), which maximizes alpha-beta cutoffs and speeds the search up ~2x+ **without changing the outcome**
- **Fast check detection** — `isInCheck` tests attacks directly (rays, cannon screens, horse legs, soldiers, king steps) instead of generating every opponent move; identical results, much faster
- Depth configurable 1-4 (default 2)
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

### Endgame Studies (6 puzzles, in `main.js`)
1. **Basic Checkmate** — Chariot + King vs King (flying general trap). Black King (0,3), Red King (9,4), Red Chariot (5,0). Solution: Chariot → (2,3).
2. **Chariot & Horse Mate** — Coordination pattern
3. **Cannon Mate** — Cannon with platform piece
4. **Double Cannon** — Two cannons mating net
5. **Horse & Cannon** — Classic attacking pair
6. **Chariot Mate** — Chariot with advisor block

### UI Features
- **vs Computer / vs Human** mode toggle
- **Switch Sides** button (visible in AI mode) — swaps human/AI colors, auto-flips board, AI opens if Red
- **AI Difficulty** dropdown (Easy/Medium/Hard/Expert = depth 1/2/3/4)
- **Undo move** — undoes 2 moves in AI mode (AI+human pair), 1 in human mode
- **Flip board** — mirrors the board display via coordinate transformation
- **Notation table** — its own panel to the right of the board; a scrollable table with move number, Red and Black columns
- **Clickable moves** — clicking any move in the notation table restores the board to that exact position (Red/Black pairs by move number, current position highlighted in gold)
- **Notation toggle** — button switches the table's format between `中文` (e.g. 炮八平五) and `WXF` (e.g. 俥 0919)
- **Evaluation bar** — vertical bar to the left of the moves table; red fills from the top proportional to material advantage (positive = ahead for Red, negative = Black). Recomputes after every move **and** whenever a move is clicked to restore a previous position (via `updateUI`). Hover shows the numeric score; full scale ≈ one chariot (`EVAL_RANGE=100`).
- **Per-move elapsed time** — each move in the notation table shows the actual time the mover spent on it (e.g. `8.4s`, `2:05`), recorded on the move in `makeMove`. The human's clock runs from when their turn starts until they move; the computer's clock runs from when `aiMove` begins thinking until it makes the move. Note: move times apply to real games only — when study **solutions** (preset move sequences) are added later, they will not report actual times.
- **Setup Position** — sidebar button opens a palette-driven editor: place any of 7 piece types in red or black, erase, clear, load the standard start, pick which side moves first; **Start Game** validates (kings compulsory in-palace, not facing) and commits as a fresh game, **Cancel Setup** restores the previous position/history exactly. New Game, studies, and mode switches auto-exit setup mode.
- **Background music** — lo-fi guqin piece that starts automatically once you begin playing (first board interaction satisfies the browser autoplay policy) and can be toggled anytime with the **Music** button in the sidebar.
- **History branching** — making a new move from a restored position truncates all later moves
- **Captured pieces** — displayed below the board for both sides
- **Game-over modal** — overlay with result and "Play Again" button
- **Click-to-select, click-to-move** with valid move indicators (yellow circles)
- **Endgame study** buttons — load preset puzzle positions

### Background Music
- `music/Qiu_Feng_Ci.ogg` — 《秋風詞》 *Qiu Feng Ci (Ode of the Autumn Wind)*, guqin, ~1 min 46 s loop.
- Attribution (CC BY 2.5): performed by Charlie Huang, from Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Qiu_Feng_Ci.ogg
- Played via an `<audio>` element (`#bg-music`, `loop`). Browsers only allow audio after a user gesture, so music auto-starts on the player's first board interaction and is also controllable via the **Music** button.

## Session History
- **Session 1**: Initial project creation, pushed to GitHub. Fixed Example 1 endgame study (was unsolvable — no one-move checkmate existed). Fixed AI minimax to use `getAllLegalMoves` instead of `getAllMoves`.
- **Session 2**: Removed unused `getAllMoves` function. Fixed flip board button (was toggling state but `drawBoard`/`drawPiece`/`getBoardCoords` never used it — added `boardToScreen`/`screenToBoard` helpers). Added Switch Sides feature (`game.humanColor`, color-aware `aiMove`, auto-flip, AI first move trigger).
- **Session 3**: Added `README.md`; merged `PROJECT.md` documentation into this file.
- **Session 4**: Added regression tests (`node --test`, sandboxed VM harness with DOM stubs). Added move-history notation: WXF digit code + traditional Chinese (進/退/平 with 前/後/中 disambiguation), with a toggle button.
- **Session 5**: Moved notation into its own table panel to the right of the board (move number + Red/Black columns). Made every move a clickable link that restores that position via `restorePosition(index)` (replays from `initialBoard` snapshot — recomputes board, turn, captured pieces; current position highlighted). Making a move from a restored position truncates later history. Pending AI moves are invalidated after restore/new game. 35 tests passing.
- **Session 6**: Added an evaluation bar next to the moves table (vertical, red-from-top = Red advantage, clamped to `±EVAL_RANGE=100`). The bar re-renders on every `updateUI`, so it follows normal moves **and** clicking any move in the table to jump to that position re-evaluates the bar. 40 tests passing.
- **Session 7**: Added background music — downloaded the CC BY 2.5 guqin piece 《秋風詞》 (Qiu Feng Ci, Charlie Huang) from Wikimedia Commons into `music/`. Audio starts on the player's first board click (autoplay policy) and a **Music** button toggles it on/off. 43 tests passing.
- **Session 8**: Split the 1224-line monolith `game.js` into six load-ordered scripts — `board.js` (state/geometry), `rules.js`, `move.js`, `ai.js`, `render.js`, `main.js` — with identical behavior. The test harness now concatenates the same file list in the same order as the browser script tags. All 43 tests still pass; `game.js` removed.
- **Session 9**: Added per-move elapsed time — `makeMove` records `timeMs` (elapsed since `game.moveStartTime`), the AI's clock starts when `aiMove` begins thinking, and the notation table shows the actual time next to each move (`formatElapsedTime`: `8.4s` / `2:05`). 46 tests passing. (Studies solutions, when added later, will not report times.)
- **Session 10**: Added **Expert** AI difficulty (Depth 4). Speed-optimized the engine without changing its logic: MVV-LVA **move ordering** (captures first → far better alpha-beta pruning) and direct attack detection in `isInCheck` (rays/cannon screens/horse legs/soldiers instead of generating every opponent move). Verified behavior-identical via a 3000-position differential test (0 mismatches) and added check-variant tests (cannon screen, soldier forward/lateral, horse leg). Depth 3 timed 1763 ms → 784 ms; Depth 4 now ~4.3 s. 49 tests passing.
- **Session 11**: Added full WXF repetition rules (Tan & Medina, "Complete Implementation of WXF Chinese Chess Rules"). Every move records a position hash (`color+type` per square + side to move), a per-move *status* (`POSITION_CANCEL` for captures/soldier advances, `POSITION_CHECK`, `POSITION_CHASE` when the mover threatens legal capture of exactly one unprotected, non-exchange, non-king, non-un-rivered-soldier victim, else `POSITION_IDLE`), and the chased victim set. `judgeRepetition` (called from `checkForCheckmate`) applies WXF rulings on a threefold repetition: perpetual check → checker loses; perpetual chase → chaser loses; mutual perpetual check/chase or idle threefold repetition → draw. Chase detection is WXF-aware: protected victims and even exchanges are not chases, lone-king/pawn chasing is exempt, and "king kills" are not chased. Enforced by `canLegallyCapture` (full legality, incl. kings-facing). 6 repetition tests: perpetual check loss, perpetual chase loss, idle-repetition draw, capture-breaks-cycle, and synthetic mutual-perpetual-check/chase draws. 55 tests passing.
- **Session 12**: Added a **Setup Position** mode for building custom positions from scratch. The sidebar button opens a panel with a 14-piece palette (7 types × red/black), an eraser, Clear Board, Standard Start, and a side-to-move toggle; clicking board squares places/removes pieces. `Start Game` validates the position (exactly one king per side, each inside its palace, kings not facing on an empty file) before committing it as a fresh game (snapshots `initialBoard`, resets history, hands the move to the AI if it's their turn); `Cancel` restores the exact pre-setup board/history/turn. New Game, studies, and mode switches auto-exit setup; "Check!" text is suppressed while the board is incomplete. 9 new setup tests (place/erase, clear, validation failures, facing-kings rejection, commit, cancel-restore, standard load, exit-on-reset) — 64 tests passing.
- **Session 13**: Code-health cleanup. Decided no source file needs splitting (largest is `rules.js` at 423 lines, all cohesive); refactored the single 870-line `test/game.test.js` into five themed files — `game.test.js` (core engine, 300), `notation.test.js` (166), `repetition.test.js` (157), `setup.test.js` (138), `ui.test.js` (129) — each with its own sandboxed `loadGame()`. Brought this README up to date: refreshed the file table/line counts, documented the WXF repetition rules + position-setup engine in the architecture/key-functions/listeners sections, moved the repetition rule into Implemented Rules, fixed the stale "no draw rule" Known Issue (repetition now implemented; only the WXF 60-move rule is missing), and added a Development Notes section below. Still 64 tests passing.

## Known Issues / TODO Ideas
- AI evaluation is material-only, no positional awareness or piece-square tables
- No WXF 60-move rule (a 120-ply stretch with no capture and no soldier advance is not auto-drawn; repetition rules above do apply)
- No check/checkmate sound effects or animations
- Endgame studies only set up position; no "solution" validation

## Development Notes (for future sessions)
- **Standard flow at the start of a session:** run `node --test` to confirm the baseline (currently 64 tests / 14 suites), read this README's Session History + Architecture to reload context, and inspect `git status`/`git log --oneline` for where things were left off.
- **Encoding:** all source files are UTF-8. NEVER use PowerShell `Set-Content`/`Out-File` to write or rewrite `.js`/`.html`/`.css`/`.md` files — it can corrupt UTF-8 (encoding warnings). Use the assistant's file tools (Read/Write/Edit) instead.
- **Load order / harness:** the six source scripts share global scope; cross-file calls all happen at runtime, so order only matters for load-time code. The test harness concatenates the same order as `index.html` — if you add a script tag to the page you must update `test/harness.js`'s file list too.
- **DOM stubs:** harness element stubs (`api.__elements[id]`) only know the IDs listed in `harness.js`. New UI controls must be added to `harness.js` before tests can `.click()` them or read their `textContent`/`style`. Button handlers are recorded via `addEventListener`, and `.click()` fires them.
- **Test style:** one `loadGame()` per test file (isolated sandbox). `setBoard(api, [[r,c,type,color], ...])` sets a custom position. Use `assert.deepEqual` (not `deepStrictEqual`) because VM-realm objects differ.
- **Conventions:** `makeMove(r,c,toR,toC)` in tests; `api.__elements['id']` for DOM assertions; new features get regression tests in the matching themed file (or a new `*.test.js`).
- **Git:** only commit and push (`origin main`) when the user explicitly asks. Update the README Session History with the session's changes before pushing. CRLF/ LF line-ending warnings from git are harmless on Windows.