const ENDGAME_EXAMPLES = [
    {
        name: "Basic Checkmate",
        description: "Red to move. Play the Chariot to the same column as the Black King to deliver checkmate. The Red King controls the escape squares via the 'flying general' rule.",
        setup: (board) => {
            board[0][3] = { type: 'king', color: 'black' };
            board[9][4] = { type: 'king', color: 'red' };
            board[5][0] = { type: 'chariot', color: 'red' };
            return board;
        }
    },
    {
        name: "Chariot & Horse Mate",
        description: "Red to move. Coordinate the Chariot and Horse for a classic checkmate pattern.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[1][3] = { type: 'chariot', color: 'red' };
            board[2][2] = { type: 'horse', color: 'red' };
            return board;
        }
    },
    {
        name: "Cannon Mate",
        description: "Red to move. Use the Cannon with a platform to checkmate the Black King.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[3][4] = { type: 'cannon', color: 'red' };
            board[5][4] = { type: 'soldier', color: 'red' };
            return board;
        }
    },
    {
        name: "Double Cannon",
        description: "Red to move. Two Cannons can create a powerful mating net.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[2][4] = { type: 'cannon', color: 'red' };
            board[4][4] = { type: 'cannon', color: 'red' };
            return board;
        }
    },
    {
        name: "Horse & Cannon",
        description: "Red to move. The Horse and Cannon combination is one of the most powerful attacking pairs.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[1][3] = { type: 'horse', color: 'red' };
            board[3][4] = { type: 'cannon', color: 'red' };
            return board;
        }
    },
    {
        name: "Chariot Mate",
        description: "Red to move. A lone Chariot can checkmate with proper positioning.",
        setup: (board) => {
            board[0][4] = { type: 'king', color: 'black' };
            board[9][3] = { type: 'king', color: 'red' };
            board[0][0] = { type: 'chariot', color: 'red' };
            board[2][5] = { type: 'advisor', color: 'black' };
            return board;
        }
    }
];