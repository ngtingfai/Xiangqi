function makeMove(fromRow, fromCol, toRow, toCol) {
    if (game.historyIndex < game.moveHistory.length - 1) {
        game.moveHistory = game.moveHistory.slice(0, game.historyIndex + 1);
        restorePosition(game.historyIndex);
    }

    const now = Date.now();
    const timeMs = Math.max(0, now - (game.moveStartTime || now));

    const piece = game.board[fromRow][fromCol];
    const captured = game.board[toRow][toCol];
    
    if (captured) {
        game.capturedPieces[captured.color].push(captured);
    }
    
    game.board[toRow][toCol] = piece;
    game.board[fromRow][fromCol] = null;
    
    const entry = {
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        piece: piece,
        captured: captured,
        timeMs: timeMs,
        hash: null,
        status: POSITION_CANCEL,
        chased: []
    };
    game.moveHistory.push(entry);
    game.historyIndex = game.moveHistory.length - 1;
    game.moveStartTime = now;
    
    game.currentTurn = game.currentTurn === 'red' ? 'black' : 'red';

    const statusInfo = computeMoveStatus(entry);
    entry.status = statusInfo.status;
    entry.chased = statusInfo.chased;
    entry.hash = positionHash();
}

function undoMove() {
    if (game.moveHistory.length === 0) return;
    
    const lastMove = game.moveHistory.pop();
    game.board[lastMove.from[0]][lastMove.from[1]] = lastMove.piece;
    game.board[lastMove.to[0]][lastMove.to[1]] = lastMove.captured;
    
    if (lastMove.captured) {
        const index = game.capturedPieces[lastMove.captured.color].indexOf(lastMove.captured);
        if (index > -1) {
            game.capturedPieces[lastMove.captured.color].splice(index, 1);
        }
    }
    
    game.currentTurn = game.currentTurn === 'red' ? 'black' : 'red';
    game.selectedPiece = null;
    game.historyIndex = game.moveHistory.length - 1;
    game.moveStartTime = Date.now();
    game.gameOver = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
}

const CHINESE_NUMERALS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function toWXFMove(fr, fc, tr, tc) {
    return `${fc}${fr}${tc}${tr}`;
}

function getChineseFile(fc, color) {
    return color === 'red' ? BOARD_SIZE - fc : fc + 1;
}

function getChineseMovePrefix(fr, fc, tr, tc, color, type) {
    const same = [];
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        if (r === fr) continue;
        if (tc === fc && r === tr) continue;
        const piece = game.board[r][fc];
        if (piece && piece.color === color && piece.type === type) {
            same.push(r);
        }
    }
    if (same.length === 0) return '';
    const rows = same.concat(fr);
    rows.sort((a, b) => color === 'red' ? a - b : b - a);
    const idx = rows.indexOf(fr);
    if (idx === 0) return '前';
    if (idx === rows.length - 1) return '後';
    return '中';
}

function toChineseMove(fr, fc, tr, tc, piece) {
    const { type, color } = piece;
    const symbol = getPieceSymbol(piece);
    const fromFile = getChineseFile(fc, color);
    const destFile = getChineseFile(tc, color);
    const forward = color === 'red' ? tr < fr : tr > fr;

    let action, number;
    if (fr === tr) {
        action = '平';
        number = destFile;
    } else {
        action = forward ? '進' : '退';
        const oblique = ['horse', 'elephant', 'advisor'].includes(type);
        number = oblique ? destFile : Math.abs(tr - fr);
    }

    const prefix = getChineseMovePrefix(fr, fc, tr, tc, color, type);
    const numeral = (n) => CHINESE_NUMERALS[n];
    if (prefix) {
        return `${prefix}${symbol}${action}${numeral(number)}`;
    }
    return `${symbol}${numeral(fromFile)}${action}${numeral(number)}`;
}

function formatMove(move) {
    const [fr, fc] = move.from;
    const [tr, tc] = move.to;
    if (game.notation === 'wxf') {
        return `${getPieceSymbol(move.piece)} ${toWXFMove(fr, fc, tr, tc)}`;
    }
    return toChineseMove(fr, fc, tr, tc, move.piece);
}

