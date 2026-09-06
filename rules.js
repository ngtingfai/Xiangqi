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

function canLegallyCapture(color, fr, fc, tr, tc) {
    const piece = game.board[fr][fc];
    const victim = game.board[tr][tc];
    if (!piece || !victim || victim.color === color) return false;
    if (!getValidMoves(fr, fc).some(([r, c]) => r === tr && c === tc)) return false;

    game.board[tr][tc] = piece;
    game.board[fr][fc] = null;
    const ok = !isInCheck(color) && !isKingsFacing();
    game.board[fr][fc] = piece;
    game.board[tr][tc] = victim;
    return ok;
}

function isProtectedVictim(attacker, victim, vr, vc) {
    if (PIECE_VALUES[victim.type] > PIECE_VALUES[attacker.type]) return false;
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const defender = game.board[r][c];
            if (!defender || defender.color !== victim.color || defender === victim) continue;
            if (canLegallyCapture(victim.color, r, c, vr, vc)) return true;
        }
    }
    return false;
}

function isExchangeAttack(attacker, victim, ar, ac, vr, vc) {
    if (PIECE_VALUES[attacker.type] !== PIECE_VALUES[victim.type]) return false;
    return canLegallyCapture(victim.color, vr, vc, ar, ac);
}

function computeMoveStatus(move) {
    if (move.captured || move.piece.type === 'soldier') {
        return { status: POSITION_CANCEL, chased: [] };
    }

    const mover = move.piece.color;
    const opponent = mover === 'red' ? 'black' : 'red';

    if (isInCheck(opponent)) {
        return { status: POSITION_CHECK, chased: [] };
    }

    const victims = [];
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const victim = game.board[r][c];
            if (!victim || victim.color !== opponent) continue;
            if (victim.type === 'king') continue;
            if (victim.type === 'soldier' && !isAcrossRiver(r, opponent)) continue;

            for (let ar = 0; ar < BOARD_HEIGHT; ar++) {
                for (let ac = 0; ac < BOARD_SIZE; ac++) {
                    const attacker = game.board[ar][ac];
                    if (!attacker || attacker.color !== mover || attacker === victim) continue;
                    if (!canLegallyCapture(mover, ar, ac, r, c)) continue;
                    if (isExchangeAttack(attacker, victim, ar, ac, r, c)) continue;
                    if (isProtectedVictim(attacker, victim, r, c)) continue;
                    victims.push(r + ',' + c);
                    break;
                }
            }
        }
    }

    const unique = [...new Set(victims)];
    if (unique.length === 1) return { status: POSITION_CHASE, chased: unique };
    return { status: POSITION_IDLE, chased: [] };
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
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of dirs) {
        let r = kingRow + dr;
        let c = kingCol + dc;
        let foundScreen = false;
        while (isValidPos(r, c)) {
            const piece = game.board[r][c];
            if (piece) {
                if (!foundScreen) {
                    if (piece.color === opponent && piece.type === 'chariot') {
                        return true;
                    }
                    foundScreen = true;
                } else {
                    if (piece.color === opponent && piece.type === 'cannon') {
                        return true;
                    }
                    break;
                }
            }
            r += dr;
            c += dc;
        }
    }
    
    const horseMoves = [
        [-2, -1, -1, 0], [-2, 1, -1, 0],
        [2, -1, 1, 0], [2, 1, 1, 0],
        [-1, -2, 0, -1], [-1, 2, 0, 1],
        [1, -2, 0, -1], [1, 2, 0, 1]
    ];
    for (const [dr, dc, br, bc] of horseMoves) {
        const sr = kingRow - dr;
        const sc = kingCol - dc;
        if (!isValidPos(sr, sc)) continue;
        const piece = game.board[sr][sc];
        if (piece && piece.color === opponent && piece.type === 'horse') {
            if (!game.board[sr + br][sc + bc]) {
                return true;
            }
        }
    }
    
    for (const [dr, dc] of [[-2, -2], [-2, 2], [2, -2], [2, 2]]) {
        const sr = kingRow + dr;
        const sc = kingCol + dc;
        if (!isValidPos(sr, sc)) continue;
        const piece = game.board[sr][sc];
        if (piece && piece.color === opponent && piece.type === 'elephant') {
            if (opponent === 'red' && kingRow < 5) continue;
            if (opponent === 'black' && kingRow > 4) continue;
            if (!game.board[(sr + kingRow) / 2][(sc + kingCol) / 2]) {
                return true;
            }
        }
    }
    
    for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        const sr = kingRow + dr;
        const sc = kingCol + dc;
        if (!isValidPos(sr, sc) || !isInPalace(kingRow, kingCol, opponent)) continue;
        const piece = game.board[sr][sc];
        if (piece && piece.color === opponent && piece.type === 'advisor') {
            return true;
        }
    }
    
    const forwardRow = opponent === 'red' ? kingRow + 1 : kingRow - 1;
    if (isValidPos(forwardRow, kingCol)) {
        const piece = game.board[forwardRow][kingCol];
        if (piece && piece.color === opponent && piece.type === 'soldier') {
            return true;
        }
    }
    
    const crossed = color === 'red' ? kingRow >= 5 : kingRow <= 4;
    if (crossed) {
        for (const dc of [-1, 1]) {
            const sc = kingCol + dc;
            if (isValidPos(kingRow, sc)) {
                const piece = game.board[kingRow][sc];
                if (piece && piece.color === opponent && piece.type === 'soldier') {
                    return true;
                }
            }
        }
    }
    
    for (const [dr, dc] of dirs) {
        const r = kingRow + dr;
        const c = kingCol + dc;
        if (!isValidPos(r, c) || !isInPalace(r, c, opponent)) continue;
        const piece = game.board[r][c];
        if (piece && piece.color === opponent && piece.type === 'king') {
            return true;
        }
    }
    
    return false;
}