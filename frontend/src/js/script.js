document.addEventListener("DOMContentLoaded", () => {
    const socket = io("http://<EC2 PUBLIC ADRESS>:8080", {
        transports: ["websocket", "polling", "flashsocket"],
    });

    const playerInfo = document.getElementById("playerInfo")
    const board = document.getElementById("board");
    const info = document.getElementById("info");
    const resetBtn = document.getElementById("resetBtn");
    let currentPlayer;
    let gameOver = false;
    let playerRole;

    const playerName = (new URLSearchParams(window.location.search)).get('playerName');

    socket.on("playerRole", playerR => {
        playerRole = playerR
        playerInfo.textContent = (playerName +", you are playing as " + playerR);
    });

    socket.on("waiting", () => {
        info.textContent = "Waiting for second player ..."
    });

    socket.on("observe", () => {
        playerInfo.textContent = "Two players already joined. You can observe the game."
        resetBtn.style.display = "None"
    });

    socket.on("gameState", (gameData) => {
        updateBoard(gameData.board);
        currentPlayer = gameData.currentPlayer;
        gameOver = gameData.gameOver;

        if (gameOver) {
            if (gameData.winner) {
                info.textContent = `Player ${gameData.winner} wins!`;
                const winningCombination = getWinningCombination(
                    gameData.board
                );
                markWinningCells(winningCombination);
            } else {
                info.textContent = "It's a draw!";
            }
        } else {
            info.textContent = `Current player: ${currentPlayer}`;
        }
    });

    board.addEventListener("click", (event) => {
        if (!gameOver && event.target.classList.contains("cell") && currentPlayer == playerRole) {
            const index = parseInt(event.target.dataset.index);
            socket.emit("makeMove", index);
        }
    });

    resetBtn.addEventListener("click", () => {
        socket.emit("resetGame");
    });

    function updateBoard(boardData) {
        board.innerHTML = "";
        boardData.forEach((cell, index) => {
            const cellElement = document.createElement("div");
            cellElement.classList.add("cell");
            cellElement.dataset.index = index;
            cellElement.textContent = cell;
            board.appendChild(cellElement);
        });
    }

    function getWinningCombination(board) {
        const winConditions = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8], // rows
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8], // columns
            [0, 4, 8],
            [2, 4, 6], // diagonals
        ];

        for (let i = 0; i < winConditions.length; i++) {
            const [a, b, c] = winConditions[i];
            if (
                board[a] !== "" &&
                board[a] === board[b] &&
                board[b] === board[c]
            ) {
                return i;
            }
        }

        return null;
    }

    function markWinningCells(combination_id) {
        if (!combination_id) return;

        const strike = document.createElement("div");
        strike.classList.add("strike");

        switch (combination_id) {
            case 0:
                strike.classList.add(`strike-row`);
                strike.classList.add(`strike-row-1`);
                break;
            case 1:
                strike.classList.add(`strike-row`);
                strike.classList.add(`strike-row-2`);
                break;
            case 2:
                strike.classList.add(`strike-row`);
                strike.classList.add(`strike-row-3`);
                break;
            case 3:
                strike.classList.add(`strike-column`);
                strike.classList.add(`strike-column-1`);
                break;
            case 4:
                strike.classList.add(`strike-column`);
                strike.classList.add(`strike-column-2`);
                break;
            case 5:
                strike.classList.add(`strike-column`);
                strike.classList.add(`strike-column-3`);
                break;
            case 6:
                strike.classList.add(`strike-column`);
                strike.classList.add(`strike-diagonal-1`);
                break;
            case 7:
                strike.classList.add(`strike-diagonal-2`);
                break;
        }
        board.append(strike);
    }
});
