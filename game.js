const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const BOARD_SIZE = 9;
const BOARD_HEIGHT = 10;
const CELL_SIZE = 65;
const MARGIN = 40;

canvas.width = (BOARD_SIZE - 1) * CELL_SIZE + MARGIN * 2;
canvas.height = (BOARD_HEIGHT - 1) * CELL_SIZE + MARGIN * 2;

const PIECES = {
    KING: 'king',
    ADVISOR: 'advisor',
    ELEPHANT: 'elephant',
    HORSE: 'horse',
    CHARIOT: 'chariot',
    CANNON: 'cannon',
    SOLDIER: 'soldier'
};

const RED_PIECES = {
    KING: '帥',
    ADVISOR: '仕',
    ELEPHANT: '相',
    HORSE: '傌',
    CHARIOT: '俥',
    CANNON: '炮',
    SOLDIER: '兵'
};

const BLACK_PIECES = {
    KING: '將',
    ADVISOR: '士',
    ELEPHANT: '象',
    HORSE: '馬',
    CHARIOT: '車',
    CANNON: '砲',
    SOLDIER: '卒'
};

const PIECE_VALUES = {
    king: 10000,
    advisor: 20,
    elephant: 20,
    horse: 40,
    chariot: 90,
    cannon: 45,
    soldier: 10
};

const game = {
    board: [],
    currentTurn: 'red',
    selectedPiece: null,
    moveHistory: [],
    capturedPieces: { red: [], black: [] },
    isFlipped: false,
    vsAI: true,
    aiDepth: 2,
    aiThinking: false,
    gameOver: false
};

function initBoard() {
    game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    const blackSetup = [
        { type: 'chariot', row: 0, col: 0 },
        { type: 'horse', row: 0, col: 1 },
        { type: 'elephant', row: 0, col: 2 },
        { type: 'advisor', row: 0, col: 3 },
        { type: 'king', row: 0, col: 4 },
        { type: 'advisor', row: 0, col: 5 },
        { type: 'elephant', row: 0, col: 6 },
        { type: 'horse', row: 0, col: 7 },
        { type: 'chariot', row: 0, col: 8 },
        { type: 'cannon', row: 2, col: 1 },
        { type: 'cannon', row: 2, col: 7 },
        { type: 'soldier', row: 3, col: 0 },
        { type: 'soldier', row: 3, col: 2 },
        { type: 'soldier', row: 3, col: 4 },
        { type: 'soldier', row: 3, col: 6 },
        { type: 'soldier', row: 3, col: 8 }
    ];
    
    const redSetup = [
        { type: 'chariot', row: 9, col: 0 },
        { type: 'horse', row: 9, col: 1 },
        { type: 'elephant', row: 9, col: 2 },
        { type: 'advisor', row: 9, col: 3 },
        { type: 'king', row: 9, col: 4 },
        { type: 'advisor', row: 9, col: 5 },
        { type: 'elephant', row: 9, col: 6 },
        { type: 'horse', row: 9, col: 7 },
        { type: 'chariot', row: 9, col: 8 },
        { type: 'cannon', row: 7, col: 1 },
        { type: 'cannon', row: 7, col: 7 },
        { type: 'soldier', row: 6, col: 0 },
        { type: 'soldier', row: 6, col: 2 },
        { type: 'soldier', row: 6, col: 4 },
        { type: 'soldier', row: 6, col: 6 },
        { type: 'soldier', row: 6, col: 8 }
    ];
    
    blackSetup.forEach(p => {
        game.board[p.row][p.col] = { type: p.type, color: 'black' };
    });
    
    redSetup.forEach(p => {
        game.board[p.row][p.col] = { type: p.type, color: 'red' };
    });
    
    game.currentTurn = 'red';
    game.selectedPiece = null;
    game.moveHistory = [];
    game.capturedPieces = { red: [], black: [] };
    game.gameOver = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
}

