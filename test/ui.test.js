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