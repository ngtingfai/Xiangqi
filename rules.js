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