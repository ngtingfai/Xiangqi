const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { loadGame, setBoard, hasMove } = require('./harness');

const api = loadGame();

function moves(row, col) {
    return api.getValidMoves(row, col).map(([r, c]) => `${r},${c}`);
}

describe('initial setup', () => {
    it('places the standard beginning position', () => {
        api.initBoard();
        const g = api.game;
        assert.deepEqual(g.board[9][4], { type: 'king', color: 'red' });
        assert.deepEqual(g.board[0][4], { type: 'king', color: 'black' });
        assert.deepEqual(g.board[9][0], { type: 'chariot', color: 'red' });
        assert.deepEqual(g.board[0][8], { type: 'chariot', color: 'black' });
        assert.deepEqual(g.board[3][4], { type: 'soldier', color: 'black' });
        assert.deepEqual(g.board[6][4], { type: 'soldier', color: 'red' });

        let red = 0;
        let black = 0;
        for (let r = 0; r < api.BOARD_HEIGHT; r++) {
            for (let c = 0; c < api.BOARD_SIZE; c++) {
                if (g.board[r][c]?.color === 'red') red++;
                if (g.board[r][c]?.color === 'black') black++;
            }
        }
        assert.strictEqual(red, 16);
        assert.strictEqual(black, 16);
        assert.strictEqual(g.currentTurn, 'red');
        assert.strictEqual(g.moveHistory.length, 0);
    });

    it('red and black both have 44 legal opening moves', () => {
        api.initBoard();
        assert.strictEqual(api.getAllLegalMoves('red').length, 44);
        assert.strictEqual(api.getAllLegalMoves('black').length, 44);
    });

    it('evaluates the opening position as perfectly balanced', () => {
        api.initBoard();
        assert.strictEqual(api.evaluateBoard(), 0);
    });
});

describe('board geometry helpers', () => {
    it('checks palace boundaries', () => {
        assert.strictEqual(api.isInPalace(9, 4, 'red'), true);
        assert.strictEqual(api.isInPalace(0, 4, 'black'), true);
        assert.strictEqual(api.isInPalace(5, 4, 'red'), false);
        assert.strictEqual(api.isInPalace(9, 2, 'red'), false);
        assert.strictEqual(api.isInPalace(3, 5, 'black'), false);
    });

    it('checks river crossing', () => {
        assert.strictEqual(api.isAcrossRiver(4, 'red'), true);
        assert.strictEqual(api.isAcrossRiver(5, 'red'), false);
        assert.strictEqual(api.isAcrossRiver(5, 'black'), true);
        assert.strictEqual(api.isAcrossRiver(4, 'black'), false);
    });

    it('board flip transforms mirror and round-trip', () => {
        api.game.isFlipped = true;
        assert.deepEqual(api.boardToScreen(0, 0), [9, 8]);
        assert.deepEqual(api.boardToScreen(9, 8), [0, 0]);
        assert.deepEqual(api.boardToScreen(5, 4), [4, 4]);
        assert.deepEqual(api.screenToBoard(0, 0), [9, 8]);
        for (let r = 0; r < api.BOARD_HEIGHT; r++) {
            for (let c = 0; c < api.BOARD_SIZE; c++) {
                assert.deepEqual(api.screenToBoard(...api.boardToScreen(r, c)), [r, c]);
            }
        }
        api.game.isFlipped = false;
        assert.deepEqual(api.boardToScreen(2, 3), [2, 3]);
    });
});

