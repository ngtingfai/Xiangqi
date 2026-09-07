const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { loadGame, setBoard } = require('./harness');

const api = loadGame();

describe('evaluation bar', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [5, 0, 'chariot', 'red'],
            [5, 1, 'horse', 'black']
        ]);
    });

    it('centers the bar at the balanced start position', () => {
        api.initBoard();
        api.updateUI();
        assert.strictEqual(api.__elements['eval-red-fill'].style.height, '50%');
        assert.strictEqual(api.__elements['eval-black-fill'].style.height, '50%');
        assert.strictEqual(api.__elements['eval-bar'].dataset.eval, '0');
    });

    it('reflects red material advantage after updateUI', () => {
        assert.strictEqual(api.evaluateBoard(), 50);
        api.updateUI();
        assert.strictEqual(api.__elements['eval-red-fill'].style.height, '75%');
        assert.strictEqual(api.__elements['eval-black-fill'].style.height, '25%');
    });

    it('recomputes the bar when a capture changes the evaluation', () => {
        api.updateUI();
        assert.strictEqual(api.__elements['eval-red-fill'].style.height, '75%');

        api.makeMove(5, 0, 5, 1);
        assert.strictEqual(api.evaluateBoard(), 90);
        api.updateUI();
        assert.strictEqual(api.__elements['eval-red-fill'].style.height, '95%');
        assert.strictEqual(api.__elements['eval-black-fill'].style.height, '5%');
    });

    it('updates when restoring an earlier move from the table', () => {
        api.makeMove(5, 0, 5, 1);
        api.updateUI();
        assert.strictEqual(api.__elements['eval-red-fill'].style.height, '95%');

        api.restorePosition(-1);
        assert.ok(api.__elements['eval-red-fill'].style.height.indexOf('75') === 0);
        assert.strictEqual(api.__elements['eval-black-fill'].style.height, '25%');
    });

    it('clamps the bar within the eval range', () => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [5, 0, 'chariot', 'red'],
            [6, 0, 'chariot', 'red'],
            [7, 0, 'chariot', 'red'],
            [8, 0, 'chariot', 'red'],
            [5, 1, 'horse', 'black']
        ]);
        assert.ok(api.evaluateBoard() > api.EVAL_RANGE);
        api.updateUI();
        assert.strictEqual(api.__elements['eval-red-fill'].style.height, '100%');
        assert.strictEqual(api.__elements['eval-black-fill'].style.height, '0%');
    });
});

describe('music toggle', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black']
        ]);
    });

    it('starts with music off', () => {
        assert.strictEqual(api.game.musicOn, false);
        assert.strictEqual(api.__elements['music-btn'].textContent, 'Music: Off');
    });

    it('turns music on and labels the button', () => {
        api.__elements['music-btn'].click();
        assert.strictEqual(api.game.musicOn, true);
        assert.strictEqual(api.__elements['music-btn'].textContent, 'Music: On');
        assert.strictEqual(api.__elements['music-btn'].className, 'music-active');
    });

    it('toggles music back off', () => {
        api.__elements['music-btn'].click();
        api.__elements['music-btn'].click();
        assert.strictEqual(api.game.musicOn, false);
        assert.strictEqual(api.__elements['music-btn'].textContent, 'Music: Off');
        assert.strictEqual(api.__elements['music-btn'].className, '');
    });

    it('does not enable music when interacting with the board', () => {
        api.__elements['board'].click();
        assert.strictEqual(api.game.musicOn, false);
        assert.strictEqual(api.__elements['music-btn'].textContent, 'Music: Off');
    });

    it('keeps music off after the user toggles it off and plays a move', () => {
        api.__elements['music-btn'].click();
        api.__elements['music-btn'].click();
        assert.strictEqual(api.game.musicOn, false);
        api.__elements['board'].click();
        assert.strictEqual(api.game.musicOn, false);
    });
});

describe('endgame examples toggle', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black']
        ]);
    });

    it('reveals the panel on click and hides it on a second click', () => {
        assert.ok(api.__elements['examples-panel'].className.includes('hidden'));
        api.__elements['examples-btn'].click();
        assert.ok(!api.__elements['examples-panel'].className.includes('hidden'));
        api.__elements['examples-btn'].click();
        assert.ok(api.__elements['examples-panel'].className.includes('hidden'));
    });

    it('closes the examples panel when setup is opened', () => {
        api.__elements['examples-btn'].click();
        api.__elements['setup-btn'].click();
        assert.ok(api.__elements['examples-panel'].className.includes('hidden'));
        assert.ok(!api.__elements['setup-panel'].className.includes('hidden'));
        assert.strictEqual(api.game.setupMode, true);
    });

    it('exits setup mode when the examples panel is opened', () => {
        api.__elements['setup-btn'].click();
        assert.strictEqual(api.game.setupMode, true);
        api.__elements['examples-btn'].click();
        assert.strictEqual(api.game.setupMode, false);
        assert.ok(!api.__elements['examples-panel'].className.includes('hidden'));
    });
});

