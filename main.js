canvas.addEventListener('click', (e) => {
    const coords = getBoardCoords(e);
    if (!coords) return;
    
    if (game.setupMode) {
        placeSetupPiece(coords[0], coords[1]);
        drawBoard();
        return;
    }
    
    if (game.gameOver || game.aiThinking) return;
    if (isAIControlled(game.currentTurn)) return;
    
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
            
            if (!game.gameOver && isAIControlled(game.currentTurn)) {
                aiMove(game.currentTurn);
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

function resetLaunchOptions() {
    document.getElementById('setup-panel').classList.add('hidden');
    document.getElementById('examples-panel').classList.add('hidden');
    document.getElementById('setup-btn').classList.remove('active');
    document.getElementById('examples-btn').classList.remove('active');
}

document.getElementById('new-game-btn').addEventListener('click', () => {
    resetLaunchOptions();
    initBoard();
    drawBoard();
    updateUI();
    if (isAIControlled(game.currentTurn)) {
        aiMove(game.currentTurn);
    }
});

document.getElementById('undo-btn').addEventListener('click', () => {
    if (game.setupMode) return;
    const anyAI = isAIControlled('red') || isAIControlled('black');
    if (anyAI && game.moveHistory.length >= 2) {
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

document.getElementById('standard-btn').addEventListener('click', () => {
    resetLaunchOptions();
    initBoard();
    drawBoard();
    updateUI();
    if (isAIControlled(game.currentTurn)) {
        aiMove(game.currentTurn);
    }
});

document.getElementById('setup-btn').addEventListener('click', () => {
    if (game.setupMode) {
        cancelPositionSetup();
        document.getElementById('setup-btn').classList.remove('active');
        return;
    }
    document.getElementById('examples-panel').classList.add('hidden');
    document.getElementById('examples-btn').classList.remove('active');
    startPositionSetup();
    document.getElementById('setup-btn').classList.add('active');
});

document.getElementById('examples-btn').addEventListener('click', () => {
    const panel = document.getElementById('examples-panel');
    if (panel.classList.contains('hidden')) {
        if (game.setupMode) cancelPositionSetup();
        document.getElementById('setup-btn').classList.remove('active');
        panel.classList.remove('hidden');
        document.getElementById('examples-btn').classList.add('active');
    } else {
        panel.classList.add('hidden');
        document.getElementById('examples-btn').classList.remove('active');
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
    if (commitPositionSetup()) {
        document.getElementById('setup-btn').classList.remove('active');
    }
});
document.getElementById('setup-cancel-btn').addEventListener('click', () => {
    cancelPositionSetup();
    document.getElementById('setup-btn').classList.remove('active');
});

document.getElementById('ai-depth').addEventListener('change', (e) => {
    game.aiDepth = parseInt(e.target.value);
});

const MODE_CONFIGS = {
    'mode-hr-cb': ['human', 'ai'],
    'mode-cr-hb': ['ai', 'human'],
    'mode-hr-hb': ['human', 'human'],
    'mode-cr-cb': ['ai', 'ai']
};

function setModeState(redCtl, blackCtl, changed) {
    game.redController = redCtl;
    game.blackController = blackCtl;
    for (const id of Object.keys(MODE_CONFIGS)) {
        const [r, b] = MODE_CONFIGS[id];
        document.getElementById(id).classList.toggle('active', r === redCtl && b === blackCtl);
    }
    if (changed) {
        game.isFlipped = (redCtl === 'ai' && blackCtl === 'human');
    }
}

Object.keys(MODE_CONFIGS).forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
        const [r, b] = MODE_CONFIGS[id];
        const changed = game.redController !== r || game.blackController !== b;
        setModeState(r, b, changed);
        aiMoveSequence++;
        if (!game.setupMode && !game.gameOver && isAIControlled(game.currentTurn)) {
            aiMove(game.currentTurn);
        }
        drawBoard();
        updateUI();
    });
});

document.querySelectorAll('.study-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const studyIndex = parseInt(btn.dataset.study);
        const study = ENDGAME_EXAMPLES[studyIndex];
        
        exitSetupMode();
        document.getElementById('setup-btn').classList.remove('active');
        document.getElementById('examples-btn').classList.add('active');
        
        game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        study.setup(game.board);
        
        game.currentTurn = 'red';
        game.selectedPiece = null;
        game.moveHistory = [];
        game.capturedPieces = { red: [], black: [] };
        game.gameOver = false;
        game.aiThinking = false;
        game.historyIndex = -1;
        game.initialBoard = game.board.map(row => row.slice());
        aiMoveSequence++;
        document.getElementById('game-over-overlay').classList.add('hidden');
        
        document.getElementById('study-description').textContent = study.description;
        
        drawBoard();
        updateUI();
        if (!game.gameOver && isAIControlled(game.currentTurn)) {
            aiMove(game.currentTurn);
        }
    });
});

document.getElementById('game-over-btn').addEventListener('click', () => {
    resetLaunchOptions();
    initBoard();
    drawBoard();
    updateUI();
    if (isAIControlled(game.currentTurn)) {
        aiMove(game.currentTurn);
    }
});

document.getElementById('game-over-review-btn').addEventListener('click', () => {
    document.getElementById('game-over-overlay').classList.add('hidden');
    drawBoard();
    updateUI();
});

initBoard();
drawBoard();
updateUI();
updateMusicButton();
updateSetupPalette();