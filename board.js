const BOARD_SIZE = 9;
const BOARD_HEIGHT = 10;
const CELL_SIZE = 65;
const MARGIN = 40;

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

const game = {
    board: [],
    initialBoard: [],
    historyIndex: -1,
    currentTurn: 'red',
    selectedPiece: null,
    moveHistory: [],
    capturedPieces: { red: [], black: [] },
    isFlipped: false,
    redController: 'human',
    blackController: 'ai',
    aiDepth: 2,
    aiThinking: false,
    gameOver: false,
    notation: 'chinese',
    musicOn: false,
    moveStartTime: Date.now(),
    setupMode: false,
    setupSelection: null,
    setupBackupBoard: [],
    setupBackupHistory: [],
    setupBackupTurn: 'red',
    setupBackupCaptured: { red: [], black: [] },
    setupBackupIndex: -1,
    setupBackupOver: false,
    setupBackupOverTitle: 'Checkmate!',
    setupBackupOverMessage: 'Red Wins!'
};

const POSITION_CANCEL = 0;
const POSITION_IDLE = 1;
const POSITION_CHASE = 2;
const POSITION_CHECK = 4;

const VIOLATION_UNDECIDED = -1;
const VIOLATION_IDLE = 0;
const VIOLATION_CHASE = 1;
const VIOLATION_CHECK = 2;

const REPETITION_TIMES = 3;

let aiMoveSequence = 0;

function isAIControlled(color) {
    return color === 'red' ? game.redController === 'ai' : game.blackController === 'ai';
}

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
    game.aiThinking = false;
    game.historyIndex = -1;
    game.moveStartTime = Date.now();
    game.initialBoard = game.board.map(row => row.slice());
    aiMoveSequence++;
    document.getElementById('game-over-overlay').classList.add('hidden');
    exitSetupMode();
}

function startPositionSetup() {
    game.setupMode = true;
    game.setupBackupBoard = game.board.map(row => row.slice());
    game.setupBackupHistory = game.moveHistory.slice();
    game.setupBackupTurn = game.currentTurn;
    game.setupBackupCaptured = {
        red: game.capturedPieces.red.slice(),
        black: game.capturedPieces.black.slice()
    };
    game.setupBackupIndex = game.historyIndex;
    game.setupBackupOver = game.gameOver;
    game.setupBackupOverTitle = document.getElementById('game-over-title').textContent;
    game.setupBackupOverMessage = document.getElementById('game-over-message').textContent;

    game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    game.currentTurn = 'red';
    game.selectedPiece = null;
    game.moveHistory = [];
    game.capturedPieces = { red: [], black: [] };
    game.gameOver = false;
    game.aiThinking = false;
    game.historyIndex = -1;
    game.setupSelection = null;
    game.moveStartTime = Date.now();
    aiMoveSequence++;

    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('setup-panel').classList.remove('hidden');
    document.getElementById('setup-message').textContent = '';
    updateSetupPalette();
    drawBoard();
    updateUI();
}

function exitSetupMode() {
    game.setupMode = false;
    game.setupSelection = null;
    document.getElementById('setup-panel').classList.add('hidden');
}

function selectSetupPiece(type, color) {
    game.setupSelection = { type, color };
    updateSetupPalette();
}

function selectSetupEraser() {
    game.setupSelection = null;
    updateSetupPalette();
}

function placeSetupPiece(row, col) {
    if (!isValidPos(row, col)) return;
    if (game.setupSelection) {
        game.board[row][col] = { type: game.setupSelection.type, color: game.setupSelection.color };
    } else {
        game.board[row][col] = null;
    }
}

function clearSetupBoard() {
    game.board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    drawBoard();
    updateUI();
}

function loadSetupStandard() {
    initBoard();
    game.setupMode = true;
    game.setupBackupBoard = game.board.map(row => row.slice());
    game.setupBackupHistory = [];
    game.setupBackupTurn = 'red';
    game.setupBackupCaptured = { red: [], black: [] };
    game.setupBackupIndex = -1;
    game.setupBackupOver = false;
    game.setupSelection = null;
    document.getElementById('setup-panel').classList.remove('hidden');
    document.getElementById('setup-message').textContent = '';
    updateSetupPalette();
    drawBoard();
    updateUI();
}

function updateSetupPalette() {
    document.querySelectorAll('.setup-piece-btn').forEach(btn => {
        const active = game.setupSelection &&
            btn.dataset.type === game.setupSelection.type &&
            btn.dataset.color === game.setupSelection.color;
        btn.classList.toggle('active', active);
    });
    const eraser = document.getElementById('setup-eraser-btn');
    if (eraser) eraser.classList.toggle('active', !game.setupSelection);
    const redTurn = document.getElementById('setup-turn-red-btn');
    const blackTurn = document.getElementById('setup-turn-black-btn');
    if (redTurn) redTurn.classList.toggle('active', game.currentTurn === 'red');
    if (blackTurn) blackTurn.classList.toggle('active', game.currentTurn === 'black');
}

const SETUP_MAX_PIECES = { king: 1, chariot: 2, horse: 2, cannon: 2, elephant: 2, advisor: 2, soldier: 5 };

const RED_SOLDIER_MAX_ROW = 6;
const BLACK_SOLDIER_MIN_ROW = 3;

const ADVISOR_SQUARES = {
    red: ['7,3', '7,5', '8,4', '9,3', '9,5'],
    black: ['0,3', '0,5', '1,4', '2,3', '2,5']
};

const ELEPHANT_SQUARES = {
    red: ['5,2', '5,6', '7,0', '7,4', '7,8', '9,2', '9,6'],
    black: ['0,2', '0,6', '2,0', '2,4', '2,8', '4,2', '4,6']
};