function showGameOver(title, message) {
    document.getElementById('game-over-title').textContent = title;
    document.getElementById('game-over-message').textContent = message;
    document.getElementById('game-over-overlay').classList.remove('hidden');
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

function updateTurnText(extra) {
    const turnText = game.currentTurn === 'red' ? "Red's Turn" : "Black's Turn";
    document.getElementById('turn-text').textContent = extra ? turnText + ' - ' + extra : turnText;
}

function getAllLegalMoves(color) {
    const moves = [];
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (game.board[r][c] && game.board[r][c].color === color) {
                const pieceMoves = getValidMoves(r, c);
                pieceMoves.forEach(([tr, tc]) => {
                    const piece = game.board[r][c];
                    const captured = game.board[tr][tc];
                    
                    game.board[tr][tc] = piece;
                    game.board[r][c] = null;
                    
                    if (!isInCheck(color) && !isKingsFacing()) {
                        moves.push([r, c, tr, tc]);
                    }
                    
                    game.board[r][c] = piece;
                    game.board[tr][tc] = captured;
                });
            }
        }
    }
    
    return moves;
}

function getPieceSymbol(piece) {
    if (!piece) return '';
    return piece.color === 'red' ? RED_PIECES[piece.type.toUpperCase()] : BLACK_PIECES[piece.type.toUpperCase()];
}

function isValidPos(row, col) {
    return row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_SIZE;
}

function isInPalace(row, col, color) {
    const minRow = color === 'red' ? 7 : 0;
    const maxRow = color === 'red' ? 9 : 2;
    return row >= minRow && row <= maxRow && col >= 3 && col <= 5;
}

function isAcrossRiver(row, color) {
    return color === 'red' ? row <= 4 : row >= 5;
}

function countPiecesBetween(fromRow, fromCol, toRow, toCol) {
    let count = 0;
    if (fromRow === toRow) {
        const minCol = Math.min(fromCol, toCol);
        const maxCol = Math.max(fromCol, toCol);
        for (let c = minCol + 1; c < maxCol; c++) {
            if (game.board[fromRow][c]) count++;
        }
    } else if (fromCol === toCol) {
        const minRow = Math.min(fromRow, toRow);
        const maxRow = Math.max(fromRow, toRow);
        for (let r = minRow + 1; r < maxRow; r++) {
            if (game.board[r][fromCol]) count++;
        }
    }
    return count;
}

