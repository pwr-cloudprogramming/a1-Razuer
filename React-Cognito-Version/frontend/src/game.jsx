import React, { useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import Board from "./components/Board";
import Info from "./components/Info";
import Layout from "./components/Layout";
import "./css/style.css";

const Game = () => {
    const [playerRole, setPlayerRole] = useState("");
    const [currentPlayer, setCurrentPlayer] = useState("");
    const [gameOver, setGameOver] = useState(false);
    const [board, setBoard] = useState(Array(9).fill(""));
    const [info, setInfo] = useState("");
    const [winningCombination, setWinningCombination] = useState(-1);
    const { socket } = useSocket();

    useEffect(() => {
        const token = sessionStorage.getItem("idToken");
        if (token) {
            if (socket) {
                socket.on("playerRole", (role) => {
                    setPlayerRole(role);
                });

                socket.on("waiting", () => {
                    setInfo("Waiting for second player ...");
                });

                socket.on("observe", () => {
                    setInfo(
                        "Two players already joined. You can observe the game."
                    );
                });

                socket.on("gameState", (gameData) => {
                    setBoard(gameData.board);
                    setCurrentPlayer(gameData.currentPlayer);
                    setGameOver(gameData.gameOver);
                    setWinningCombination(gameData.winningCombination);

                    if (gameData.gameOver) {
                        if (gameData.winner) {
                            setInfo(`Player ${gameData.winner} wins!`);
                        } else {
                            setInfo("It's a draw!");
                        }
                    } else {
                        setInfo(`Current player: ${gameData.currentPlayer}`);
                    }
                });

                return () => {
                    socket.off("playerRole");
                    socket.off("waiting");
                    socket.off("observe");
                    socket.off("gameState");
                };
            }
        } else {
            window.location.href = "/login";
        }
    }, [socket]);

    const handleCellClick = (index) => {
        if (!gameOver && board[index] === "" && currentPlayer === playerRole) {
            socket.emit("makeMove", index);
        }
    };

    const handleReset = () => {
        socket.emit("resetGame");
        setWinningCombination(null);
    };

    return (
        <Layout>
            <div className="game-container">
                <div className="game">
                    {info !== "Waiting for second player ..." ? (
                        <div>
                            <Info playerRole={playerRole} info={info} />
                            <Board
                                board={board}
                                onCellClick={handleCellClick}
                                winningCombination={winningCombination}
                            />
                        </div>
                    ) : (
                        <Info playerRole={null} info={info} />
                    )}
                </div>
                <div className="restart-button-container">
                    {currentPlayer !== "" && gameOver && (
                        <button
                            id="resetBtn"
                            className="button-64"
                            role="button"
                            type="button"
                            onClick={handleReset}
                        >
                            <span className="text">Reset</span>
                        </button>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Game;