describe('mode switching', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [5, 0, 'chariot', 'red']
        ]);
        api.game.redController = 'human';
        api.game.blackController = 'ai';
        api.__elements['mode-hr-cb'].className = 'active';
        api.__elements['mode-cr-hb'].className = '';
        api.__elements['mode-hr-hb'].className = '';
        api.__elements['mode-cr-cb'].className = '';
    });

    it('starts with Human Red vs Computer Black as the default mode', () => {
        assert.strictEqual(api.game.redController, 'human');
        assert.strictEqual(api.game.blackController, 'ai');
        assert.ok(api.__elements['mode-hr-cb'].className.includes('active'));
    });

    it('Human Red vs Human Black clears both sides without resetting the position', () => {
        api.__elements['mode-hr-hb'].click();
        assert.strictEqual(api.game.redController, 'human');
        assert.strictEqual(api.game.blackController, 'human');
        assert.strictEqual(api.game.board[5][0].type, 'chariot');
        assert.ok(api.__elements['mode-hr-hb'].className.includes('active'));
        assert.ok(!api.__elements['mode-hr-cb'].className.includes('active'));
    });

    it('Computer Red vs Human Black makes Red the AI side and flips for Black', () => {
        api.game.aiThinking = true;
        api.__elements['mode-cr-hb'].click();
        assert.strictEqual(api.game.redController, 'ai');
        assert.strictEqual(api.game.blackController, 'human');
        assert.strictEqual(api.game.isFlipped, true);
        assert.strictEqual(api.game.board[5][0].type, 'chariot');
        assert.ok(api.__elements['board-container'].classList.contains('flipped'));
        assert.ok(api.__elements['mode-cr-hb'].className.includes('active'));
    });

    it('flip button swaps the board-container flipped class', () => {
        api.__elements['flip-board-btn'].click();
        assert.strictEqual(api.game.isFlipped, true);
        assert.ok(api.__elements['board-container'].classList.contains('flipped'));
        api.__elements['flip-board-btn'].click();
        assert.strictEqual(api.game.isFlipped, false);
        assert.ok(!api.__elements['board-container'].classList.contains('flipped'));
    });

    it('Computer Red vs Computer Black sets both sides to AI', () => {
        api.game.aiThinking = true;
        api.__elements['mode-cr-cb'].click();
        assert.strictEqual(api.game.redController, 'ai');
        assert.strictEqual(api.game.blackController, 'ai');
    });

    it('leaves an in-progress setup untouched when switching modes', () => {
        api.__elements['setup-btn'].click();
        assert.strictEqual(api.game.setupMode, true);
        api.game.board[5][0] = { type: 'cannon', color: 'black' };
        api.__elements['mode-hr-hb'].click();
        assert.strictEqual(api.game.redController, 'human');
        assert.strictEqual(api.game.blackController, 'human');
        assert.strictEqual(api.game.setupMode, true);
        assert.strictEqual(api.game.board[5][0].type, 'cannon');
        assert.ok(!api.__elements['setup-panel'].className.includes('hidden'));
    });
});

describe('launch options', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [5, 0, 'chariot', 'red']
        ]);
        api.__elements['setup-btn'].className = '';
        api.__elements['examples-btn'].className = '';
    });

    it('Standard Game starts a standard position and closes any open launch panel', () => {
        api.__elements['examples-btn'].click();
        api.__elements['standard-btn'].click();
        assert.ok(api.__elements['examples-panel'].className.includes('hidden'));
        assert.ok(api.__elements['setup-panel'].className.includes('hidden'));
        assert.ok(!api.__elements['setup-btn'].className.includes('active'));
        assert.ok(!api.__elements['examples-btn'].className.includes('active'));
        assert.strictEqual(api.game.board[0][0].type, 'chariot');
        assert.strictEqual(api.game.board[0][0].color, 'black');
        assert.strictEqual(api.game.board[9][8].type, 'chariot');
        assert.strictEqual(api.game.moveHistory.length, 0);
    });

    it('Bespoke Setup and Endgame Examples are mutually exclusive highlights', () => {
        api.__elements['examples-btn'].click();
        assert.ok(api.__elements['examples-btn'].className.includes('active'));
        api.__elements['setup-btn'].click();
        assert.strictEqual(api.game.setupMode, true);
        assert.ok(api.__elements['setup-btn'].className.includes('active'));
        assert.ok(!api.__elements['examples-btn'].className.includes('active'));
        assert.ok(api.__elements['examples-panel'].className.includes('hidden'));
        assert.ok(!api.__elements['setup-panel'].className.includes('hidden'));
    });

    it('clicking an active launch option again closes it', () => {
        api.__elements['setup-btn'].click();
        assert.strictEqual(api.game.setupMode, true);
        api.__elements['setup-btn'].click();
        assert.strictEqual(api.game.setupMode, false);
        assert.ok(api.__elements['setup-panel'].className.includes('hidden'));
        assert.ok(!api.__elements['setup-btn'].className.includes('active'));
    });

    it('setup-cancel clears the Bespoke Setup highlight', () => {
        api.__elements['setup-btn'].click();
        api.__elements['setup-cancel-btn'].click();
        assert.strictEqual(api.game.setupMode, false);
        assert.ok(api.__elements['setup-panel'].className.includes('hidden'));
        assert.ok(!api.__elements['setup-btn'].className.includes('active'));
    });
});

