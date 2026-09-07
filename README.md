# Xiangqi (Chinese Chess) Project

## Quick Start
Open `index.html` in a browser (double-click, or `Start-Process index.html` on Windows). No build step, no dependencies.

**Tests:** `node --test` (uses Node's built-in test runner; no dependencies).

**Repo:** https://github.com/ngtingfai/Xiangqi — `main` branch, `gh` CLI authed as `ngtingfai`. Only commit/push when explicitly asked.

## Current State
Quick snapshot for resuming work — read this plus the Architecture section; skip the older history.

- **Files:** 7 load-ordered source files (no build step): `board.js` → `rules.js` → `move.js` → `ai.js` → `render.js` → `examples/endgame_examples.js` → `main.js`. That 7-file list must match `index.html` script tags (see `test/harness.js`).
- **AI:** minimax with alpha-beta + PVS, an equal-depth transposition table (64-bit Zobrist), and incremental evaluation — verified behavior-identical to the old engine via a 596-position differential harness (0 mismatches). ~1.6–1.7× faster at Expert (depth 4), ≈ parity elsewhere. The `minimax` signature is `(depth, alpha, beta, isMaximizing, evalScore, keyHi, keyLo)` with 4-arg-compatible defaults; `aiMove` does a single `searchRoot` pass to `aiDepth-1`.
- **UI:** music is toggled only by the Music button (board clicks never touch it). The card to the right of the moves table is **Launch Options** — pick **Standard Game** (fresh game; the sidebar **New Game** button is the quick-reset duplicate), **Bespoke Setup** (the position editor), or **Endgame Examples** (six puzzles in `examples/endgame_examples.js`); the three are mutually exclusive highlights. The sidebar holds four explicit **controller modes** — Human Red vs Computer Black (default), Computer Red vs Human Black, Human Red vs Human Black, and Computer Red vs Computer Black (autoplay). **Mode switches never reset the board**, so they work mid-game, during a setup, or on a loaded endgame example. The game-over modal offers **Play Again** plus **Game Review**, which closes the modal and leaves the finished position on the board so the game can be studied via the Move Table (click a move to restore that position). The captured-piece trays **sandwich the playing board**: Black's tray above and Red's below it in the normal view, swapping sides when the board is flipped (flip button or Computer Red mode), so the board always sits between the two trays — a built-in orientation guide when placing a position from scratch in Bespoke Setup. Each tray shows the captures that side has taken, and every captured piece is rendered in **its own color** (a black piece in Red's tray still looks black), so a tray reads as "which of the opponent's men this side has captured".
- **Rules:** stalemate = loss; flying-general (kings-facing); WXF repetition judging (perpetual check/chase + threefold draw); no 60-move rule yet.
- **Tests:** `node --test` → 90 tests / 15 suites. Uses a sandboxed VM harness with DOM stubs (functional `classList`); `setBoard` resets setup/music/panel state.
- **Dev cautions:** UTF-8 — never write source files with PowerShell `Set-Content`/`Out-File`. Commit/push only when asked.

## Overview
A browser-based Xiangqi (Chinese Chess) game built with vanilla HTML/CSS/JavaScript (no frameworks). Rendered on an HTML5 Canvas. Supports four controller modes (Human vs Computer, Computer vs Human, Human vs Human, Computer vs Computer autoplay) on a configurable AI difficulty, plus board flip, undo, endgame examples, and move history in WXF or traditional Chinese notation (toggleable).

**Local path:** `C:\Users\user\Desktop\TF\VScode\Xiangqi`

## Files
> Line counts are approximate snapshots; test files were split by theme in Session 13.
| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 153 | Main HTML page with sidebar UI (four controller-mode buttons), canvas, moves panel + eval bar, a **Launch Options** card (Standard Game / Bespoke Setup / Endgame Examples) to the right of the moves panel, background-music audio, game-over modal (Play Again / Game Review), captured-piece trays sandwiching the board |
| `style.css` | 735 | Dark-themed UI styling with gradient background |
| `board.js` | 437 | Board model: constants, piece symbols, `game` state (incl. `redController`/`blackController` + `isAIControlled`), `initBoard`, geometry/palace/river/flip helpers, position-setup engine + `validateSetupPosition` sanity checks |
| `rules.js` | 470 | Movement rules: `getValidMoves`, `getAllLegalMoves` (single-scan king-position cache), `isInCheck` (direct attack detection, optional cached coords), `isKingsFacing` (optional cached coords), WXF chase helpers (`canLegallyCapture`, `isProtectedVictim`, `isExchangeAttack`, `computeMoveStatus`) |
| `move.js` | 278 | Move engine: `makeMove` (records elapsed time + position hash/status), `undoMove`, `restorePosition`, `checkForCheckmate`, WXF repetition judging (`positionHash`, `judgePlayer`, `judgeGame`, `judgeRepetition`), notation (`toWXFMove`/`toChineseMove`/`formatMove`) |
| `ai.js` | 350 | AI: `PIECE_VALUES`, `EVAL_RANGE`, `evaluateBoard` (incremental), 64-bit Zobrist keys, equal-depth transposition table, `minimax` (alpha-beta + PVS), `searchRoot`, `orderMoves`/`orderMovesPlies`, `aiMove(color)` (auto-chains for AI-vs-AI) |
| `render.js` | 276 | Rendering + UI: canvas setup, `drawBoard`, `drawPiece`, `getBoardCoords`, `updateUI`, `updateEvalBar`, `formatElapsedTime`, `showGameOver`, music functions |
| `main.js` | 261 | Wiring: all event listeners, canvas click handler, Launch Options handlers, game-over Play Again / Game Review, `ENDGAME_EXAMPLES` loading, startup |
| `examples/endgame_examples.js` | 69 | `ENDGAME_EXAMPLES` — the six endgame example positions (name, description, board setup) |
| `test/harness.js` | 161 | Loads the source files in order in a sandboxed VM with DOM stubs |
| `test/game.test.js` | 300 | Core regression tests: setup, geometry, piece movement, check/legal filtering, move exec/undo, end-of-game, evaluation |
| `test/notation.test.js` | 166 | Notation (`toWXFMove`/`toChineseMove`/`formatMove`, toggle) + `restorePosition` / clickable-move links |
| `test/repetition.test.js` | 178 | WXF repetition rules: perpetual check/chase losses, threefold idle draw, capture-breaks-cycle, mutual check/chase draws, protected-victim-is-not-a-chase regression |
| `test/setup.test.js` | 213 | Position setup: enter/clear/erase, validation (kings, facing, material limits, reachability, side-to-move check), commit, cancel-restore, standard load, exit-on-reset |
| `test/ui.test.js` | 366 | DOM-coupled UI: evaluation bar, music toggle, endgame-examples panel toggle, controller-mode + board-flip (captured-tray `flipped` class), launch options, game-over review, captured-tray contents, move timing |
| `music/Qiu_Feng_Ci.ogg` | — | Background music track (see Background Music section below) |
| `README.md` | — | This file — project documentation |

## Tests
- Run with `node --test` from the repo root. Built-in `node:test` runner, zero dependencies.
- `test/harness.js` evaluates the seven source files (`board.js` → `rules.js` → `move.js` → `ai.js` → `render.js` → `examples/endgame_examples.js` → `main.js`, concatenated in that order, matching the `index.html` script tags) inside a `vm` context with stubbed `document`/canvas/`ctx`, then exposes the module's functions via a `globalThis.__api` epilogue. An element stub records event listeners so button handlers can be exercised via `.click()` (a functional `classList` stub reflects the current `className`, so panels that show/hide via `hidden` work). Every test file calls `loadGame()` itself — each suite gets its own sandboxed copy, so tests never share state.
- Test files (each discovered by `node --test` automatically): `game.test.js` (core engine), `notation.test.js` (notation + history restore), `repetition.test.js` (WXF draw rules), `setup.test.js` (position editor), `ui.test.js` (eval bar, music, endgame-examples toggle, timing).
- Coverage highlights: standard setup, 44 legal opening moves each, palace/river helpers, board-flip transforms, per-piece move rules, kings-facing filter, check detection, pinned-piece rules, capture/undo, checkmate + stalemate (loss), evaluation values, WXF/Chinese notation incl. 前/後 disambiguation, history restore (`restorePosition` replays ✅, branch truncation, captured-pieces recompute, clickable move links), the evaluation bar (centering, red advantage, capture updates, restore updates, clamping), the music toggle (off-by-default, on/off flipping, board interaction never toggles it), move timing (elapsed recording, clock reset, table rendering), WXF repetition (perpetual check/chase, threefold draw, capture-breaks-cycle, mutual check/chase), and position setup (place/erase, clear, validation failures, facing-kings rejection, commit, cancel-restore, standard load, exit-on-reset), and the endgame-examples panel (reveal/hide, mutual exclusion with setup), and the launch options (Standard Game resets and clears panels, Bespoke Setup / Endgame Examples mutual-exclusion highlights, re-click toggles off, setup-cancel clears the highlight), and the four controller modes (default Human Red vs Computer Black, Human-vs-Human clears both sides without resetting the position, Computer-Red flips for Black, Computer-vs-Computer sets both to AI, mode switch preserves an in-progress setup).
- Note: values returned by the sources come from a different JS realm (vm), so tests use `assert.deepEqual` (not `deepStrictEqual`) for objects/arrays.

## Architecture (client-side, no build step)

The game is split into seven plain files loaded in dependency order from `index.html`; they share the page's global scope (`const game` lives in `board.js`, so order matters only for load-time code — all cross-file calls happen at runtime).

### File breakdown & dependency order
1. **`board.js`** — constants (`BOARD_SIZE=9`, `BOARD_HEIGHT=10`, `CELL_SIZE=65`, `MARGIN=40`), piece symbols (`RED_PIECES`/`BLACK_PIECES`), the `game` state object, `aiMoveSequence` guard, `initBoard()`, geometry helpers (`isValidPos`, `isInPalace`, `isAcrossRiver`, `boardToScreen`/`screenToBoard`), and the position-setup engine (`startPositionSetup`, `placeSetupPiece`, `validateSetupPosition`, `commitPositionSetup`, `cancelPositionSetup`, etc.).
2. **`rules.js`** — pseudo-legal and legal move generation (`getValidMoves`, `getAllLegalMoves`), check (`isInCheck`), flying-general (`isKingsFacing`), and the WXF chase-detection helpers (`canLegallyCapture`, `isProtectedVictim`, `isExchangeAttack`, `computeMoveStatus`).
3. **`move.js`** — move/history engine (`makeMove`, `undoMove`, `restorePosition`, `checkForCheckmate`), WXF repetition judging (`positionHash`, `judgePlayer`, `judgeGame`, `judgeRepetition`), and notation (`toWXFMove`, `getChineseFile`, `getChineseMovePrefix`, `toChineseMove`, `formatMove`).
4. **`ai.js`** — `PIECE_VALUES`, `EVAL_RANGE`, `evaluateBoard`, `minimax` (alpha-beta), `aiMove`.
5. **`render.js`** — canvas setup and constants, `drawBoard`, `drawPiece`, `getBoardCoords`, DOM UI (`updateUI`, `updateEvalBar`, `formatElapsedTime`, `showGameOver`, `updateTurnText`), music control (`enableMusic`/`disableMusic`/`toggleMusic`/`updateMusicButton`).
6. **`examples/endgame_examples.js`** — the `ENDGAME_EXAMPLES` array (name, description, board-setup function for each of the six endgame examples). Loaded before `main.js`, whose study listeners read it.
7. **`main.js`** — the canvas click handler, all button/table listeners (incl. the **Launch Options** handlers: Standard Game / Bespoke Setup / Endgame Examples), and the startup sequence (`initBoard(); drawBoard(); updateUI(); updateMusicButton(); updateSetupPalette();` plus building the piece palette).

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
- `redController` — `'human'` or `'ai'`, who controls Red (default `'human'`)
- `blackController` — `'human'` or `'ai'`, who controls Black (default `'ai'`); helper `isAIControlled(color)` answers "is this side played by the computer?"
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
| `evaluateBoard()` | ai.js | Material evaluation for AI (soldiers worth more after crossing river); used once for the root, with per-move deltas (`pieceValue`/`evalDelta`) threaded through the search |
| `minimax()` | ai.js | Alpha-beta search with PVS (principal-variation null-window) and an equal-depth transposition table (64-bit Zobrist); threads `evalScore` and the board hash-key through recursion |
| `searchRoot(moves, depth, color, isMaximizing, rootEval, rootKeyHi, rootKeyLo)` | ai.js | Searches each root move at full window and returns the best 4-digit move |
| `aiMove(color)` | ai.js | AI entry point — color-aware (`color` = the AI side to move), orders root moves (MVV-LVA), does a single `searchRoot` pass to `aiDepth-1`, then chains to the other side if it is also AI-controlled |
| `drawBoard()` | render.js | Renders board grid, river text, palace lines, pieces, selection, valid moves |
| `drawPiece()` | render.js | Renders a single piece with circle, border, Chinese character (uses `boardToScreen`) |
| `getBoardCoords()` | render.js | Converts click event to board coordinates (uses `screenToBoard`) |
| `showGameOver()` | render.js | Displays the game-over modal with title and message |
| `updateTurnText()` | render.js | Updates the turn indicator text |
| `updateUI()` | render.js | Updates turn indicator, notation table, captured pieces display, captured-tray side (Black above / Red below, swapped via `board-container.flipped` when `isFlipped`), eval bar |
| `updateEvalBar()` | render.js | Renders the eval bar: red fills from top proportional to `evaluateBoard()` (positive = Red), clamped to `±EVAL_RANGE`; updates on every `updateUI`, so move history clicks re-evaluate too |
| `formatElapsedTime(ms)` | render.js | Formats a move's `timeMs` as `8.4s` / `2:05` for the notation table |
| `startPositionSetup()` | board.js | Enters setup mode: snapshots the current game, clears the board, hides the game-over overlay |
| `selectSetupPiece(type, color)` | board.js | Picks the palette piece to place (or `selectSetupEraser()` for erase mode) |
| `placeSetupPiece(row, col)` | board.js | Places the selected piece on a square, or erases it in eraser mode |
| `clearSetupBoard()` | board.js | Empties the board in setup mode |
| `loadSetupStandard()` | board.js | Fills the setup board with the standard 32-piece start (via `initBoard`, remains in setup) |
| `validateSetupPosition()` | board.js | Runs the full setup sanity-check suite (see **Setup Position validation** below); returns `null` when valid, else a `\n`-joined message listing every problem |
| `commitPositionSetup()` | board.js | Validates and commits the setup as a fresh game: snapshots `initialBoard`, resets history, exits setup, triggers the AI if it is their turn |
| `cancelPositionSetup()` | board.js | Restores the exact pre-setup snapshot (board, history, turn, captures, game-over state) |
| `enableMusic()` | render.js | Starts the background audio (handles browser autoplay rejection); sets `musicOn` and updates the button |
| `disableMusic()` | render.js | Pauses background audio, sets `musicOn=false` |
| `toggleMusic()` | render.js | Flips the music on/off state |
| `updateMusicButton()` | render.js | Reflects `game.musicOn` in the `#music-btn` label/class |

### Event Listeners (all in `main.js`)
| Element | Action |
|---------|--------|
| `#board` (canvas click) | Select/move pieces; after a move, triggers `aiMove` if the side to move is AI-controlled; in setup mode, places/erases the selected piece and redraws |
| `#new-game-btn` | Quick-reset duplicate of **Launch Options → Standard Game**: resets board (also closes open launch panels/exits setup); triggers AI if the side to move is AI |
| `#undo-btn` | Undoes 2 moves when any side is AI-controlled (AI+human pair, or two AI plies), 1 move in pure-human mode (disabled during setup) |
| `#notation-table` | Clicking a move link restores that position (`restorePosition`) |
| `#flip-board-btn` | Toggles `game.isFlipped` and redraws |
| `#music-btn` | Toggles background music on/off |
| `#notation-btn` | Toggles move notation between 中文 and WXF, re-renders the table |
| `#ai-depth` | Changes AI search depth |
| `#mode-hr-cb` | Controller mode **Human Red vs Computer Black** (default): `redController='human'`, `blackController='ai'`; cancels any pending AI move and, if the side to move is AI, moves it |
| `#mode-cr-hb` | Controller mode **Computer Red vs Human Black**: `redController='ai'`, `blackController='human'`; auto-flips the board so Black's pieces sit at the bottom |
| `#mode-hr-hb` | Controller mode **Human Red vs Human Black**: both controllers `'human'` (one or two people) |
| `#mode-cr-cb` | Controller mode **Computer Red vs Computer Black**: both controllers `'ai'` (autoplay — `aiMove` chains until the game ends) |
| `#standard-btn` | Launch option: fresh standard game (`initBoard`), closes both launch panels and clears their highlights |
| `#setup-btn` | Launch option **Bespoke Setup**: starts the position editor (`startPositionSetup`), highlights itself, hides Endgame Examples; a second click or **Cancel Setup** closes it (`cancelPositionSetup`) |
| `#examples-btn` | Launch option **Endgame Examples**: reveals the study list, highlights itself, hides Bespoke Setup; a second click hides it. Opening it exits any active setup mode |
| `#setup-palette .setup-piece-btn` | Selects a piece to place (`selectSetupPiece(type, color)`) |
| `#setup-eraser-btn` | Selects erase mode |
| `#setup-clear-btn` | Empties the setup board (`clearSetupBoard`) |
| `#setup-standard-btn` | Loads the standard start into setup (`loadSetupStandard`) |
| `#setup-turn-red-btn` / `#setup-turn-black-btn` | Chooses which side moves first after committing |
| `#setup-start-btn` | Runs validation and commits the position (`commitPositionSetup`), or lists every problem in `#setup-message` |
| `#setup-cancel-btn` | Returns to the pre-setup position (`cancelPositionSetup`) |
| `.study-btn` | Loads an endgame example position; snapshots `initialBoard`, resets history (also exits any active setup mode); if the side to move is AI-controlled, moves it |
| `#game-over-btn` | Restarts the game; triggers AI if the side to move is AI |
| `#game-over-review-btn` | Closes the game-over modal and leaves the finished position on the board to study via the Move Table (clicking a move link restores that position) |

### Setup Position validation (in `board.js`, `validateSetupPosition`)
All checks run **when Start Game is pressed** in Bespoke Setup (every problem is reported at once in `#setup-message`; nothing is committed unless the list is empty):
1. **Kings** — exactly one per side, each inside its own palace; the two kings may not face each other down an empty file.
2. **Material limits** — a side may not exceed the pieces that exist for it in the game: ≤ 2 chariots/horses/cannons/elephants/advisors, ≤ 5 soldiers.
3. **Reachability** — every placed piece must be reachable from its normal start:
   - elephants only on the seven own-side elephant squares (they never cross the river),
   - advisors only on a palace diagonal square,
   - soldiers never behind their starting rank (Red rows 0–6, Black rows 3–9).
4. **Side to move** — the side that is NOT to move must not be in check (e.g. with Red to move, Red must not already be giving check to the Black king).

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
- Minimax with alpha-beta pruning plus **PVS** (principal-variation search) and an **equal-depth transposition table** with 64-bit Zobrist hashing (the table only reuses entries from the same search depth, so it is always exact)
- **Incremental evaluation** — only the root position is fully scanned (`evaluateBoard`); every child of the search inherits a per-move score delta (`pieceValue`/`evalDelta`), so interior nodes never rescan the board. Returned scores are bit-identical to a full rescan at every leaf
- **Move ordering** — MVV-LVA at the root (most valuable victim, cheapest attacker), and captures → transposition-table move → quiet moves inside the search (`orderMovesPlies`); maximizes alpha-beta cutoffs **without changing the outcome**
- **Fast check / kings-facing** — `isInCheck` tests attacks directly (rays, cannon screens, horse legs, soldiers, king steps) and `getAllLegalMoves` caches both king positions in one board scan, passing coordinates to `isInCheck`/`isKingsFacing`; identical results, faster
- Depth configurable 1-4 (default 2)
- Color-aware: `aiMove(color)` maximizes for Red, minimizes for Black (identified by `game.currentTurn` at call time, not a fixed human color) — so any side can be AI-controlled
- Uses `getAllLegalMoves` for correct stalemate/checkmate detection
- Terminal states: no legal moves = -100000 or +100000 (fail-soft values)
- Evaluation: material count only (no positional tables)
- Session 14 note: killer-move/history heuristics and an iterative-deepening warmup loop were prototyped and then removed — benchmarks showed they added nodes and bookkeeping with zero benefit, because the equal-depth TT (not the ID search order) is what drives the pruning (see Session History)

### Coordinate System (Board Flip)
- `boardToScreen(row, col)` — when `game.isFlipped`, transforms `(r,c)` → `(BOARD_HEIGHT-1-r, BOARD_SIZE-1-c)`, mirroring both axes
- `screenToBoard(row, col)` — inverse transform for click handling
- Used by `drawPiece()`, selection/move indicators in `drawBoard()`, and `getBoardCoords()`
- Board grid, river text, and palace diagonals are drawn at fixed visual positions (symmetric, no flip needed)
- Auto-flips when switching sides to play as Black

### Endgame Examples (6 puzzles, in `examples/endgame_examples.js`)
1. **Basic Checkmate** — Chariot + King vs King (flying general trap). Black King (0,3), Red King (9,4), Red Chariot (5,0). Solution: Chariot → (2,3).
2. **Chariot & Horse Mate** — Coordination pattern
3. **Cannon Mate** — Cannon with platform piece
4. **Double Cannon** — Two cannons mating net
5. **Horse & Cannon** — Classic attacking pair
6. **Chariot Mate** — Chariot with advisor block

### UI Features
- **Four explicit controller modes** — **Human Red vs Computer Black** (default), **Computer Red vs Human Black**, **Human Red vs Human Black**, and **Computer Red vs Computer Black** (autoplay: `aiMove` chains side to side until the game ends). Switching modes NEVER resets the board, so it works mid-game, during a setup, or on a loaded endgame example
- **Board flip** — manual Flip Board button plus auto-flip when the human takes Black
- **AI Difficulty** dropdown (Easy/Medium/Hard/Expert = depth 1/2/3/4)
- **Undo move** — undoes 2 moves in AI mode (AI+human pair), 1 in human mode
- **Notation table** — its own panel to the right of the board; a scrollable table with move number, Red and Black columns
- **Clickable moves** — clicking any move in the notation table restores the board to that exact position (Red/Black pairs by move number, current position highlighted in gold)
- **Notation toggle** — button switches the table's format between `中文` (e.g. 炮八平五) and `WXF` (e.g. 俥 0919)
- **Evaluation bar** — vertical bar to the left of the moves table; red fills from the top proportional to material advantage (positive = ahead for Red, negative = Black). Recomputes after every move **and** whenever a move is clicked to restore a previous position (via `updateUI`). Hover shows the numeric score; full scale ≈ one chariot (`EVAL_RANGE=100`).
- **Per-move elapsed time** — each move in the notation table shows the actual time the mover spent on it (e.g. `8.4s`, `2:05`), recorded on the move in `makeMove`. The human's clock runs from when their turn starts until they move; the computer's clock runs from when `aiMove` begins thinking until it makes the move. Note: move times apply to real games only — when example **solutions** (preset move sequences) are added later, they will not report actual times.
- **Launch Options** — the card to the right of the Move Table groups every "start a position" choice under one **Launch Options** header: **Standard Game** (fresh standard game), **Bespoke Setup** (position editor), and **Endgame Examples** (puzzle list). The three are mutually exclusive highlights; opening one closes the others and Standard Game/New Game clears any highlight. The sidebar **New Game** button is a quick-reset duplicate of Standard Game.
- **Bespoke Setup** — the launch option that opens the palette-driven editor: place any of 7 piece types in red or black, erase, clear, load the standard start, pick which side moves first; **Start Game** validates (kings compulsory in-palace, not facing) and commits as a fresh game, **Cancel Setup** restores the previous position/history exactly. New Game and Standard Game exit setup mode.
- **Endgame Examples** — the launch option that reveals the six example positions in their own folder (`examples/`), toggled like Bespoke Setup. Loading an example keeps the current controller mode: in Human-vs-Human one person plays both sides of the puzzle; in Human Red vs Computer Black the human solves it as Red; in Computer Red vs Human Black the AI plays Red; and in Computer-vs-Computer the AI plays both sides (a "solve the puzzle" demo).
- **Background music** — lo-fi guqin piece (《秋風詞》) controlled by a single **Music** button: click to start, click again to stop. The button is the only control — playing a move never turns the sound on or off.
- **History branching** — making a new move from a restored position truncates all later moves
- **Captured pieces** — displayed below the board for both sides
- **Game-over modal** — overlay with result and "Play Again" button
- **Click-to-select, click-to-move** with valid move indicators (yellow circles)
- **Endgame Examples** buttons — load preset puzzle positions from the collapsible panel

### Background Music
- `music/Qiu_Feng_Ci.ogg` — 《秋風詞》 *Qiu Feng Ci (Ode of the Autumn Wind)*, guqin, ~1 min 46 s loop.
- Attribution (CC BY 2.5): performed by Charlie Huang, from Wikimedia Commons — https://commons.wikimedia.org/wiki/File:Qiu_Feng_Ci.ogg
- Played via an `<audio>` element (`#bg-music`, `loop`). Controlled only by the **Music** button (`#music-btn`); the click satisfies the browser's autoplay-policy gesture requirement, and playing a move does not affect the sound.

## Session History
Recent sessions (14-16) describe the current design in detail; older entries are one-liners. See "Current State" above for the fastest resume path.
- **Session 1**: Project creation, pushed to GitHub. Fixed unsolvable Example 1 endgame study; AI minimax now uses `getAllLegalMoves`.
- **Session 2**: Added Switch Sides (color-aware `aiMove`, auto-flip, AI opener); fixed Flip Board to actually mirror via `boardToScreen`/`screenToBoard`; removed unused `getAllMoves`.
- **Session 3**: Added `README.md` (merged `PROJECT.md`).
- **Session 4**: Added the regression-test harness (sandboxed VM + DOM stubs, `node --test`); added move notation (WXF + traditional Chinese 進/退/平) with a toggle.
- **Session 5**: Notation moved to its own panel beside the board; every move is a clickable link restoring that position via `restorePosition` (branching truncates later history). 35 tests.
- **Session 6**: Added the evaluation bar next to the moves table (red-from-top, clamped to `±EVAL_RANGE=100`). 40 tests.
- **Session 7**: Added background music 《秋風詞》 (`music/`, CC BY 2.5) with a **Music** button. 43 tests.
- **Session 8**: Split the 1224-line `game.js` monolith into six load-ordered scripts; test harness mirrors the browser script order; `game.js` removed.
- **Session 9**: Per-move elapsed time recorded in `makeMove` and shown in the notation table (e.g. `8.4s`). 46 tests.
- **Session 10**: Added **Expert** difficulty (depth 4); MVV-LVA move ordering + direct attack detection in `isInCheck`; verified with a 3000-position differential (0 mismatches). 49 tests.
- **Session 11**: Full WXF repetition rules — perpetual check → checker loses, perpetual chase → chaser loses, mutual/threefold idle → draw; enforced via `canLegallyCapture`/`judgeRepetition`. 55 tests.
- **Session 12**: Added **Setup Position** mode (palette-driven editor, validation, commit/cancel, standard start). 64 tests.
- **Session 13**: Code-health cleanup — split the 870-line `game.test.js` into five themed test files; README refreshed (still 64 tests).
- **Session 14**: "Faster without changing the logic." Made the AI search significantly faster while keeping every selected move and score identical. `rules.js`: `getAllLegalMoves` now caches both king positions in a single board scan and passes coordinates to `isInCheck`/`isKingsFacing` (optional coords preserve the original scanning behavior). `ai.js`: rewritten with 64-bit Zobrist keys, an equal-depth transposition table, PVS (principal-variation) search, and incremental evaluation — only the root board is evaluated; each child threads a per-edge score delta. Killer-move/history heuristics and an iterative-deepening warmup loop were prototyped, benchmarked as **pure overhead** (more nodes + bookkeeping, zero benefit because the equal-depth TT is what drives pruning), and removed. Two subtle bugs were hunted down with a 596-position differential harness (old vs new engine in the same VM) and fixed: a negative-array-index transposition-table lookup (`key % TT_SIZE` on int32-truncated keys) and a wrong PVS null-window bound in the minimizing branch (must be `[beta-1, beta]` with re-search on `value < beta`). Verified: 64 tests pass; all **596 position/depth pairs (depths 1-4) return identical moves and scores (0 mismatches)**. Median timings (start position, sandboxed VM, 3-4 runs each): Medium (depth 2) ≈ parity, Hard (depth 3) ≈ parity, **Expert (depth 4) ~43 s → ~26 s (~1.6-1.7x faster)**; midgame depth 4 ~19 s → ~11 s.
- **Session 15**: Music is now controlled by the **Music** button alone. Removed the canvas-click auto-start (previously the first board interaction enabled the sound), so if the user toggles music off, playing a move will not turn it back on — and toggling on likewise has no other path that can stop it. Added 2 regression tests for the new behavior (board interaction does not enable music; stays off after toggle-off + a move). 66 tests passing.
- **Session 16**: Cosmetic UI reorganization. Renamed "Endgame Studies" to **Endgame Examples** and moved the six example definitions out of `main.js` into their own folder (`examples/endgame_examples.js` — loaded between `render.js` and `main.js`, both in `index.html` and the test harness). The examples now live in a **collapsible panel** toggled by an **Endgame Examples** button (reveal/hide like Setup Position). Moved both the **Setup Position** and **Endgame Examples** panels out of the sidebar into the right column, next to the Move Table: two toggle buttons sit above the moves, and the two panels are mutually exclusive (opening one closes the other / exits setup). The test harness's `classList` stub is now functional (backed by `className`) so panel visibility can be asserted; `setBoard` resets `setupMode` and the panels' initial `hidden` state. 3 new tests — 69 tests / 15 suites passing.
- **Session 17**: Cosmetic layout split. The right side is now two columns instead of one: the **Move Table** keeps its own panel (`#notation-panel` — more compact at `max-height: 740px`), and **Setup Position** / **Endgame Examples** moved into their own `#utility-panel` card to the RIGHT of the moves table (the two toggle buttons sit at the top of that card, next to the move/eval column). `#app` max-width widened `1300px → 1500px` to fit the four columns (sidebar · board · moves · utility); on narrow screens the utility card wraps full-width like the moves panel. Action-button text tightened to 12px so "Setup Position" / "Endgame Examples" fit a ~250px column. No behavior change; 69 tests / 15 suites still passing.
- **Session 18**: Made **vs Human** usable in Setup Position and Endgame Examples. The `#vs-human-btn` handler no longer calls `initBoard()` — switching to human mode now only toggles `game.vsAI`, the active button, and side-toggle visibility, keeping whatever position is on the board (a standard game in progress, an in-progress setup, or a loaded endgame example). The AI-mode button still starts a fresh standard game. Also fixed the Setup palette overflowing: piece glyphs were spilling out of the ~22px circular buttons, so `.setup-piece-btn` glyphs are now `14px` (was 16px) and flex-centered. 3 new UI tests — 72 tests / 15 suites passing.
- **Session 19**: Fixed Endgame Example 4 (Double Cannon) — it started with Black already in check (Red's rear Cannon on the king's file checked through the front Cannon, so it wasn't a useful "mate in one"). Rebuilt it as a mate-in-one: Black advisors block both side escapes, Red's first move slides a Cannon onto the king's file so the rear Cannon checks through it. Verified with the engine (start: not check; after `2,5 → 2,4`: checkmate). 72 tests / 15 suites passing.
- **Session 20**: Unified all "start a position" actions into a single **Launch Options** card to the right of the Move Table: **Standard Game**, **Bespoke Setup** (renamed from "Setup Position"), and **Endgame Examples** now sit under one header as three mutually-exclusive, highlightable options (the active option gets a gold border like the mode toggle). Standard Game and the sidebar **New Game**/Play Again close any open launch panel and clear highlights; re-clicking an open option (or Setup's **Cancel**) closes it and clears its highlight; loading a study keeps the Endgame Examples option lit. `#right-actions` CSS replaced by `#launch-options`. 4 new tests — 76 tests / 15 suites passing.
- **Session 21**: Replaced the "vs Computer / vs Human + Switch Sides" controls with **four explicit controller modes**: **Human Red vs Computer Black** (default), **Computer Red vs Human Black**, **Human Red vs Human Black**, and **Computer Red vs Computer Black** (autoplay). `game.vsAI`/`game.humanColor` were replaced by `game.redController`/`game.blackController` (`'human'`/`'ai'`) plus helper `isAIControlled(color)`; `aiMove()` became `aiMove(color)` and **chains** — after an AI ply, if the side to move is also AI-controlled it schedules the next move (AI-vs-AI autoplay). The `switch-sides-btn`/`side-toggle` were removed (mode buttons now pick the human side directly and auto-flip when the human is Black; the Flip Board button is unchanged). **Mode switches never reset the board** — cancelling pending AI moves instead — so toggling modes mid-example/setup/game no longer restores the Standard Game. 2 new tests — 78 tests / 15 suites passing.
- **Session 22**: Fixed a repetition-judging bug that made a **protected** victim count as a chase. `isProtectedVictim` tested "can a defender recapture on the victim's square" while the victim still stood there — and `canLegallyCapture` rejects a same-color target — so it always returned false (dead code) and **every** legal capture threat was treated as a 捉 (chase). Demonstrated by an AI-vs-AI depth-3 standard game: Black's cannon threatened Red's advisor by jumping over Red's own king as the screen; the advisor was defended (recapture available), so it was an exchange threat, not a chase — but the old code ruled "Perpetual Chase — Red Wins". Fixed by simulating the capture (attacker temporarily parked on the victim's square, at `ar,ac`) so a defender's recapture is a normal enemy-piece capture. The offending game now correctly rules an idle threefold repetition **draw**. 1 new regression test — 79 tests / 15 suites passing.
- **Session 23**: Added **Game Review** to the game-over modal (next to Play Again): it closes the modal and leaves the finished position on the board so the game can be gone over via the Move Table (clicking a move link restores that position). And expanded **Setup Position validation** beyond the old "two kings, in palace, not facing": `validateSetupPosition` now also enforces material limits (a side may never exceed its starting count — e.g. max 2 chariots, 5 soldiers), reachability (elephants only on the seven own-side elephant squares and never across the river, advisors only on a palace diagonal, soldiers never behind their starting rank), and that the side not to move is not in check. Validation runs when **Start Game** is pressed and reports **every** problem at once in `#setup-message` (newline-separated; the setup panel notes the timing). 8 new tests — 87 tests / 15 suites passing.
- **Session 24**: Moved the captured-piece trays from a side-by-side row below the board to **Black's tray above the board and Red's tray below it, sandwiching the board**, swapping automatically when the board is flipped (flip button or Computer Red mode) so the board always stays between the two trays. This makes the tray placement a spatial orientation cue — especially useful in Bespoke Setup, where the empty trays now tell you which palace belongs to which side before any pieces are placed. Titles clarified from "Red Captured" to "Red's Captures" / "Black's Captures", and the tray contents are mapped correctly — **Red's tray lists `capturedPieces.black` (the black men red took) and Black's tray lists `capturedPieces.red`** — each captured piece rendered in its own color. 2 new tests — 90 tests / 15 suites passing.

## Known Issues / TODO Ideas
- AI evaluation is material-only, no positional awareness or piece-square tables
- No WXF 60-move rule (a 120-ply stretch with no capture and no soldier advance is not auto-drawn; repetition rules above do apply)
- No check/checkmate sound effects or animations
- Endgame examples only set up position; no "solution" validation

## Development Notes (for future sessions)
- **Standard flow at the start of a session:** run `node --test` to confirm the baseline (currently 90 tests / 15 suites), read the README's **Current State** (top, fastest resume) + Architecture to reload context, and inspect `git status`/`git log --oneline` for where things were left off.
- **Encoding:** all source files are UTF-8. NEVER use PowerShell `Set-Content`/`Out-File` to write or rewrite `.js`/`.html`/`.css`/`.md` files — it can corrupt UTF-8 (encoding warnings). Use the assistant's file tools (Read/Write/Edit) instead.
- **Load order / harness:** the seven source files share global scope; cross-file calls all happen at runtime, so order only matters for load-time code. The test harness concatenates the same order as `index.html` (note the bespoke `examples/endgame_examples.js` slot between `render.js` and `main.js`) — if you change the script tags on the page you must update `test/harness.js`'s file list too.
- **DOM stubs:** harness element stubs (`api.__elements[id]`) only know the IDs listed in `harness.js`. New UI controls must be added to `harness.js` before tests can `.click()` them or read their `textContent`/`style`. Button handlers are recorded via `addEventListener`, and `.click()` fires them.
- **Test style:** one `loadGame()` per test file (isolated sandbox). `setBoard(api, [[r,c,type,color], ...])` sets a custom position. Use `assert.deepEqual` (not `deepStrictEqual`) because VM-realm objects differ.
- **Conventions:** `makeMove(r,c,toR,toC)` in tests; `api.__elements['id']` for DOM assertions; new features get regression tests in the matching themed file (or a new `*.test.js`).
- **Git:** only commit and push (`origin main`) when the user explicitly asks. Update the README Session History with the session's changes before pushing. CRLF/ LF line-ending warnings from git are harmless on Windows.