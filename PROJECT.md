# Xiangqi (Chinese Chess) Project

## Overview
A browser-based Xiangqi (Chinese Chess) game built with vanilla HTML/CSS/JavaScript (no frameworks). Rendered on an HTML5 Canvas.

**GitHub:** https://github.com/ngtingfai/Xiangqi  
**Local path:** `C:\Users\user\Desktop\TF\VScode\Xiangqi`

## Files
| File | Purpose |
|------|---------|
| `index.html` | Main HTML page with sidebar UI, canvas, game-over modal |
| `style.css` | Dark-themed UI styling (330 lines) |
| `game.js` | All game logic, AI, rendering (~971 lines) |

## Architecture (game.js)

### Constants & Config
- Board: 9 columns x 10 rows (`BOARD_SIZE=9`, `BOARD_HEIGHT=10`)
- Canvas: `CELL_SIZE=65`, `MARGIN=40`
- Piece types: `king`, `advisor`, `elephant`, `horse`, `chariot`, `cannon`, `soldier`
- Chinese symbols: `RED_PIECES` and `BLACK_PIECES` objects map type to character
- `PIECE_VALUES` for AI evaluation

### Game State (`game` object)
- `board[][]` — 2D array, each cell is `{type, color}` or `null`
- `currentTurn` — `'red'` or `'black'` (Red always goes first)
- `selectedPiece` — `[row, col]` or `null`
- `moveHistory[]` — array of `{from, to, piece, captured}`
- `capturedPieces` — `{red: [], black: []}`
- `vsAI` — boolean, default `true`
- `aiDepth` — 1/2/3, default `2`
- `gameOver` — boolean

### Key Functions
| Function | Line | Purpose |
|----------|------|---------|
| `initBoard()` | 65 | Sets up standard starting position |
| `checkForCheckmate()` | 128 | Detects checkmate AND stalemate (both = loss for stalemated player, per Xiangqi rules) |
| `getAllLegalMoves(color)` | 154 | All moves that don't leave king in check and don't violate kings-facing rule |
| `getValidMoves(row, col)` | 219 | Raw pseudo-legal moves for a piece (ignores check) |
| `isKingsFacing()` | 395 | Flying general rule — kings on same column with no pieces between = illegal |
| `isInCheck(color)` | 426 | Whether `color`'s king is under attack |
| `makeMove()` | 458 | Executes a move, switches turn |
| `undoMove()` | 479 | Reverses last move |
| `evaluateBoard()` | 497 | Material evaluation for AI (soldiers worth more after crossing river) |
| `minimax()` | 525 | Alpha-beta pruning AI search (uses `getAllLegalMoves`) |
| `aiMove()` | 578 | AI entry point — evaluates all legal moves, picks best via minimax |
| `drawBoard()` | 625 | Renders board, pieces, selection highlight, valid move indicators |
| `drawPiece()` | 727 | Renders a single piece with circle, border, Chinese character |

### Move Validation per Piece Type (lines 219-393)
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
- Uses `getAllLegalMoves` for correct stalemate/checkmate detection
- Terminal states: no legal moves = -100000 or +100000
- Evaluation: material count only (no positional tables)

### Endgame Studies (6 puzzles, line 900)
1. **Basic Checkmate** — Chariot + King vs King (flying general trap)
2. **Chariot & Horse Mate** — Coordination pattern
3. **Cannon Mate** — Cannon with platform piece
4. **Double Cannon** — Two cannons mating net
5. **Horse & Cannon** — Classic attacking pair
6. **Chariot Mate** — Chariot with advisor block

### UI Features
- vs Computer / vs Human mode toggle
- Undo move (undoes 2 moves in AI mode to undo both AI+human)
- Flip board
- Move history display
- Captured pieces display
- Game-over modal overlay
- Click-to-select, click-to-move piece interaction
- Valid move indicators (yellow circles)

## Known Issues / TODO Ideas
- AI evaluation is material-only, no positional awareness
- No draw rule (repetition/50-move) — games could theoretically go forever
- No check/checkmate sound effects or animations
- Board flipping is implemented but piece drawing doesn't account for flipped coordinates (visual bug if flipped)
- Cannon capture rule validated correctly (needs exactly one platform piece between)