function getValidMoves(row, col) {
    const piece = game.board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const { type, color } = piece;
    
    switch (type) {
        case 'king':
            const kingMoves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            kingMoves.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (isInPalace(newRow, newCol, color)) {
                    const target = game.board[newRow][newCol];
                    if (!target || target.color !== color) {
                        moves.push([newRow, newCol]);
                    }
                }
            });
            break;
            
        case 'advisor':
            const advMoves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            advMoves.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (isInPalace(newRow, newCol, color)) {
                    const target = game.board[newRow][newCol];
                    if (!target || target.color !== color) {
                        moves.push([newRow, newCol]);
                    }
                }
            });
            break;
            
        case 'elephant':
            const eleMoves = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
            eleMoves.forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                const blockRow = row + dr / 2;
                const blockCol = col + dc / 2;
                if (isValidPos(newRow, newCol)) {
                    if (color === 'red' && newRow < 5) return;
                    if (color === 'black' && newRow > 4) return;
                    if (!game.board[blockRow][blockCol]) {
                        const target = game.board[newRow][newCol];
                        if (!target || target.color !== color) {
                            moves.push([newRow, newCol]);
                        }
                    }
                }
            });
            break;
            
        case 'horse':
            const horseMoves = [
                [-2, -1, -1, 0], [-2, 1, -1, 0],
                [2, -1, 1, 0], [2, 1, 1, 0],
                [-1, -2, 0, -1], [-1, 2, 0, 1],
                [1, -2, 0, -1], [1, 2, 0, 1]
            ];
            horseMoves.forEach(([dr, dc, br, bc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                const blockRow = row + br;
                const blockCol = col + bc;
                if (isValidPos(newRow, newCol) && !game.board[blockRow][blockCol]) {
                    const target = game.board[newRow][newCol];
                    if (!target || target.color !== color) {
                        moves.push([newRow, newCol]);
                    }
                }
            });
            break;
            
        case 'chariot':
            const chariotDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            chariotDirs.forEach(([dr, dc]) => {
                let newRow = row + dr;
                let newCol = col + dc;
                while (isValidPos(newRow, newCol)) {
                    const target = game.board[newRow][newCol];
                    if (!target) {
                        moves.push([newRow, newCol]);
                    } else {
                        if (target.color !== color) {
                            moves.push([newRow, newCol]);
                        }
                        break;
                    }
                    newRow += dr;
                    newCol += dc;
                }
            });
            break;
            
        case 'cannon':
            const cannonDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            cannonDirs.forEach(([dr, dc]) => {
                let newRow = row + dr;
                let newCol = col + dc;
                let foundPlatform = false;
                while (isValidPos(newRow, newCol)) {
                    const target = game.board[newRow][newCol];
                    if (!foundPlatform) {
                        if (!target) {
                            moves.push([newRow, newCol]);
                        } else {
                            foundPlatform = true;
                        }
                    } else {
                        if (target) {
                            if (target.color !== color) {
                                moves.push([newRow, newCol]);
                            }
                            break;
                        }
                    }
                    newRow += dr;
                    newCol += dc;
                }
            });
            break;
            
        case 'soldier':
            if (color === 'red') {
                if (row > 0) {
                    const target = game.board[row - 1][col];
                    if (!target || target.color !== color) {
                        moves.push([row - 1, col]);
                    }
                }
                if (isAcrossRiver(row, color)) {
                    if (col > 0) {
                        const target = game.board[row][col - 1];
                        if (!target || target.color !== color) {
                            moves.push([row, col - 1]);
                        }
                    }
                    if (col < 8) {
                        const target = game.board[row][col + 1];
                        if (!target || target.color !== color) {
                            moves.push([row, col + 1]);
                        }
                    }
                }
            } else {
                if (row < 9) {
                    const target = game.board[row + 1][col];
                    if (!target || target.color !== color) {
                        moves.push([row + 1, col]);
                    }
                }
                if (isAcrossRiver(row, color)) {
                    if (col > 0) {
                        const target = game.board[row][col - 1];
                        if (!target || target.color !== color) {
                            moves.push([row, col - 1]);
                        }
                    }
                    if (col < 8) {
                        const target = game.board[row][col + 1];
                        if (!target || target.color !== color) {
                            moves.push([row, col + 1]);
                        }
                    }
                }
            }
            break;
    }
    
    return moves;
}

function isKingsFacing() {
    let redKingRow, redKingCol, blackKingRow, blackKingCol;
    
    for (let r = 7; r <= 9; r++) {
        for (let c = 3; c <= 5; c++) {
            if (game.board[r][c] && game.board[r][c].type === 'king' && game.board[r][c].color === 'red') {
                redKingRow = r;
                redKingCol = c;
            }
        }
    }
    
    for (let r = 0; r <= 2; r++) {
        for (let c = 3; c <= 5; c++) {
            if (game.board[r][c] && game.board[r][c].type === 'king' && game.board[r][c].color === 'black') {
                blackKingRow = r;
                blackKingCol = c;
            }
        }
    }
    
    if (redKingRow === undefined || blackKingRow === undefined) return false;
    if (redKingCol !== blackKingCol) return false;
    
    for (let r = blackKingRow + 1; r < redKingRow; r++) {
        if (game.board[r][redKingCol]) return false;
    }
    
    return true;
}

function isInCheck(color) {
    let kingRow, kingCol;
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (game.board[r][c] && game.board[r][c].type === 'king' && game.board[r][c].color === color) {
                kingRow = r;
                kingCol = c;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }
    
    if (kingRow === undefined) return true;
    
    const opponent = color === 'red' ? 'black' : 'red';
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (game.board[r][c] && game.board[r][c].color === opponent) {
                const moves = getValidMoves(r, c);
                if (moves.some(([mr, mc]) => mr === kingRow && mc === kingCol)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function makeMove(fromRow, fromCol, toRow, toCol) {
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
        captured: captured
    });
    
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
}

function evaluateBoard() {
    let score = 0;
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = game.board[r][c];
            if (piece) {
                let value = PIECE_VALUES[piece.type];
                
                if (piece.type === 'soldier') {
                    if (isAcrossRiver(r, piece.color)) {
                        value = 20;
                    }
                }
                
                if (piece.color === 'red') {
                    score += value;
                } else {
                    score -= value;
                }
            }
        }
    }
    
    return score;
}

