const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

canvas.width = (BOARD_SIZE - 1) * CELL_SIZE + MARGIN * 2;
canvas.height = (BOARD_HEIGHT - 1) * CELL_SIZE + MARGIN * 2;

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        const x = MARGIN + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, MARGIN);
        ctx.lineTo(x, MARGIN + (BOARD_HEIGHT - 1) * CELL_SIZE);
        ctx.stroke();
    }
    
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        const y = MARGIN + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(MARGIN, y);
        ctx.lineTo(MARGIN + (BOARD_SIZE - 1) * CELL_SIZE, y);
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 4 * CELL_SIZE, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 4 * CELL_SIZE, MARGIN + 5 * CELL_SIZE);
    ctx.lineTo(MARGIN, MARGIN + 5 * CELL_SIZE);
    ctx.moveTo(MARGIN + 5 * CELL_SIZE, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 8 * CELL_SIZE, MARGIN + 4 * CELL_SIZE);
    ctx.lineTo(MARGIN + 8 * CELL_SIZE, MARGIN + 5 * CELL_SIZE);
    ctx.lineTo(MARGIN + 5 * CELL_SIZE, MARGIN + 5 * CELL_SIZE);
    ctx.stroke();
    
    const palaceTop = [[0, 3], [0, 5], [2, 3], [2, 5]];
    const palaceBottom = [[7, 3], [7, 5], [9, 3], [9, 5]];
    
    ctx.lineWidth = 1;
    palaceTop.forEach(([r, c]) => {
        const x = MARGIN + c * CELL_SIZE;
        const y = MARGIN + r * CELL_SIZE;
        const centerX = MARGIN + 4 * CELL_SIZE;
        const centerY = MARGIN + 1 * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + (centerX - x), centerY + (centerY - y));
        ctx.stroke();
    });
    
    palaceBottom.forEach(([r, c]) => {
        const x = MARGIN + c * CELL_SIZE;
        const y = MARGIN + r * CELL_SIZE;
        const centerX = MARGIN + 4 * CELL_SIZE;
        const centerY = MARGIN + 8 * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(centerX + (centerX - x), centerY + (centerY - y));
        ctx.stroke();
    });
    
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';
    ctx.fillText('楚 河', MARGIN + 2 * CELL_SIZE, MARGIN + 4.5 * CELL_SIZE);
    ctx.fillText('漢 界', MARGIN + 6 * CELL_SIZE, MARGIN + 4.5 * CELL_SIZE);
    
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = game.board[r][c];
            if (piece) {
                drawPiece(r, c, piece);
            }
        }
    }
    
    if (game.selectedPiece) {
        const [sr, sc] = game.selectedPiece;
        const [ssr, ssc] = boardToScreen(sr, sc);
        const x = MARGIN + ssc * CELL_SIZE;
        const y = MARGIN + ssr * CELL_SIZE;
        
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.stroke();
        
        const moves = getValidMoves(sr, sc);
        moves.forEach(([mr, mc]) => {
            const [smr, smc] = boardToScreen(mr, mc);
            const mx = MARGIN + smc * CELL_SIZE;
            const my = MARGIN + smr * CELL_SIZE;
            
            ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
            ctx.beginPath();
            ctx.arc(mx, my, 25, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

function drawPiece(row, col, piece) {
    const [sr, sc] = boardToScreen(row, col);
    const x = MARGIN + sc * CELL_SIZE;
    const y = MARGIN + sr * CELL_SIZE;
    const radius = 26;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f5deb3';
    ctx.fill();
    ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
    ctx.fillText(getPieceSymbol(piece), x, y + 2);
}

function getBoardCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.round((x - MARGIN) / CELL_SIZE);
    const row = Math.round((y - MARGIN) / CELL_SIZE);
    
    if (isValidPos(row, col)) {
        return screenToBoard(row, col);
    }
    return null;
}

function showGameOver(title, message) {
    document.getElementById('game-over-title').textContent = title;
    document.getElementById('game-over-message').textContent = message;
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

function updateTurnText(extra) {
    const turnText = game.currentTurn === 'red' ? "Red's Turn" : "Black's Turn";
    document.getElementById('turn-text').textContent = extra ? turnText + ' - ' + extra : turnText;
}

function updateUI() {
    const inCheck = isInCheck(game.currentTurn);
    updateTurnText(inCheck ? 'Check!' : null);
    document.getElementById('turn-piece').textContent = game.currentTurn === 'red' ? '帥' : '將';
    document.getElementById('turn-piece').className = 'piece-indicator ' + game.currentTurn;
    
    const tableBody = document.getElementById('notation-body');
    let tableHtml = '';
    for (let i = 0; i < game.moveHistory.length; i++) {
        if (i % 2 === 0) {
            tableHtml += `<tr><td>${Math.floor(i / 2) + 1}</td>`;
        }
        const move = game.moveHistory[i];
        const currentClass = i === game.historyIndex ? ' current' : '';
        const link = `<a href="#" class="move-link${currentClass}" data-move="${i}">${formatMove(move)}</a>`;
        tableHtml += `<td class="${i % 2 === 0 ? 'red-move' : 'black-move'}">${link}</td>`;
        if (i % 2 === 1) {
            tableHtml += `</tr>`;
        }
    }
    if (game.moveHistory.length % 2 === 1) {
        tableHtml += `<td></td></tr>`;
    }
    tableBody.innerHTML = tableHtml;
    tableBody.scrollTop = tableBody.scrollHeight;
    
    document.getElementById('red-captured-list').innerHTML = game.capturedPieces.red.map(p => 
        `<span class="captured-piece red">${getPieceSymbol(p)}</span>`
    ).join('');
    
    document.getElementById('black-captured-list').innerHTML = game.capturedPieces.black.map(p => 
        `<span class="captured-piece black">${getPieceSymbol(p)}</span>`
    ).join('');

    updateEvalBar();
}

function updateEvalBar() {
    const evalValue = evaluateBoard();
    const clamped = Math.max(-EVAL_RANGE, Math.min(EVAL_RANGE, evalValue));
    const redHeight = ((EVAL_RANGE + clamped) / (2 * EVAL_RANGE)) * 100;

    const redFill = document.getElementById('eval-red-fill');
    const blackFill = document.getElementById('eval-black-fill');
    redFill.style.height = redHeight + '%';
    blackFill.style.height = (100 - redHeight) + '%';

    const bar = document.getElementById('eval-bar');
    bar.title = `Evaluation: ${evalValue}${evalValue > 0 ? ' (Red)' : evalValue < 0 ? ' (Black)' : ' (Even)'}`;
    bar.dataset.eval = String(evalValue);
}

function enableMusic() {
    const audio = document.getElementById('bg-music');
    if (typeof audio.play !== 'function') {
        game.musicOn = true;
        updateMusicButton();
        return;
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
            game.musicOn = true;
            updateMusicButton();
        }).catch(() => {
            game.musicOn = false;
            updateMusicButton();
        });
    } else {
        game.musicOn = true;
        updateMusicButton();
    }
}

function disableMusic() {
    const audio = document.getElementById('bg-music');
    if (typeof audio.pause === 'function') audio.pause();
    game.musicOn = false;
    updateMusicButton();
}

function toggleMusic() {
    if (game.musicOn) {
        disableMusic();
    } else {
        enableMusic();
    }
}

function updateMusicButton() {
    const btn = document.getElementById('music-btn');
    btn.textContent = game.musicOn ? 'Music: On' : 'Music: Off';
    btn.className = game.musicOn ? 'music-active' : '';
}