function validateSetupPosition() {
    const errors = [];
    const redKings = [];
    const blackKings = [];
    const counts = {
        red: { king: 0, chariot: 0, horse: 0, cannon: 0, elephant: 0, advisor: 0, soldier: 0 },
        black: { king: 0, chariot: 0, horse: 0, cannon: 0, elephant: 0, advisor: 0, soldier: 0 }
    };

    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = game.board[r][c];
            if (!piece) continue;
            counts[piece.color][piece.type]++;
            if (piece.type === 'king') {
                if (piece.color === 'red') redKings.push([r, c]);
                else blackKings.push([r, c]);
                continue;
            }

            const colorName = piece.color === 'red' ? 'Red' : 'Black';
            if (piece.type === 'advisor') {
                if (!ADVISOR_SQUARES[piece.color].includes(r + ',' + c)) {
                    errors.push(`A ${colorName} advisor must sit on a palace diagonal square.`);
                }
            } else if (piece.type === 'elephant') {
                if (!ELEPHANT_SQUARES[piece.color].includes(r + ',' + c)) {
                    errors.push(`A ${colorName} elephant is on a square no elephant can reach (elephants never cross the river).`);
                }
            } else if (piece.type === 'soldier') {
                if (piece.color === 'red' && r > RED_SOLDIER_MAX_ROW) {
                    errors.push('A Red soldier cannot be behind its starting rank (soldiers never move backward).');
                } else if (piece.color === 'black' && r < BLACK_SOLDIER_MIN_ROW) {
                    errors.push('A Black soldier cannot be behind its starting rank (soldiers never move backward).');
                }
            }
        }
    }

    if (redKings.length !== 1) errors.push('Red needs exactly one king.');
    if (blackKings.length !== 1) errors.push('Black needs exactly one king.');
    if (redKings.length === 1 && blackKings.length === 1) {
        const [rr, rc] = redKings[0];
        const [br, bc] = blackKings[0];
        if (!isInPalace(rr, rc, 'red')) errors.push('The Red king must be placed in its palace.');
        if (!isInPalace(br, bc, 'black')) errors.push('The Black king must be placed in its palace.');
        if (rc === bc) {
            let blocked = false;
            for (let r = br + 1; r < rr; r++) {
                if (game.board[r][rc]) {
                    blocked = true;
                    break;
                }
            }
            if (!blocked) errors.push('The two kings cannot face each other with an empty file.');
        }
    }

    for (const color of ['red', 'black']) {
        const colorName = color === 'red' ? 'Red' : 'Black';
        for (const type of ['chariot', 'horse', 'cannon', 'elephant', 'advisor', 'soldier']) {
            const max = SETUP_MAX_PIECES[type];
            if (counts[color][type] > max) {
                errors.push(`${colorName} has too many ${type}s (max ${max}).`);
            }
        }
    }

    if (redKings.length === 1 && blackKings.length === 1) {
        if (game.currentTurn === 'red' && isInCheck('black')) {
            errors.push('Red is to move, but Red is already giving check to the Black king.');
        } else if (game.currentTurn === 'black' && isInCheck('red')) {
            errors.push('Black is to move, but Black is already giving check to the Red king.');
        }
    }

    return errors.length ? errors.join('\n') : null;
}

function commitPositionSetup() {
    const message = validateSetupPosition();
    if (message) {
        document.getElementById('setup-message').textContent = message;
        return false;
    }
    document.getElementById('setup-message').textContent = '';
    game.setupMode = false;
    game.setupSelection = null;
    game.selectedPiece = null;
    game.moveHistory = [];
    game.capturedPieces = { red: [], black: [] };
    game.gameOver = false;
    game.aiThinking = false;
    game.historyIndex = -1;
    game.moveStartTime = Date.now();
    game.initialBoard = game.board.map(row => row.slice());
    aiMoveSequence++;
    document.getElementById('setup-panel').classList.add('hidden');
    drawBoard();
    updateUI();
    checkForCheckmate();
    if (!game.gameOver && isAIControlled(game.currentTurn)) {
        aiMove(game.currentTurn);
    }
    return true;
}

function cancelPositionSetup() {
    game.board = game.setupBackupBoard.map(row => row.slice());
    game.moveHistory = game.setupBackupHistory;
    game.currentTurn = game.setupBackupTurn;
    game.capturedPieces = {
        red: game.setupBackupCaptured.red.slice(),
        black: game.setupBackupCaptured.black.slice()
    };
    game.historyIndex = game.setupBackupIndex;
    game.gameOver = game.setupBackupOver;
    game.aiThinking = false;
    game.setupMode = false;
    game.setupSelection = null;
    game.selectedPiece = null;
    aiMoveSequence++;
    document.getElementById('setup-panel').classList.add('hidden');
    if (game.gameOver) {
        showGameOver(game.setupBackupOverTitle || 'Checkmate!', game.setupBackupOverMessage || 'Red Wins!');
    }
    drawBoard();
    updateUI();
}

function getPieceSymbol(piece) {
    if (!piece) return '';
    return piece.color === 'red' ? RED_PIECES[piece.type.toUpperCase()] : BLACK_PIECES[piece.type.toUpperCase()];
}

function boardToScreen(row, col) {
    if (game.isFlipped) {
        return [BOARD_HEIGHT - 1 - row, BOARD_SIZE - 1 - col];
    }
    return [row, col];
}

function screenToBoard(row, col) {
    if (game.isFlipped) {
        return [BOARD_HEIGHT - 1 - row, BOARD_SIZE - 1 - col];
    }
    return [row, col];
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