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
    
    game.moveHistory.push({
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        piece: piece,
        captured: captured,
        timeMs: timeMs
    });
    game.historyIndex = game.moveHistory.length - 1;
    game.moveStartTime = now;
    
    game.currentTurn = game.currentTurn === 'red' ? 'black' : 'red';
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
}