function restorePosition(index) {
    if (index < -1) index = -1;
    if (index >= game.moveHistory.length) index = game.moveHistory.length - 1;

    const board = game.initialBoard.map(row => row.slice());
    game.capturedPieces = { red: [], black: [] };

    for (let i = 0; i <= index; i++) {
        const move = game.moveHistory[i];
        if (move.captured) {
            game.capturedPieces[move.captured.color].push(move.captured);
        }
        board[move.to[0]][move.to[1]] = move.piece;
        board[move.from[0]][move.from[1]] = null;
    }

    game.board = board;
    game.currentTurn = (index + 1) % 2 === 0 ? 'red' : 'black';
    game.historyIndex = index;
    game.selectedPiece = null;
    game.gameOver = false;
    game.aiThinking = false;
    game.moveStartTime = Date.now();
    aiMoveSequence++;
    document.getElementById('game-over-overlay').classList.add('hidden');

    drawBoard();
    updateUI();
}

function checkForCheckmate() {
    if (game.gameOver) return;
    
    const currentColor = game.currentTurn;
    const inCheck = isInCheck(currentColor);
    const hasLegalMoves = getAllLegalMoves(currentColor).length > 0;
    
    if (!hasLegalMoves) {
        game.gameOver = true;
        if (inCheck) {
            const winner = currentColor === 'red' ? 'Black' : 'Red';
            showGameOver('Checkmate!', winner + ' Wins!');
        } else {
            const winner = currentColor === 'red' ? 'Black' : 'Red';
            showGameOver('Stalemate!', winner + ' Wins!');
        }
    } else if (inCheck) {
        updateTurnText('Check!');
    }
    
    if (!game.gameOver) {
        judgeRepetition();
    }
}

function positionHash() {
    let s = '';
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = game.board[r][c];
            s += p ? p.color[0] + p.type : '.';
        }
    }
    return s + game.currentTurn[0];
}

function judgePlayer(index, ntimes) {
    const history = game.moveHistory;
    if (index < 0) return VIOLATION_UNDECIDED;
    if (history[index].status === POSITION_CANCEL) return VIOLATION_UNDECIDED;

    const hash = history[index].hash;
    let status = history[index].status;
    let chasedSet = new Set(history[index].chased);
    let i = index - 2;
    let repeating = false;
    let occurrences = 1;

    while (i >= 0) {
        if (history[i + 1].status === POSITION_CANCEL || history[i].status === POSITION_CANCEL) break;

        status |= history[i].status;

        const mid = history[i + 1];
        const fromKey = mid.from[0] + ',' + mid.from[1];
        const toKey = mid.to[0] + ',' + mid.to[1];
        if (chasedSet.has(toKey)) {
            chasedSet.delete(toKey);
            chasedSet.add(fromKey);
        }

        if (status === POSITION_CHASE) {
            const next = new Set();
            for (const key of chasedSet) {
                if (history[i].chased.includes(key)) next.add(key);
            }
            chasedSet = next;
            if (chasedSet.size === 0) status = POSITION_IDLE;
        }

        if (hash === history[i].hash) {
            occurrences += 1;
            if (occurrences >= ntimes) {
                repeating = true;
                break;
            }
        }
        i -= 2;
    }

    if (!repeating) return VIOLATION_UNDECIDED;
    if (status === POSITION_CHECK) return VIOLATION_CHECK;
    if (status === POSITION_CHASE) return VIOLATION_CHASE;
    return VIOLATION_IDLE;
}

function judgeGame() {
    const index = game.moveHistory.length - 1;
    if (index < 1) return null;

    const opponent = judgePlayer(index, REPETITION_TIMES);
    if (opponent === VIOLATION_UNDECIDED) return null;

    const ours = judgePlayer(index - 1, REPETITION_TIMES);
    if (ours === VIOLATION_UNDECIDED) return null;

    if (ours === opponent) return { result: 'draw', ours, opponent };
    if (ours > opponent) return { result: 'loss', ours, opponent };
    return { result: 'win', ours, opponent };
}

function judgeRepetition() {
    const verdict = judgeGame();
    if (!verdict) return false;

    game.gameOver = true;
    const currentColor = game.currentTurn;
    const currentName = currentColor === 'red' ? 'Red' : 'Black';
    const otherName = currentColor === 'red' ? 'Black' : 'Red';
    const levelName = (level) => level === VIOLATION_CHECK ? 'Check' : 'Chase';

    if (verdict.result === 'draw') {
        const label = verdict.ours === VIOLATION_CHECK ? 'Mutual Perpetual Check' :
                      verdict.ours === VIOLATION_CHASE ? 'Mutual Perpetual Chase' : 'Repetition';
        showGameOver('Draw!', label + ' - Draw');
    } else if (verdict.result === 'win') {
        showGameOver('Perpetual ' + levelName(verdict.opponent) + '!', currentName + ' Wins!');
    } else {
        showGameOver('Perpetual ' + levelName(verdict.ours) + '!', otherName + ' Wins!');
    }
    return true;
}