describe('piece movement rules', () => {
    it('soldier: forward only before river, lateral after', () => {
        setBoard(api, [[6, 4, 'soldier', 'red']]);
        assert.deepEqual(moves(6, 4), ['5,4']);
        setBoard(api, [[4, 4, 'soldier', 'red']]);
        assert.deepEqual(moves(4, 4), ['3,4', '4,3', '4,5']);
        setBoard(api, [[5, 4, 'soldier', 'black']]);
        assert.deepEqual(moves(5, 4), ['6,4', '5,3', '5,5']);
        setBoard(api, [[1, 4, 'soldier', 'red']]);
        const m = moves(1, 4);
        assert.ok(m.includes('0,4'));
        assert.ok(!m.includes('2,4'));
    });

    it('soldier: friendly piece blocks forward move', () => {
        setBoard(api, [[6, 4, 'soldier', 'red'], [5, 4, 'soldier', 'red']]);
        assert.deepEqual(moves(6, 4), []);
    });

    it('cannon: captures only over exactly one screen', () => {
        setBoard(api, [[5, 1, 'cannon', 'red'], [3, 1, 'soldier', 'red'], [1, 1, 'soldier', 'black']]);
        const m = moves(5, 1);
        assert.ok(m.includes('1,1'), 'capture over one screen');
        assert.ok(!m.includes('2,1'), 'screen square not a move');
        assert.ok(!m.includes('0,1'), 'nothing beyond a single screen');
        assert.ok(m.includes('4,1'), 'slide before the screen');
    });

    it('cannon: no screen means no capture', () => {
        setBoard(api, [[5, 1, 'cannon', 'red'], [1, 1, 'soldier', 'black']]);
        const m = moves(5, 1);
        assert.ok(m.includes('2,1'));
        assert.ok(!m.includes('1,1'), 'cannot capture without screen');
        assert.ok(!m.includes('0,1'));
    });

    it('horse: blocked by adjacent leg piece', () => {
        setBoard(api, [[5, 5, 'horse', 'red'], [4, 5, 'soldier', 'red']]);
        assert.deepEqual(moves(5, 5), ['7,4', '7,6', '4,3', '4,7', '6,3', '6,7']);
    });

    it('elephant: cannot cross river and is blocked by the elephant eye', () => {
        setBoard(api, [[5, 2, 'elephant', 'red']]);
        assert.deepEqual(moves(5, 2), ['7,0', '7,4']);
        setBoard(api, [[5, 2, 'elephant', 'red'], [7, 4, 'soldier', 'red']]);
        assert.deepEqual(moves(5, 2), ['7,0']);
        setBoard(api, [[5, 2, 'elephant', 'red'], [6, 3, 'soldier', 'red']]);
        assert.deepEqual(moves(5, 2), ['7,0']);
        setBoard(api, [[5, 2, 'elephant', 'black']]);
        assert.deepEqual(moves(5, 2), ['3,0', '3,4']);
    });

    it('chariot: slides until blocked, captures first enemy', () => {
        setBoard(api, [[5, 4, 'chariot', 'red'], [3, 4, 'soldier', 'red'], [1, 4, 'soldier', 'black']]);
        const m = moves(5, 4);
        assert.ok(m.includes('4,4'));
        assert.ok(m.includes('9,4'));
        assert.ok(m.includes('5,0'));
        assert.ok(m.includes('5,8'));
        assert.ok(!m.includes('3,4'), 'own piece blocks');
        assert.ok(!m.includes('1,4'), 'cannot pass own piece');
    });

    it('king: 1 step orthogonally, palace only', () => {
        setBoard(api, [[8, 3, 'king', 'red']]);
        assert.deepEqual(moves(8, 3), ['7,3', '9,3', '8,4']);
    });

    it('advisor: diagonal 1 step, palace only', () => {
        setBoard(api, [[8, 4, 'advisor', 'red']]);
        assert.deepEqual(moves(8, 4), ['7,3', '7,5', '9,3', '9,5']);
    });
});

describe('check and legal-move filtering', () => {
    it('blocks moves that would leave the kings facing', () => {
        setBoard(api, [[9, 4, 'king', 'red'], [0, 4, 'king', 'black'], [4, 4, 'soldier', 'red']]);
        assert.strictEqual(api.isKingsFacing(), false);
        const legal = api.getAllLegalMoves('red');
        assert.strictEqual(legal.length, 4);
        assert.ok(hasMove(legal, 4, 4, 3, 4));
        assert.ok(!hasMove(legal, 4, 4, 4, 3), 'lateral move exposes facing');
        assert.ok(!hasMove(legal, 4, 4, 4, 5), 'lateral move exposes facing');
        assert.ok(hasMove(legal, 9, 4, 8, 4));
        assert.ok(hasMove(legal, 9, 4, 9, 3));

        api.game.board[4][4] = null;
        assert.strictEqual(api.isKingsFacing(), true);
        const facingLegal = api.getAllLegalMoves('red');
        assert.strictEqual(facingLegal.length, 2);
        assert.ok(hasMove(facingLegal, 9, 4, 9, 3), 'king sidestep resolves facing');
        assert.ok(hasMove(facingLegal, 9, 4, 9, 5), 'king sidestep resolves facing');
        assert.ok(!hasMove(facingLegal, 9, 4, 8, 4), 'staying on the column keeps facing');
    });

    it('detects check on an open file and blocking', () => {
        setBoard(api, [[9, 4, 'king', 'red'], [0, 4, 'chariot', 'black']]);
        assert.strictEqual(api.isInCheck('red'), true);
        api.game.board[5][4] = { type: 'soldier', color: 'red' };
        assert.strictEqual(api.isInCheck('red'), false);
    });

    it('detects check by a horse', () => {
        setBoard(api, [[9, 3, 'king', 'red'], [7, 2, 'horse', 'black']]);
        assert.strictEqual(api.isInCheck('red'), true);
    });

    it('pinned piece cannot leave the king file but may capture the pinner', () => {
        setBoard(api, [[9, 4, 'king', 'red'], [0, 4, 'chariot', 'black'], [5, 4, 'chariot', 'red']]);
        assert.strictEqual(api.isInCheck('red'), false);
        const legal = api.getAllLegalMoves('red');
        assert.ok(hasMove(legal, 5, 4, 0, 4), 'capture the pinner');
        assert.ok(hasMove(legal, 5, 4, 8, 4), 'stay on the file');
        assert.ok(!hasMove(legal, 5, 4, 5, 3), 'leaving file exposes check');
        assert.ok(!hasMove(legal, 5, 4, 5, 5), 'leaving file exposes check');
    });
});

