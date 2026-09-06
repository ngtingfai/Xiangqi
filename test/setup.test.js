const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadGame, setBoard } = require('./harness');

const api = loadGame();

describe('position setup', () => {
    function validPosition() {
        setBoard(api, []);
        api.startPositionSetup();
        api.selectSetupPiece('king', 'red');
        api.placeSetupPiece(9, 3);
        api.selectSetupPiece('king', 'black');
        api.placeSetupPiece(0, 4);
    }

    it('starting setup clears the board and enters setup mode', () => {
        setBoard(api, [[9, 4, 'king', 'red'], [0, 4, 'king', 'black']]);
        api.startPositionSetup();
        assert.strictEqual(api.game.setupMode, true);
        assert.ok(api.game.board.every(row => row.every(cell => cell === null)));
        assert.strictEqual(api.game.moveHistory.length, 0);
        assert.strictEqual(api.game.currentTurn, 'red');
    });

    it('places the selected piece and erases on eraser mode', () => {
        setBoard(api, []);
        api.startPositionSetup();
        api.selectSetupPiece('chariot', 'red');
        api.placeSetupPiece(5, 4);
        assert.deepEqual(api.game.board[5][4], { type: 'chariot', color: 'red' });

        api.selectSetupEraser();
        api.placeSetupPiece(5, 4);
        assert.strictEqual(api.game.board[5][4], null);

        api.placeSetupPiece(5, 4);
        assert.strictEqual(api.game.board[5][4], null);
    });

    it('clearSetupBoard empties the board', () => {
        setBoard(api, []);
        api.startPositionSetup();
        api.selectSetupPiece('horse', 'black');
        api.placeSetupPiece(4, 4);
        api.clearSetupBoard();
        assert.ok(api.game.board.every(row => row.every(cell => cell === null)));
    });

    it('rejects positions without both kings in their palaces', () => {
        setBoard(api, []);
        api.startPositionSetup();
        assert.strictEqual(api.commitPositionSetup(), false);
        assert.ok(api.__elements['setup-message'].textContent.includes('Red needs exactly one king'));

        api.selectSetupPiece('king', 'red');
        api.placeSetupPiece(9, 3);
        assert.strictEqual(api.commitPositionSetup(), false);
        assert.ok(api.__elements['setup-message'].textContent.includes('Black needs exactly one king'));

        api.selectSetupPiece('king', 'black');
        api.placeSetupPiece(9, 4);
        assert.strictEqual(api.commitPositionSetup(), false);
        assert.ok(api.__elements['setup-message'].textContent.includes('The Black king must be placed in its palace'));
    });

    it('rejects facing kings', () => {
        setBoard(api, []);
        api.startPositionSetup();
        api.selectSetupPiece('king', 'red');
        api.placeSetupPiece(9, 4);
        api.selectSetupPiece('king', 'black');
        api.placeSetupPiece(0, 4);
        assert.strictEqual(api.commitPositionSetup(), false);
        assert.ok(api.__elements['setup-message'].textContent.includes('cannot face each other'));
    });

    it('commits a valid setup position as a fresh game', () => {
        setBoard(api, []);
        api.game.vsAI = false;
        validPosition();
        api.selectSetupPiece('chariot', 'red');
        api.placeSetupPiece(5, 0);
        api.selectSetupPiece('cannon', 'black');
        api.placeSetupPiece(4, 4);

        assert.strictEqual(api.commitPositionSetup(), true);
        assert.strictEqual(api.game.setupMode, false);
        assert.deepEqual(api.game.initialBoard, api.game.board.map(r => r.slice()));
        assert.strictEqual(api.game.moveHistory.length, 0);
        assert.strictEqual(api.game.gameOver, false);
        assert.deepEqual(api.game.board[9][3], { type: 'king', color: 'red' });
        assert.deepEqual(api.game.board[0][4], { type: 'king', color: 'black' });
        assert.deepEqual(api.game.board[5][0], { type: 'chariot', color: 'red' });
    });

    it('cancel restores the board and history from before setup', () => {
        setBoard(api, [[9, 4, 'king', 'red'], [0, 4, 'king', 'black'], [9, 0, 'chariot', 'red']]);
        api.makeMove(9, 0, 9, 1);
        assert.strictEqual(api.game.moveHistory.length, 1);

        api.startPositionSetup();
        api.selectSetupPiece('chariot', 'red');
        api.placeSetupPiece(5, 5);
        api.cancelPositionSetup();

        assert.strictEqual(api.game.setupMode, false);
        assert.strictEqual(api.game.moveHistory.length, 1);
        assert.deepEqual(api.game.board[9][4], { type: 'king', color: 'red' });
        assert.deepEqual(api.game.board[9][1], { type: 'chariot', color: 'red' });
        assert.strictEqual(api.game.board[5][5], null);
    });

    it('loadSetupStandard restores the full starting position in setup mode', () => {
        setBoard(api, []);
        api.startPositionSetup();
        api.loadSetupStandard();
        assert.strictEqual(api.game.setupMode, true);
        let red = 0;
        let black = 0;
        for (let r = 0; r < api.BOARD_HEIGHT; r++) {
            for (let c = 0; c < api.BOARD_SIZE; c++) {
                if (api.game.board[r][c]?.color === 'red') red++;
                if (api.game.board[r][c]?.color === 'black') black++;
            }
        }
        assert.strictEqual(red, 16);
        assert.strictEqual(black, 16);
    });

    it('initBoard exits setup mode', () => {
        setBoard(api, []);
        api.startPositionSetup();
        assert.strictEqual(api.game.setupMode, true);
        api.initBoard();
        assert.strictEqual(api.game.setupMode, false);
    });
});