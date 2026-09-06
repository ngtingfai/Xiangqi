const PIECE_VALUES = {
    king: 10000,
    advisor: 20,
    elephant: 20,
    horse: 40,
    chariot: 90,
    cannon: 45,
    soldier: 10
};

const EVAL_RANGE = 100;

function pieceValue(piece, row) {
    let value = PIECE_VALUES[piece.type];
    if (piece.type === 'soldier' && isAcrossRiver(row, piece.color)) {
        value = 20;
    }
    return piece.color === 'red' ? value : -value;
}

function evalDelta(piece, captured, fr, fc, tr, tc) {
    let d = pieceValue(piece, tr) - pieceValue(piece, fr);
    if (captured) d -= pieceValue(captured, tr);
    return d;
}

function evaluateBoard() {
    let score = 0;
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = game.board[r][c];
            if (piece) {
                score += pieceValue(piece, r);
            }
        }
    }
    
    return score;
}

function moveScore(fr, fc, tr, tc) {
    const captured = game.board[tr][tc];
    if (!captured) return 0;
    const attacker = game.board[fr][fc];
    return 10 * PIECE_VALUES[captured.type] - (attacker ? PIECE_VALUES[attacker.type] : 0);
}

function orderMoves(moves) {
    moves.sort((a, b) => moveScore(b[0], b[1], b[2], b[3]) - moveScore(a[0], a[1], a[2], a[3]));
    return moves;
}

// ---- Zobrist hashing (64-bit keys as two 32-bit words; used by the transposition table) ----
const PIECE_INDEX = {
    king: 0,
    advisor: 1,
    elephant: 2,
    horse: 3,
    chariot: 4,
    cannon: 5,
    soldier: 6
};
const SIDE_SLOT = BOARD_HEIGHT * BOARD_SIZE * 14;
const SLOT_COUNT = SIDE_SLOT + 2;
const ZOB_HI = new Int32Array(SLOT_COUNT);
const ZOB_LO = new Int32Array(SLOT_COUNT);
for (let i = 0; i < SLOT_COUNT; i++) {
    ZOB_HI[i] = (Math.random() * 4294967296) | 0;
    ZOB_LO[i] = (Math.random() * 4294967296) | 0;
}
const ZOB_SIDE_FLIP_HI = ZOB_HI[SIDE_SLOT] ^ ZOB_HI[SIDE_SLOT + 1];
const ZOB_SIDE_FLIP_LO = ZOB_LO[SIDE_SLOT] ^ ZOB_LO[SIDE_SLOT + 1];

let hashHi = 0;
let hashLo = 0;

function squareIndex(row, col) {
    return row * BOARD_SIZE + col;
}

function moveIndex(fr, fc, tr, tc) {
    return squareIndex(fr, fc) * 90 + squareIndex(tr, tc);
}

function zobIndex(row, col, piece) {
    return (row * BOARD_SIZE + col) * 14 + (piece.color === 'red' ? 0 : 7) + PIECE_INDEX[piece.type];
}

function zobristKey(colorToMove) {
    let hi = 0, lo = 0;
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = game.board[r][c];
            if (piece) {
                const i = zobIndex(r, c, piece);
                hi ^= ZOB_HI[i];
                lo ^= ZOB_LO[i];
            }
        }
    }
    const s = colorToMove === 'red' ? SIDE_SLOT : SIDE_SLOT + 1;
    hi ^= ZOB_HI[s];
    lo ^= ZOB_LO[s];
    return [hi, lo];
}

// Writes the key delta (for a move applied to the current position) into hashHi/hashLo.
function zobristDelta(piece, captured, fr, fc, tr, tc) {
    const iF = zobIndex(fr, fc, piece);
    const iT = zobIndex(tr, tc, piece);
    hashHi = ZOB_HI[iF] ^ ZOB_HI[iT];
    hashLo = ZOB_LO[iF] ^ ZOB_LO[iT];
    if (captured) {
        const iC = zobIndex(tr, tc, captured);
        hashHi ^= ZOB_HI[iC];
        hashLo ^= ZOB_LO[iC];
    }
    hashHi ^= ZOB_SIDE_FLIP_HI;
    hashLo ^= ZOB_SIDE_FLIP_LO;
}

