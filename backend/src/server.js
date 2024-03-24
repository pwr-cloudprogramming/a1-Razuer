const express = require("express");
const http = require("http");
const { platform } = require("os");
const socketIo = require("socket.io");

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameData = {
    board: ["", "", "", "", "", "", "", "", ""],
    currentPlayer: "X",
    winner: null,
    gameOver: false
};

playerNum = 0;
nextPlayerRole = "X";
const playerList = new Map();

io.on("connection", (socket) => {
    if (playerList.size < 2) {
        console.log("Player connected! Socket: " + socket.id);
        playerNum++;
        console.log("Number of players: ", playerNum)
        socket.emit("playerRole", nextPlayerRole)
        playerList.set(socket.id, nextPlayerRole)

        nextPlayerRole = nextPlayerRole === "X" ? "O" : "X";

        if (playerNum == 1) {
            socket.emit("waiting");
        }
        if (playerNum == 2) {
            io.sockets.emit("gameState", gameData);
        }
    }
    else {
        console.log("Observer connected! Socket: " + socket.id);
        socket.emit("observe")
        socket.emit("gameState", gameData)
    }

    socket.on("disconnect", () => {
        if(playerList.has(socket.id)) {
            nextPlayerRole = playerList.get(socket.id);
            console.log("Player " + nextPlayerRole + " disconnected!");
            playerNum--;
            console.log("Number of players: ", playerNum)
            playerList.delete(socket.id)
        }
        else {
            console.log("Observer " + socket.id + " disconnected!");
        }
    });

    socket.on("makeMove", (index) => {
        if (!gameData.gameOver && gameData.board[index] === "" && playerList.has(socket.id)) {
            gameData.board[index] = gameData.currentPlayer;
            if (checkForWinner()) {
                gameData.gameOver = true;
                gameData.winner = gameData.currentPlayer;
            } else if (!gameData.board.includes("")) {
                gameData.gameOver = true;
            } else {
                gameData.currentPlayer =
                    gameData.currentPlayer === "X" ? "O" : "X";
            }
            io.emit("gameState", gameData);
        }
    });

    socket.on("resetGame", () => {
        resetGame();
        io.emit("gameState", gameData);
    });
});

function checkForWinner() {
    const { board } = gameData;
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

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] !== "" && board[a] === board[b] && board[b] === board[c]) {
            return true;
        }
    }

    return false;
}

function resetGame() {
    gameData = {
        board: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: "X",
        winner: null,
        gameOver: false,
    };
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