function getAllMoves(color) {
    const moves = [];
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (game.board[r][c] && game.board[r][c].color === color) {
                const pieceMoves = getValidMoves(r, c);
                pieceMoves.forEach(([tr, tc]) => {
                    const piece = game.board[r][c];
                    const captured = game.board[tr][tc];
                    
                    game.board[tr][tc] = piece;
                    game.board[r][c] = null;
                    
                    if (!isKingsFacing()) {
                        moves.push([r, c, tr, tc]);
                    }
                    
                    game.board[r][c] = piece;
                    game.board[tr][tc] = captured;
                });
            }
        }
    }
    
    return moves;
}

function minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        return evaluateBoard();
    }
    
    const color = isMaximizing ? 'red' : 'black';
    const moves = getAllLegalMoves(color);
    
    if (moves.length === 0) {
        return isMaximizing ? -100000 : 100000;
    }
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const [fr, fc, tr, tc] of moves) {
            const piece = game.board[fr][fc];
            const captured = game.board[tr][tc];
            
            game.board[tr][tc] = piece;
            game.board[fr][fc] = null;
            
            const eval_ = minimax(depth - 1, alpha, beta, false);
            
            game.board[fr][fc] = piece;
            game.board[tr][tc] = captured;
            
            maxEval = Math.max(maxEval, eval_);
            alpha = Math.max(alpha, eval_);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const [fr, fc, tr, tc] of moves) {
            const piece = game.board[fr][fc];
            const captured = game.board[tr][tc];
            
            game.board[tr][tc] = piece;
            game.board[fr][fc] = null;
            
            const eval_ = minimax(depth - 1, alpha, beta, true);
            
            game.board[fr][fc] = piece;
            game.board[tr][tc] = captured;
            
            minEval = Math.min(minEval, eval_);
            beta = Math.min(beta, eval_);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function aiMove() {
    if (game.aiThinking || game.gameOver) return;
    
    game.aiThinking = true;
    
    setTimeout(() => {
        const moves = getAllLegalMoves('black');
        if (moves.length === 0) {
            game.gameOver = true;
            showGameOver('Victory!', 'Red Wins - No moves left!');
            game.aiThinking = false;
            return;
        }
        
        let bestMove = null;
        let bestScore = Infinity;
        
        for (const [fr, fc, tr, tc] of moves) {
            const piece = game.board[fr][fc];
            const captured = game.board[tr][tc];
            
            game.board[tr][tc] = piece;
            game.board[fr][fc] = null;
            
            const score = minimax(game.aiDepth - 1, -Infinity, Infinity, true);
            
            game.board[fr][fc] = piece;
            game.board[tr][tc] = captured;
            
            if (score < bestScore) {
                bestScore = score;
                bestMove = [fr, fc, tr, tc];
            }
        }
        
        if (bestMove) {
            const [fr, fc, tr, tc] = bestMove;
            makeMove(fr, fc, tr, tc);
        }
        
        game.aiThinking = false;
        drawBoard();
        updateUI();
        checkForCheckmate();
    }, 100);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        const x = MARGIN + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, MARGIN);
        ctx.lineTo(x, MARGIN + (BOARD_HEIGHT - 1) * CELL_SIZE);
        ctx.stroke();
    }
    
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        const y = MARGIN + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(MARGIN, y);
        ctx.lineTo(MARGIN + (BOARD_SIZE - 1) * CELL_SIZE, y);
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 4 * CELL_SIZE, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 4 * CELL_SIZE, MARGIN + 5 * CELL_SIZE);
    ctx.lineTo(MARGIN, MARGIN + 5 * CELL_SIZE);
    ctx.moveTo(MARGIN + 5 * CELL_SIZE, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 8 * CELL_SIZE, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 8 * CELL_SIZE, MARGIN + 5 * CELL_SIZE);
    ctx.lineTo(MARGIN + 5 * CELL_SIZE, MARGIN + 5 * CELL_SIZE);
    ctx.stroke();
    
    const palaceTop = [[0, 3], [0, 5], [2, 3], [2, 5]];
    const palaceBottom = [[7, 3], [7, 5], [9, 3], [9, 5]];
    
    ctx.lineWidth = 1;
    palaceTop.forEach(([r, c]) => {
        const x = MARGIN + c * CELL_SIZE;
        const y = MARGIN + r * CELL_SIZE;
        const centerX = MARGIN + 4 * CELL_SIZE;
        const centerY = MARGIN + 1 * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + (centerX - x), centerY + (centerY - y));
        ctx.stroke();
    });
    
    palaceBottom.forEach(([r, c]) => {
        const x = MARGIN + c * CELL_SIZE;
        const y = MARGIN + r * CELL_SIZE;
        const centerX = MARGIN + 4 * CELL_SIZE;
        const centerY = MARGIN + 8 * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + (centerX - x), centerY + (centerY - y));
        ctx.stroke();
    });
    
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';
    ctx.fillText('楚 河', MARGIN + 2 * CELL_SIZE, MARGIN + 4.5 * CELL_SIZE);
    ctx.fillText('漢 界', MARGIN + 6 * CELL_SIZE, MARGIN + 4.5 * CELL_SIZE);
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = game.board[r][c];
            if (piece) {
                drawPiece(r, c, piece);
            }
        }
    }
    
    if (game.selectedPiece) {
        const [sr, sc] = game.selectedPiece;
        const x = MARGIN + sc * CELL_SIZE;
        const y = MARGIN + sr * CELL_SIZE;
        
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.stroke();
        
        const moves = getValidMoves(sr, sc);
        moves.forEach(([mr, mc]) => {
            const mx = MARGIN + mc * CELL_SIZE;
            const my = MARGIN + mr * CELL_SIZE;
            
            ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
            ctx.beginPath();
            ctx.arc(mx, my, 25, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function drawPiece(row, col, piece) {
    const x = MARGIN + col * CELL_SIZE;
    const y = MARGIN + row * CELL_SIZE;
    const radius = 26;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f5deb3';
    ctx.fill();
    ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
    ctx.fillText(getPieceSymbol(piece), x, y + 2);
}

function getBoardCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round((x - MARGIN) / CELL_SIZE);
    const row = Math.round((y - MARGIN) / CELL_SIZE);
    
    if (isValidPos(row, col)) {
        return [row, col];
    }
    return null;
}

canvas.addEventListener('click', (e) => {
    if (game.gameOver || game.aiThinking) return;
    if (game.vsAI && game.currentTurn === 'black') return;
    
    const coords = getBoardCoords(e);
    if (!coords) return;
    
    const [row, col] = coords;
    const piece = game.board[row][col];
    
    if (game.selectedPiece) {
        const [sr, sc] = game.selectedPiece;
        const legalMoves = getAllLegalMoves(game.currentTurn).filter(([fr, fc]) => fr === sr && fc === sc);
        
        if (legalMoves.some(([, , mr, mc]) => mr === row && mc === col)) {
            makeMove(sr, sc, row, col);
            game.selectedPiece = null;
            
            drawBoard();
            updateUI();
            checkForCheckmate();
            
            if (game.vsAI && !game.gameOver && game.currentTurn === 'black') {
                aiMove();
            }
            return;
        }
    }
    
    if (piece && piece.color === game.currentTurn) {
        game.selectedPiece = [row, col];
        drawBoard();
    } else {
        game.selectedPiece = null;
        drawBoard();
    }
});

function updateUI() {
    const inCheck = isInCheck(game.currentTurn);
    updateTurnText(inCheck ? 'Check!' : null);
    document.getElementById('turn-piece').textContent = game.currentTurn === 'red' ? '帥' : '將';
    document.getElementById('turn-piece').className = 'piece-indicator ' + game.currentTurn;
    
    const historyDiv = document.getElementById('move-history');
    historyDiv.innerHTML = game.moveHistory.map((move, i) => {
        const pieceSymbol = getPieceSymbol(move.piece);
        const from = `(${move.from[1]},${move.from[0]})`;
        const to = `(${move.to[1]},${move.to[0]})`;
        return `<div class="move-entry">${i + 1}. ${pieceSymbol} ${from} → ${to}</div>`;
    }).join('');
    historyDiv.scrollTop = historyDiv.scrollHeight;
    
    document.getElementById('red-captured-list').innerHTML = game.capturedPieces.red.map(p => 
        `<span class="captured-piece red">${getPieceSymbol(p)}</span>`
    ).join('');
    
    document.getElementById('black-captured-list').innerHTML = game.capturedPieces.black.map(p => 
        `<span class="captured-piece black">${getPieceSymbol(p)}</span>`
    ).join('');
}

document.getElementById('new-game-btn').addEventListener('click', () => {
    initBoard();
    drawBoard();
    updateUI();
});

document.getElementById('undo-btn').addEventListener('click', () => {
    if (game.vsAI && game.moveHistory.length >= 2) {
        undoMove();
        undoMove();
    } else {
        undoMove();
    }
    drawBoard();
    updateUI();
});

document.getElementById('flip-board-btn').addEventListener('click', () => {
    game.isFlipped = !game.isFlipped;
    drawBoard();
});

document.getElementById('ai-depth').addEventListener('change', (e) => {
    game.aiDepth = parseInt(e.target.value);
});

document.getElementById('vs-ai-btn').addEventListener('click', () => {
    game.vsAI = true;
    document.getElementById('vs-ai-btn').classList.add('active');
    document.getElementById('vs-human-btn').classList.remove('active');
    initBoard();
    drawBoard();
    updateUI();
});

document.getElementById('vs-human-btn').addEventListener('click', () => {
    game.vsAI = false;
    document.getElementById('vs-human-btn').classList.add('active');
    document.getElementById('vs-ai-btn').classList.remove('active');
    initBoard();
    drawBoard();
    updateUI();
});

const ENDGAME_STUDIES = [
    {
        name: "Basic Checkmate",
        description: "Red to move. Play the Chariot to the same column as the Black King to deliver checkmate. The Red King controls the escape squares via the 'flying general' rule.",
        setup: (board) => {
            board[0][3] = { type: 'king', color: 'black' };
            board[9][4] = { type: 'king', color: 'red' };
            board[5][0] = { type: 'chariot', color: 'red' };
            return board;
        }
    },
    {
        name: "Chariot & Horse Mate",
        description: "Red to move. Coordinate the Chariot and Horse for a classic checkmate pattern.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[1][3] = { type: 'chariot', color: 'red' };
            board[2][2] = { type: 'horse', color: 'red' };
            return board;
        }
    },
    {
        name: "Cannon Mate",
        description: "Red to move. Use the Cannon with a platform to checkmate the Black King.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[3][4] = { type: 'cannon', color: 'red' };
            board[5][4] = { type: 'soldier', color: 'red' };
            return board;
        }
    },
    {
        name: "Double Cannon",
        description: "Red to move. Two Cannons can create a powerful mating net.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[2][4] = { type: 'cannon', color: 'red' };
            board[4][4] = { type: 'cannon', color: 'red' };
            return board;
        }
    },
    {
        name: "Horse & Cannon",
        description: "Red to move. The Horse and Cannon combination is one of the most powerful attacking pairs.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[1][3] = { type: 'horse', color: 'red' };
            board[3][4] = { type: 'cannon', color: 'red' };
            return board;
        }
    },
    {
        name: "Chariot Mate",
        description: "Red to move. A lone Chariot can checkmate with proper positioning.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[0][0] = { type: 'chariot', color: 'red' };
            board[2][5] = { type: 'advisor', color: 'black' };
            return board;
        }
    }
];

document.querySelectorAll('.study-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const studyIndex = parseInt(btn.dataset.study);
        const study = ENDGAME_STUDIES[studyIndex];
        
        game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        study.setup(game.board);
        
        game.currentTurn = 'red';
        game.selectedPiece = null;
        game.moveHistory = [];
        game.capturedPieces = { red: [], black: [] };
        game.gameOver = false;
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('study-description').textContent = study.description;
        
        drawBoard();
        updateUI();
    });
});

document.getElementById('game-over-btn').addEventListener('click', () => {
    initBoard();
    drawBoard();
    updateUI();
});

initBoard();
drawBoard();
updateUI();
