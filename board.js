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
    vsAI: true,
    humanColor: 'red',
    aiDepth: 2,
    aiThinking: false,
    gameOver: false,
    notation: 'chinese',
    musicOn: false
};

let aiMoveSequence = 0;

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
    game.initialBoard = game.board.map(row => row.slice());
    aiMoveSequence++;
    document.getElementById('game-over-overlay').classList.add('hidden');
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