canvas.addEventListener('click', (e) => {
    const coords = getBoardCoords(e);
    if (!coords) return;
    
    if (game.setupMode) {
        placeSetupPiece(coords[0], coords[1]);
        drawBoard();
        return;
    }
    
    if (game.gameOver || game.aiThinking) return;
    if (game.vsAI && game.currentTurn !== game.humanColor) return;
    
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
            
            if (game.vsAI && !game.gameOver && game.currentTurn !== game.humanColor) {
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

document.getElementById('new-game-btn').addEventListener('click', () => {
    initBoard();
    drawBoard();
    updateUI();
    if (game.vsAI && game.humanColor === 'black') {
        aiMove();
    }
});

document.getElementById('undo-btn').addEventListener('click', () => {
    if (game.setupMode) return;
    if (game.vsAI && game.moveHistory.length >= 2) {
        undoMove();
        undoMove();
    } else {
        undoMove();
    }
    drawBoard();
    updateUI();
});

document.getElementById('notation-table').addEventListener('click', (e) => {
    const link = e.target.closest ? e.target.closest('.move-link') : null;
    if (!link) return;
    e.preventDefault();
    restorePosition(parseInt(link.dataset.move, 10));
});

document.getElementById('flip-board-btn').addEventListener('click', () => {
    game.isFlipped = !game.isFlipped;
    drawBoard();
});

document.getElementById('music-btn').addEventListener('click', () => {
    toggleMusic();
});

document.getElementById('notation-btn').addEventListener('click', () => {
    game.notation = game.notation === 'chinese' ? 'wxf' : 'chinese';
    document.getElementById('notation-btn').textContent = game.notation === 'chinese' ? 'Notation: 中文' : 'Notation: WXF';
    updateUI();
});

document.getElementById('setup-btn').addEventListener('click', () => {
    document.getElementById('examples-panel').classList.add('hidden');
    if (game.setupMode) {
        cancelPositionSetup();
    } else {
        startPositionSetup();
    }
});

document.getElementById('examples-btn').addEventListener('click', () => {
    const panel = document.getElementById('examples-panel');
    if (panel.classList.contains('hidden')) {
        if (game.setupMode) cancelPositionSetup();
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
});

const paletteEl = document.getElementById('setup-palette');
const paletteTypes = Object.keys(RED_PIECES);
['red', 'black'].forEach(color => {
    paletteTypes.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'setup-piece-btn ' + (color === 'red' ? 'red-piece' : 'black-piece');
        btn.dataset.type = key.toLowerCase();
        btn.dataset.color = color;
        btn.textContent = color === 'red' ? RED_PIECES[key] : BLACK_PIECES[key];
        btn.title = color + ' ' + key.toLowerCase();
        btn.addEventListener('click', () => selectSetupPiece(btn.dataset.type, btn.dataset.color));
        paletteEl.appendChild(btn);
    });
});

document.getElementById('setup-eraser-btn').addEventListener('click', selectSetupEraser);
document.getElementById('setup-clear-btn').addEventListener('click', clearSetupBoard);
document.getElementById('setup-standard-btn').addEventListener('click', loadSetupStandard);
document.getElementById('setup-turn-red-btn').addEventListener('click', () => {
    game.currentTurn = 'red';
    updateSetupPalette();
    updateUI();
});
document.getElementById('setup-turn-black-btn').addEventListener('click', () => {
    game.currentTurn = 'black';
    updateSetupPalette();
    updateUI();
});
document.getElementById('setup-start-btn').addEventListener('click', () => {
    commitPositionSetup();
});
document.getElementById('setup-cancel-btn').addEventListener('click', cancelPositionSetup);

document.getElementById('ai-depth').addEventListener('change', (e) => {
    game.aiDepth = parseInt(e.target.value);
});

document.getElementById('vs-ai-btn').addEventListener('click', () => {
    game.vsAI = true;
    game.humanColor = 'red';
    document.getElementById('vs-ai-btn').classList.add('active');
    document.getElementById('vs-human-btn').classList.remove('active');
    document.getElementById('side-toggle').classList.remove('hidden');
    document.getElementById('switch-sides-btn').textContent = 'Switch Sides (Play as Black)';
    initBoard();
    drawBoard();
    updateUI();
});

document.getElementById('vs-human-btn').addEventListener('click', () => {
    game.vsAI = false;
    document.getElementById('vs-human-btn').classList.add('active');
    document.getElementById('vs-ai-btn').classList.remove('active');
    document.getElementById('side-toggle').classList.add('hidden');
    updateUI();
});

document.getElementById('switch-sides-btn').addEventListener('click', () => {
    game.humanColor = game.humanColor === 'red' ? 'black' : 'red';
    game.isFlipped = game.humanColor === 'black';
    const btn = document.getElementById('switch-sides-btn');
    btn.textContent = game.humanColor === 'red' ? 'Switch Sides (Play as Black)' : 'Switch Sides (Play as Red)';
    initBoard();
    drawBoard();
    updateUI();
    if (game.humanColor === 'black') {
        aiMove();
    }
});

document.querySelectorAll('.study-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const studyIndex = parseInt(btn.dataset.study);
        const study = ENDGAME_EXAMPLES[studyIndex];
        
        exitSetupMode();
        
        game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        study.setup(game.board);
        
        game.currentTurn = 'red';
        game.humanColor = 'red';
        game.selectedPiece = null;
        game.moveHistory = [];
        game.capturedPieces = { red: [], black: [] };
        game.gameOver = false;
        game.aiThinking = false;
        game.historyIndex = -1;
        game.initialBoard = game.board.map(row => row.slice());
        aiMoveSequence++;
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('switch-sides-btn').textContent = 'Switch Sides (Play as Black)';
        
        document.getElementById('study-description').textContent = study.description;
        
        drawBoard();
        updateUI();
    });
});

document.getElementById('game-over-btn').addEventListener('click', () => {
    initBoard();
    drawBoard();
    updateUI();
    if (game.vsAI && game.humanColor === 'black') {
        aiMove();
    }
});

initBoard();
drawBoard();
updateUI();
updateMusicButton();
updateSetupPalette();