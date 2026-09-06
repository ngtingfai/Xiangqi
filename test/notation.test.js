const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { loadGame, setBoard } = require('./harness');

const api = loadGame();

describe('notation', () => {
    it('WXF encodes file-then-rank for source and destination', () => {
        assert.strictEqual(api.toWXFMove(7, 1, 7, 4), '1747');
        assert.strictEqual(api.toWXFMove(9, 0, 5, 0), '0905');
        assert.strictEqual(api.toWXFMove(9, 8, 9, 7), '8979');
    });

    it('renders traditional Chinese notation', () => {
        setBoard(api, []);
        const rCannon = { type: 'cannon', color: 'red' };
        const rHorse = { type: 'horse', color: 'red' };
        const rChariot = { type: 'chariot', color: 'red' };
        const rSoldier = { type: 'soldier', color: 'red' };
        const rKing = { type: 'king', color: 'red' };
        const rAdvisor = { type: 'advisor', color: 'red' };
        const bSoldier = { type: 'soldier', color: 'black' };
        const bKing = { type: 'king', color: 'black' };
        const bAdvisor = { type: 'advisor', color: 'black' };

        assert.strictEqual(api.toChineseMove(7, 1, 7, 4, rCannon), '炮八平五');
        assert.strictEqual(api.toChineseMove(9, 1, 7, 2, rHorse), '傌八進七');
        assert.strictEqual(api.toChineseMove(9, 0, 5, 0, rChariot), '俥九進四');
        assert.strictEqual(api.toChineseMove(9, 8, 9, 7, rChariot), '俥一平二');
        assert.strictEqual(api.toChineseMove(6, 4, 5, 4, rSoldier), '兵五進一');
        assert.strictEqual(api.toChineseMove(5, 4, 5, 3, rSoldier), '兵五平六');
        assert.strictEqual(api.toChineseMove(5, 4, 5, 5, rSoldier), '兵五平四');
        assert.strictEqual(api.toChineseMove(9, 4, 8, 4, rKing), '帥五進一');
        assert.strictEqual(api.toChineseMove(8, 4, 9, 4, rKing), '帥五退一');
        assert.strictEqual(api.toChineseMove(9, 3, 8, 4, rAdvisor), '仕六進五');
        assert.strictEqual(api.toChineseMove(7, 2, 9, 1, rHorse), '傌七退八');

        assert.strictEqual(api.toChineseMove(3, 4, 4, 4, bSoldier), '卒五進一');
        assert.strictEqual(api.toChineseMove(0, 4, 1, 4, bKing), '將五進一');
        assert.strictEqual(api.toChineseMove(0, 3, 1, 4, bAdvisor), '士四進五');
    });

    it('disambiguates identical pieces on the same file with 前/後', () => {
        setBoard(api, [
            [5, 0, 'chariot', 'red'],
            [9, 0, 'chariot', 'red'],
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black']
        ]);
        const rChariot = { type: 'chariot', color: 'red' };
        assert.strictEqual(api.toChineseMove(5, 0, 5, 3, rChariot), '前俥平六');
        assert.strictEqual(api.toChineseMove(9, 0, 9, 3, rChariot), '後俥平六');
    });

    it('formatMove and the history list respect the notation toggle', () => {
        setBoard(api, [[9, 0, 'chariot', 'red'], [9, 4, 'king', 'red'], [0, 4, 'king', 'black']]);
        api.game.notation = 'chinese';
        api.makeMove(9, 0, 9, 1);
        const move = api.game.moveHistory[0];
        assert.strictEqual(api.formatMove(move), '俥九平八');

        api.game.notation = 'wxf';
        assert.strictEqual(api.formatMove(move), '俥 0919');

        api.updateUI();
        assert.ok(api.__elements['notation-body'].innerHTML.includes('俥 0919'));

        api.game.notation = 'chinese';
        api.updateUI();
        assert.ok(api.__elements['notation-body'].innerHTML.includes('俥九平八'));

        const btn = api.__elements['notation-btn'];
        btn.click();
        assert.strictEqual(api.game.notation, 'wxf');
        assert.strictEqual(btn.textContent, 'Notation: WXF');
        btn.click();
        assert.strictEqual(api.game.notation, 'chinese');
        assert.strictEqual(btn.textContent, 'Notation: 中文');
    });
});