describe('move timing', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [9, 0, 'chariot', 'red']
        ]);
    });

    it('records the elapsed milliseconds on each move', () => {
        api.game.moveStartTime = Date.now() - 5000;
        api.makeMove(9, 0, 9, 1);
        assert.strictEqual(api.game.moveHistory.length, 1);
        assert.ok(Number.isFinite(api.game.moveHistory[0].timeMs));
        assert.ok(api.game.moveHistory[0].timeMs >= 5000);
    });

    it('resets the move clock after the move is made', () => {
        api.game.moveStartTime = Date.now() - 10000;
        api.makeMove(9, 0, 9, 1);
        assert.ok(api.game.moveStartTime > Date.now() - 1000);
    });

    it('renders the elapsed time next to each move in the notation table', () => {
        api.game.moveStartTime = Date.now() - 15000;
        api.makeMove(9, 0, 9, 1);
        api.updateUI();
        const html = api.__elements['notation-body'].innerHTML;
        assert.ok(html.includes('class="move-time">15.0s'));
    });
});

describe('game over review', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 3, 'king', 'black'],
            [5, 0, 'chariot', 'red']
        ]);
    });

    it('Game Review closes the overlay and keeps the finished position for study', () => {
        api.makeMove(5, 0, 5, 3);
        api.checkForCheckmate();
        assert.strictEqual(api.game.gameOver, true);
        assert.ok(!api.__elements['game-over-overlay'].className.includes('hidden'));
        assert.strictEqual(api.__elements['game-over-title'].textContent, 'Checkmate!');

        api.__elements['game-over-review-btn'].click();
        assert.ok(api.__elements['game-over-overlay'].className.includes('hidden'));
        assert.strictEqual(api.game.gameOver, true);
        assert.strictEqual(api.game.moveHistory.length, 1);
        assert.strictEqual(api.game.board[5][3].type, 'chariot');
        assert.strictEqual(api.game.board[0][3].type, 'king');
    });

    it('Play Again resets to a fresh game after review', () => {
        api.makeMove(5, 0, 5, 3);
        api.checkForCheckmate();
        api.__elements['game-over-review-btn'].click();
        api.__elements['game-over-btn'].click();
        assert.strictEqual(api.game.moveHistory.length, 0);
        assert.strictEqual(api.game.board[9][4].type, 'king');
        assert.strictEqual(api.game.board[9][0].type, 'chariot');
    });
});

describe('captured trays', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [5, 0, 'soldier', 'red'],
            [4, 0, 'horse', 'black']
        ]);
    });

    it('Red tray shows the black pieces red captured, Black tray shows the red pieces black captured', () => {
        api.makeMove(5, 0, 4, 0);
        api.updateUI();
        const redHtml = api.__elements['red-captured-list'].innerHTML;
        const blackHtml = api.__elements['black-captured-list'].innerHTML;
        assert.ok(redHtml.includes('馬'));
        assert.ok(redHtml.includes('captured-piece black'));
        assert.strictEqual(blackHtml, '');
    });

    it('each captured piece renders in its own color', () => {
        api.game.board[2][0] = { type: 'chariot', color: 'black' };
        api.game.board[2][1] = { type: 'soldier', color: 'red' };
        api.makeMove(5, 0, 4, 0);
        api.makeMove(2, 0, 2, 1);
        api.updateUI();
        assert.ok(api.__elements['red-captured-list'].innerHTML.includes('captured-piece black'));
        assert.ok(api.__elements['black-captured-list'].innerHTML.includes('兵'));
        assert.ok(api.__elements['black-captured-list'].innerHTML.includes('captured-piece red'));
    });
});