// ---- Transposition table (entries used only at equal search depth => exact results) ----
const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;
const TT_SIZE = 1 << 16;
const ttKeyHi = new Int32Array(TT_SIZE);
const ttKeyLo = new Int32Array(TT_SIZE);
const ttValue = new Int32Array(TT_SIZE);
const ttDepth = new Int8Array(TT_SIZE);
const ttFlag = new Uint8Array(TT_SIZE);
const ttMove = new Int32Array(TT_SIZE);
ttMove.fill(-1);

function ttIndex(keyHi) {
    return (keyHi >>> 16) & (TT_SIZE - 1);
}

function ttGetMove(keyHi, keyLo) {
    const i = ttIndex(keyHi);
    if (ttKeyHi[i] === keyHi && ttKeyLo[i] === keyLo) return ttMove[i];
    return -1;
}

function ttProbe(keyHi, keyLo, depth, alpha, beta) {
    const i = ttIndex(keyHi);
    if (ttKeyHi[i] !== keyHi || ttKeyLo[i] !== keyLo || ttDepth[i] !== depth) return null;
    const v = ttValue[i];
    if (ttFlag[i] === TT_EXACT) return v;
    if (ttFlag[i] === TT_LOWER && v >= beta) return v;
    if (ttFlag[i] === TT_UPPER && v <= alpha) return v;
    return null;
}

function ttStore(keyHi, keyLo, depth, flag, value, move) {
    const i = ttIndex(keyHi);
    ttKeyHi[i] = keyHi;
    ttKeyLo[i] = keyLo;
    ttDepth[i] = depth;
    ttFlag[i] = flag;
    ttValue[i] = value;
    ttMove[i] = move;
}

function orderMovesPlies(moves, prevBest) {
    const board = game.board;
    const scoreMove = (m) => {
        const fr = m[0], fc = m[1], tr = m[2], tc = m[3];
        const captured = board[tr][tc];
        if (captured) return 100000000 + (10 * PIECE_VALUES[captured.type] - PIECE_VALUES[board[fr][fc].type]);
        if (moveIndex(fr, fc, tr, tc) === prevBest) return 1000000;
        return 0;
    };
    moves.sort((a, b) => scoreMove(b) - scoreMove(a));
    return moves;
}

function minimax(depth, alpha, beta, isMaximizing, evalScore, keyHi, keyLo) {
    if (depth === 0) return evalScore;

    const color = isMaximizing ? 'red' : 'black';
    if (evalScore === undefined) evalScore = evaluateBoard();
    if (keyHi === undefined) {
        const key = zobristKey(color);
        keyHi = key[0];
        keyLo = key[1];
    }
    const origAlpha = alpha;
    const origBeta = beta;

    const ttHit = ttProbe(keyHi, keyLo, depth, alpha, beta);
    if (ttHit !== null) return ttHit;

    const moves = orderMovesPlies(getAllLegalMoves(color), ttGetMove(keyHi, keyLo));

    if (moves.length === 0) {
        const value = isMaximizing ? -100000 : 100000;
        ttStore(keyHi, keyLo, depth, TT_EXACT, value, -1);
        return value;
    }

    let bestMoveId = -1;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            const m = moves[i];
            const fr = m[0], fc = m[1], tr = m[2], tc = m[3];
            const piece = game.board[fr][fc];
            const captured = game.board[tr][tc];
            zobristDelta(piece, captured, fr, fc, tr, tc);
            const childHi = keyHi ^ hashHi;
            const childLo = keyLo ^ hashLo;
            const childEval = evalScore + evalDelta(piece, captured, fr, fc, tr, tc);
            game.board[tr][tc] = piece;
            game.board[fr][fc] = null;

            let value;
            if (i === 0) {
                value = minimax(depth - 1, alpha, beta, false, childEval, childHi, childLo);
            } else {
                value = minimax(depth - 1, alpha, alpha + 1, false, childEval, childHi, childLo);
                if (value > alpha && value < beta) {
                    value = minimax(depth - 1, alpha, beta, false, childEval, childHi, childLo);
                }
            }

            game.board[fr][fc] = piece;
            game.board[tr][tc] = captured;

            if (value > maxEval) {
                maxEval = value;
                bestMoveId = moveIndex(fr, fc, tr, tc);
            }
            if (value > alpha) alpha = value;
            if (beta <= alpha) {
                ttStore(keyHi, keyLo, depth, TT_LOWER, maxEval, bestMoveId);
                return maxEval;
            }
        }
        ttStore(keyHi, keyLo, depth, maxEval <= origAlpha ? TT_UPPER : TT_EXACT, maxEval, bestMoveId);
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let i = 0; i < moves.length; i++) {
            const m = moves[i];
            const fr = m[0], fc = m[1], tr = m[2], tc = m[3];
            const piece = game.board[fr][fc];
            const captured = game.board[tr][tc];
            zobristDelta(piece, captured, fr, fc, tr, tc);
            const childHi = keyHi ^ hashHi;
            const childLo = keyLo ^ hashLo;
            const childEval = evalScore + evalDelta(piece, captured, fr, fc, tr, tc);
            game.board[tr][tc] = piece;
            game.board[fr][fc] = null;

            let value;
            if (i === 0) {
                value = minimax(depth - 1, alpha, beta, true, childEval, childHi, childLo);
            } else {
                value = minimax(depth - 1, beta - 1, beta, true, childEval, childHi, childLo);
                if (value < beta) {
                    value = minimax(depth - 1, alpha, beta, true, childEval, childHi, childLo);
                }
            }

            game.board[fr][fc] = piece;
            game.board[tr][tc] = captured;

            if (value < minEval) {
                minEval = value;
                bestMoveId = moveIndex(fr, fc, tr, tc);
            }
            if (value < beta) beta = value;
            if (beta <= alpha) {
                ttStore(keyHi, keyLo, depth, TT_UPPER, minEval, bestMoveId);
                return minEval;
            }
        }
        ttStore(keyHi, keyLo, depth, minEval >= origBeta ? TT_LOWER : TT_EXACT, minEval, bestMoveId);
        return minEval;
    }
}

