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
    
    const aiColor = game.humanColor === 'red' ? 'black' : 'red';
    const aiIsMaximizing = aiColor === 'red';
    
    game.aiThinking = true;
    
    const token = ++aiMoveSequence;
    setTimeout(() => {
        if (token !== aiMoveSequence) return;
        const moves = getAllLegalMoves(aiColor);
        if (moves.length === 0) {
            game.gameOver = true;
            const winner = aiColor === 'red' ? 'Black' : 'Red';
            showGameOver('Victory!', winner + ' Wins - No moves left!');
            game.aiThinking = false;
            return;
        }
        
        let bestMove = null;
        let bestScore = aiIsMaximizing ? -Infinity : Infinity;
        
        for (const [fr, fc, tr, tc] of moves) {
            const piece = game.board[fr][fc];
            const captured = game.board[tr][tc];
            
            game.board[tr][tc] = piece;
            game.board[fr][fc] = null;
            
            const score = minimax(game.aiDepth - 1, -Infinity, Infinity, !aiIsMaximizing);
            
            game.board[fr][fc] = piece;
            game.board[tr][tc] = captured;
            
            if (aiIsMaximizing ? score > bestScore : score < bestScore) {
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