describe('restorePosition', () => {
    beforeEach(() => {
        setBoard(api, [
            [9, 0, 'chariot', 'red'],
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black']
        ]);
    });

    it('replays history to restore an earlier board state and turn', () => {
        api.makeMove(9, 0, 9, 1);
        api.makeMove(0, 4, 0, 3);
        api.makeMove(9, 1, 8, 1);

        api.restorePosition(1);
        assert.deepEqual(api.game.board[9][1], { type: 'chariot', color: 'red' });
        assert.strictEqual(api.game.board[9][0], null);
        assert.deepEqual(api.game.board[0][3], { type: 'king', color: 'black' });
        assert.strictEqual(api.game.board[0][4], null);
        assert.strictEqual(api.game.currentTurn, 'red');
        assert.strictEqual(api.game.historyIndex, 1);
    });

    it('restores the initial position with index -1', () => {
        api.makeMove(9, 0, 9, 1);
        api.makeMove(0, 4, 0, 3);

        api.restorePosition(-1);
        assert.deepEqual(api.game.board[9][0], { type: 'chariot', color: 'red' });
        assert.deepEqual(api.game.board[0][4], { type: 'king', color: 'black' });
        assert.strictEqual(api.game.currentTurn, 'red');
        assert.strictEqual(api.game.historyIndex, -1);
        assert.deepEqual(api.game.capturedPieces, { red: [], black: [] });
    });

    it('recomputes captured pieces from the restored history', () => {
        setBoard(api, [
            [9, 0, 'chariot', 'red'],
            [9, 1, 'horse', 'black'],
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black']
        ]);
        api.makeMove(9, 0, 9, 1);
        assert.deepEqual(api.game.capturedPieces.red, []);
        assert.deepEqual(api.game.capturedPieces.black, [{ type: 'horse', color: 'black' }]);

        api.restorePosition(0);
        assert.deepEqual(api.game.board[9][1], { type: 'chariot', color: 'red' });
        assert.deepEqual(api.game.capturedPieces.black, [{ type: 'horse', color: 'black' }]);

        api.restorePosition(-1);
        assert.deepEqual(api.game.board[9][1], { type: 'horse', color: 'black' });
        assert.deepEqual(api.game.capturedPieces, { red: [], black: [] });
    });

    it('making a move after restoring truncates the later history', () => {
        api.makeMove(9, 0, 9, 1);
        api.makeMove(0, 4, 0, 3);
        api.makeMove(9, 1, 8, 1);
        assert.strictEqual(api.game.moveHistory.length, 3);

        api.restorePosition(0);
        api.makeMove(0, 4, 0, 5);

        assert.strictEqual(api.game.moveHistory.length, 2);
        assert.deepEqual(api.game.moveHistory[1].to, [0, 5]);
        assert.strictEqual(api.game.historyIndex, 1);
        assert.deepEqual(api.game.board[9][1], { type: 'chariot', color: 'red' });
        assert.deepEqual(api.game.board[0][5], { type: 'king', color: 'black' });
        assert.strictEqual(api.game.currentTurn, 'red');
    });

    it('renders each move as a clickable link with a current-move highlight', () => {
        api.makeMove(9, 0, 9, 1);
        api.makeMove(0, 4, 0, 3);
        api.updateUI();

        const html = api.__elements['notation-body'].innerHTML;
        assert.ok(html.includes('data-move="0"'));
        assert.ok(html.includes('data-move="1"'));
        assert.ok(html.includes('class="move-link current"'));
        assert.ok(html.includes('<tr><td>1</td><td class="red-move">'));
        assert.ok(html.includes('class="black-move">'));
    });
});