const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeCtxStub() {
    return new Proxy({}, {
        get(target, prop) {
            if (!(prop in target)) target[prop] = () => {};
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            return true;
        }
    });
}

function createElement(id) {
    const el = {
        id,
        textContent: '',
        innerHTML: '',
        className: '',
        value: '2',
        scrollTop: 0,
        scrollHeight: 0,
        dataset: {},
        style: {},
        classList: {
            add() {},
            remove() {},
            toggle() {}
        },
        getBoundingClientRect() {
            return { left: 0, top: 0, width: 585, height: 655 };
        },
        click() {
            (this._handlers.click || []).forEach((fn) => fn({ target: el }));
        },
        addEventListener(type, fn) {
            (this._handlers[type] = this._handlers[type] || []).push(fn);
        }
    };
    el._handlers = {};
    if (id === 'board') {
        el.getContext = () => makeCtxStub();
    }
    return el;
}

const SOURCE_FILES = ['board.js', 'rules.js', 'move.js', 'ai.js', 'render.js', 'main.js'];

function loadGame() {
    const src = SOURCE_FILES
        .map(f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))
        .join('\n');

    const elements = {};
    const document = {
        getElementById(id) {
            if (!elements[id]) elements[id] = createElement(id);
            return elements[id];
        },
        querySelectorAll() {
            return [];
        }
    };

    const sandbox = { document, setTimeout, clearTimeout, console };
    vm.createContext(sandbox);

    const apiNames = [
        'game', 'BOARD_SIZE', 'BOARD_HEIGHT', 'CELL_SIZE', 'MARGIN',
        'PIECE_VALUES', 'EVAL_RANGE',
        'initBoard', 'getValidMoves', 'getAllLegalMoves', 'isInCheck',
        'isKingsFacing', 'isInPalace', 'isAcrossRiver', 'boardToScreen',
        'screenToBoard', 'makeMove', 'undoMove', 'evaluateBoard',
        'getPieceSymbol', 'toWXFMove', 'toChineseMove', 'formatMove',
        'updateUI', 'updateEvalBar', 'checkForCheckmate', 'restorePosition'
    ];
    const epilogue = `\n;globalThis.__api = { ${apiNames.join(', ')} };`;

    vm.runInContext(src + epilogue, sandbox, { filename: 'game.js' });

    sandbox.__api.__elements = elements;
    return sandbox.__api;
}

function setBoard(api, pieces) {
    api.game.board = Array(api.BOARD_HEIGHT).fill(null)
        .map(() => Array(api.BOARD_SIZE).fill(null));
    for (const [row, col, type, color] of pieces) {
        api.game.board[row][col] = { type, color };
    }
    api.game.currentTurn = 'red';
    api.game.selectedPiece = null;
    api.game.moveHistory = [];
    api.game.capturedPieces = { red: [], black: [] };
    api.game.gameOver = false;
    api.game.isFlipped = false;
    api.game.notation = 'chinese';
    api.game.aiThinking = false;
    api.game.historyIndex = -1;
    api.game.musicOn = false;
    api.game.moveStartTime = Date.now();
    api.game.initialBoard = api.game.board.map(row => row.slice());
    if (api.__elements['music-btn']) {
        api.__elements['music-btn'].textContent = 'Music: Off';
        api.__elements['music-btn'].className = '';
    }
}

function hasMove(moves, fr, fc, tr, tc) {
    return moves.some((m) => m[0] === fr && m[1] === fc && m[2] === tr && m[3] === tc);
}

module.exports = { loadGame, setBoard, hasMove };