import React, { useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import Board from "./components/Board";
import Info from "./components/Info";
import Layout from "./components/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import "./css/style.css";

const API_URL =
    process.env.REACT_APP_API_GATEWAY_URL ||
    "https://9m7dw8o1w7.execute-api.us-east-1.amazonaws.com/prod/rankings";

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
                            if (gameData.winner === playerRole) {
                                Swal.fire({
                                    icon: "success",
                                    title: "Congrats!\nYou win!",
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            } else {
                                Swal.fire({
                                    icon: "error",
                                    title: "Ahhh ...\nYou lost!",
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            }
                        } else {
                            setInfo("It's a draw!");
                            Swal.fire({
                                icon: "question",
                                title: "Wow!\nIt's a draw!",
                                showConfirmButton: false,
                                timer: 2000,
                            });
                        }
                    } else {
                        setInfo(`Current player: ${gameData.currentPlayer}`);
                    }
                });

                socket.on("updateRanking", (data) => {
                    submitGameResult(
                        data.winnerEmail,
                        data.loserEmail,
                        data.result
                    );
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

    let debouncing = false;
    const submitGameResult = async (player1Email, player2Email, result) => {
        if (debouncing) return;
        debouncing = true;

        try {
            const response = await axios.post(API_URL, {
                player1Email,
                player2Email,
                result,
            });

            console.log("Rankings updated:", response.data);
        } catch (error) {
            console.error("Error updating rankings:", error);
        } finally {
            setTimeout(() => {
                debouncing = false;
            }, 10000); // 10 seconds debounce time
        }
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