function searchRoot(rootMoves, depth, aiColor, aiIsMaximizing, rootEval, rootKeyHi, rootKeyLo) {
    let bestMove = null;
    let bestScore = aiIsMaximizing ? -Infinity : Infinity;
    for (const m of rootMoves) {
        const fr = m[0], fc = m[1], tr = m[2], tc = m[3];
        const piece = game.board[fr][fc];
        const captured = game.board[tr][tc];
        zobristDelta(piece, captured, fr, fc, tr, tc);
        const childHi = rootKeyHi ^ hashHi;
        const childLo = rootKeyLo ^ hashLo;
        const childEval = rootEval + evalDelta(piece, captured, fr, fc, tr, tc);
        game.board[tr][tc] = piece;
        game.board[fr][fc] = null;
        const score = minimax(depth, -Infinity, Infinity, !aiIsMaximizing, childEval, childHi, childLo);
        game.board[fr][fc] = piece;
        game.board[tr][tc] = captured;
        if (aiIsMaximizing ? score > bestScore : score < bestScore) {
            bestScore = score;
            bestMove = m;
        }
    }
    return { move: bestMove, score: bestScore };
}

function aiMove() {
    if (game.aiThinking || game.gameOver) return;
    
    const aiColor = game.humanColor === 'red' ? 'black' : 'red';
    const aiIsMaximizing = aiColor === 'red';
    
    game.aiThinking = true;
    game.moveStartTime = Date.now();
    
    const token = ++aiMoveSequence;
    setTimeout(() => {
        if (token !== aiMoveSequence) return;
        const moves = orderMoves(getAllLegalMoves(aiColor));
        if (moves.length === 0) {
            game.gameOver = true;
            const winner = aiColor === 'red' ? 'Black' : 'Red';
            showGameOver('Victory!', winner + ' Wins - No moves left!');
            game.aiThinking = false;
            return;
        }
        
        const target = Math.max(0, game.aiDepth - 1);
        const rootEval = evaluateBoard();
        const rootKey = zobristKey(aiColor);
        const best = searchRoot(moves, target, aiColor, aiIsMaximizing, rootEval, rootKey[0], rootKey[1]);
        
        if (best && best.move) {
            const [fr, fc, tr, tc] = best.move;
            makeMove(fr, fc, tr, tc);
        }
        
        game.aiThinking = false;
        drawBoard();
        updateUI();
        checkForCheckmate();
    }, 100);
}