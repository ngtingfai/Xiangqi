const { describe, it } = require('node:test');
const assert = require('node:assert');
const { loadGame, setBoard } = require('./harness');

const api = loadGame();

describe('repetition rules', () => {
    function playUntilRuling(moves) {
        let endedAt = -1;
        for (let n = 0; n < moves.length; n++) {
            api.makeMove(...moves[n]);
            api.checkForCheckmate();
            if (api.game.gameOver) {
                endedAt = n + 1;
                break;
            }
        }
        return {
            endedAt,
            title: api.__elements['game-over-title'].textContent,
            message: api.__elements['game-over-message'].textContent
        };
    }

    it('perpetual check: the checking side loses', () => {
        setBoard(api, [
            [9, 3, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [0, 3, 'soldier', 'black'],
            [4, 1, 'chariot', 'red']
        ]);
        const moves = [
            [4, 1, 4, 4], [0, 4, 0, 5],
            [4, 4, 4, 5], [0, 5, 0, 4],
            [4, 5, 4, 4], [0, 4, 0, 5],
            [4, 4, 4, 5], [0, 5, 0, 4],
            [4, 5, 4, 4], [0, 4, 0, 5],
            [4, 4, 4, 5], [0, 5, 0, 4],
            [4, 5, 4, 4], [0, 4, 0, 5],
            [4, 4, 4, 5], [0, 5, 0, 4]
        ];

        const result = playUntilRuling(moves);
        assert.strictEqual(api.game.gameOver, true);
        assert.strictEqual(result.title, 'Perpetual Check!');
        assert.strictEqual(result.message, 'Black Wins!');
        assert.ok(result.endedAt >= 10, `ruling should not fire too early (fired at move ${result.endedAt})`);
        assert.ok(result.endedAt <= 16, `ruling should fire within the cycle (fired at move ${result.endedAt})`);
    });

    it('perpetual chase: the chasing side loses', () => {
        setBoard(api, [
            [9, 3, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [5, 1, 'chariot', 'red'],
            [5, 4, 'cannon', 'black']
        ]);
        const moves = [
            [5, 1, 5, 3], [5, 4, 5, 5],
            [5, 3, 5, 1], [5, 5, 5, 4],
            [5, 1, 5, 3], [5, 4, 5, 5],
            [5, 3, 5, 1], [5, 5, 5, 4],
            [5, 1, 5, 3], [5, 4, 5, 5],
            [5, 3, 5, 1], [5, 5, 5, 4],
            [5, 1, 5, 3], [5, 4, 5, 5],
            [5, 3, 5, 1], [5, 5, 5, 4]
        ];

        const result = playUntilRuling(moves);
        assert.strictEqual(api.game.gameOver, true);
        assert.strictEqual(result.title, 'Perpetual Chase!');
        assert.strictEqual(result.message, 'Black Wins!');
        assert.ok(result.endedAt >= 10, `ruling should not fire too early (fired at move ${result.endedAt})`);
        assert.ok(result.endedAt <= 16, `ruling should fire within the cycle (fired at move ${result.endedAt})`);
    });

    it('idle repetition: threefold repetition is a draw', () => {
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [4, 4, 'horse', 'red'],
            [4, 5, 'horse', 'red']
        ]);
        const moves = [];
        for (let n = 0; n < 16; n++) {
            if (n % 4 === 0) moves.push([9, 4, 9, 5]);
            if (n % 4 === 1) moves.push([0, 4, 0, 5]);
            if (n % 4 === 2) moves.push([9, 5, 9, 4]);
            if (n % 4 === 3) moves.push([0, 5, 0, 4]);
        }

        const result = playUntilRuling(moves);
        assert.strictEqual(api.game.gameOver, true);
        assert.strictEqual(result.title, 'Draw!');
        assert.strictEqual(result.message, 'Repetition - Draw');
        assert.ok(result.endedAt >= 8, `ruling should not fire too early (fired at move ${result.endedAt})`);
        assert.ok(result.endedAt <= 16, `ruling should fire within the cycle (fired at move ${result.endedAt})`);
    });

    it('a capture breaks the repetition cycle', () => {
        setBoard(api, [
            [9, 3, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [4, 2, 'chariot', 'red'],
            [4, 4, 'soldier', 'black']
        ]);
        api.game.currentTurn = 'red';

        api.makeMove(4, 2, 4, 4);
        api.checkForCheckmate();
        assert.strictEqual(api.game.gameOver, false);
        assert.strictEqual(api.game.moveHistory[0].status, 0);
        assert.strictEqual(api.game.moveHistory[0].hash.includes('.'), true);
    });

    it('an attack on a protected victim is not a chase (regression)', () => {
        // Black cannon (9,0) could capture red advisor (9,5) using red's own
        // king (9,4) as the jumping screen — a real threat, but the advisor is
        // defended (red advisor 8,4 can recapture), so it must NOT be a chase.
        setBoard(api, [
            [9, 4, 'king', 'red'],
            [8, 4, 'advisor', 'red'],
            [9, 5, 'advisor', 'red'],
            [0, 3, 'king', 'black'],
            [9, 0, 'cannon', 'black']
        ]);
        api.game.currentTurn = 'black';

        api.makeMove(0, 3, 1, 3);
        api.checkForCheckmate();
        assert.strictEqual(api.game.gameOver, false);
        assert.strictEqual(api.game.moveHistory[0].status, api.POSITION_IDLE,
            'a defended victim (recapture possible) must not count as a chase');
        assert.strictEqual(api.game.moveHistory[0].chased.length, 0);
    });

    it('mutual perpetual check (equal levels) is ruled a draw', () => {
        setBoard(api, []);
        for (let i = 0; i < 12; i++) {
            const even = i % 2 === 0;
            api.game.moveHistory.push({
                from: [0, 0],
                to: [0, even ? 1 : 0],
                piece: { type: 'king', color: even ? 'red' : 'black' },
                captured: null,
                timeMs: 0,
                hash: even ? 'sheet-red' : 'sheet-black',
                status: api.POSITION_CHECK,
                chased: []
            });
        }
        api.judgeRepetition();
        assert.strictEqual(api.game.gameOver, true);
        assert.strictEqual(api.__elements['game-over-title'].textContent, 'Draw!');
        assert.strictEqual(api.__elements['game-over-message'].textContent, 'Mutual Perpetual Check - Draw');
    });

    it('mutual perpetual chase (equal levels) is ruled a draw', () => {
        setBoard(api, []);
        for (let i = 0; i < 12; i++) {
            const even = i % 2 === 0;
            api.game.moveHistory.push({
                from: [0, 0],
                to: [0, even ? 1 : 0],
                piece: { type: 'king', color: even ? 'red' : 'black' },
                captured: null,
                timeMs: 0,
                hash: even ? 'sheet-red' : 'sheet-black',
                status: api.POSITION_CHASE,
                chased: ['5,4']
            });
        }
        api.judgeRepetition();
        assert.strictEqual(api.game.gameOver, true);
        assert.strictEqual(api.__elements['game-over-title'].textContent, 'Draw!');
        assert.strictEqual(api.__elements['game-over-message'].textContent, 'Mutual Perpetual Chase - Draw');
    });
});