describe('move execution and undo', () => {
    it('makeMove records captures, undoMove restores everything', () => {
        setBoard(api, [
            [5, 4, 'chariot', 'red'],
            [5, 8, 'soldier', 'black'],
            [9, 4, 'king', 'red'],
            [0, 4, 'king', 'black']
        ]);
        api.makeMove(5, 4, 5, 8);
        assert.strictEqual(api.game.capturedPieces.black.length, 1);
        assert.strictEqual(api.game.moveHistory.length, 1);
        assert.strictEqual(api.game.board[5][8].type, 'chariot');
        assert.strictEqual(api.game.board[5][4], null);
        assert.strictEqual(api.game.currentTurn, 'black');

        api.undoMove();
        assert.strictEqual(api.game.capturedPieces.black.length, 0);
        assert.strictEqual(api.game.moveHistory.length, 0);
        assert.strictEqual(api.game.board[5][4].type, 'chariot');
        assert.strictEqual(api.game.board[5][8].type, 'soldier');
        assert.strictEqual(api.game.currentTurn, 'red');
    });
});

describe('end of game', () => {
    it('checkmate: study 1 chariot to (5,3) is mate', () => {
        setBoard(api, [[9, 4, 'king', 'red'], [0, 3, 'king', 'black'], [5, 0, 'chariot', 'red']]);
        api.game.currentTurn = 'red';
        const legal = api.getAllLegalMoves('red');
        assert.ok(hasMove(legal, 5, 0, 5, 3));

        api.makeMove(5, 0, 5, 3);
        assert.strictEqual(api.isInCheck('black'), true);
        assert.strictEqual(api.getAllLegalMoves('black').length, 0);
        api.checkForCheckmate();
        assert.strictEqual(api.game.gameOver, true);
    });

    it('stalemate counts as a loss for the stalemated side', () => {
        setBoard(api, [
            [9, 0, 'king', 'red'],
            [0, 4, 'king', 'black'],
            [2, 3, 'cannon', 'red'], [1, 3, 'soldier', 'red'],
            [4, 5, 'cannon', 'red'], [3, 5, 'soldier', 'red'],
            [2, 6, 'horse', 'red']
        ]);
        api.game.currentTurn = 'black';
        assert.strictEqual(api.isInCheck('black'), false);
        assert.strictEqual(api.getAllLegalMoves('black').length, 0);
        api.checkForCheckmate();
        assert.strictEqual(api.game.gameOver, true);
    });

    it('a king with legal moves does not end the game', () => {
        setBoard(api, [[9, 0, 'king', 'red'], [0, 4, 'king', 'black']]);
        api.game.currentTurn = 'black';
        assert.strictEqual(api.getAllLegalMoves('black').length, 3);
        api.checkForCheckmate();
        assert.strictEqual(api.game.gameOver, false);
    });
});

describe('evaluation', () => {
    it('tracks material balance', () => {
        api.initBoard();
        assert.strictEqual(api.evaluateBoard(), 0);
        api.game.board[6][0] = null;
        assert.strictEqual(api.evaluateBoard(), -10);
        api.game.board[3][8] = null;
        assert.strictEqual(api.evaluateBoard(), 0);
    });

    it('values a crossed river soldier higher', () => {
        setBoard(api, [[4, 4, 'soldier', 'red'], [9, 4, 'king', 'red'], [0, 4, 'king', 'black']]);
        const across = api.evaluateBoard();
        setBoard(api, [[6, 4, 'soldier', 'red'], [9, 4, 'king', 'red'], [0, 4, 'king', 'black']]);
        const ownSide = api.evaluateBoard();
        assert.ok(across > ownSide, `${across} should exceed ${ownSide}`);
    });
});

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
});