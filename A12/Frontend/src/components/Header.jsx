import React, { useState, useEffect } from "react";
import { signOut, getUserEmail } from "../authService.ts";
import { useNavigate } from "react-router-dom";
import "../css/style.css";
import { useSocket } from "../SocketContext";
import axios from "axios";
import { CSSTransition } from "react-transition-group";
import "../css/transition.css";
import Swal from "sweetalert2";

const backendIP = process.env.REACT_APP_BACKEND_IP;

const Header = () => {
    const { socket, disconnectSocket } = useSocket();
    const [profileImage, setProfileImage] = useState("default-profile.png");
    const [gameHistory, setGameHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showRanking, setShowRanking] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isVerified, setIsVerified] = useState(false); // <--- test
    const [rankingData, setRankingData] = useState([]);
    const email = getUserEmail();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfileImage = async () => {
            try {
                let mail = String(email);
                console.log(
                    "Próba " + `http://${backendIP}:8080/profile-pic/${mail}`
                );
                const response = await axios.get(
                    `http://${backendIP}:8080/profile-pic/${mail}`
                );
                setProfileImage(response.data.fileUrl);
            } catch (error) {
                console.error("Error fetching profile image:", error);
            }
        };

        const fetchGameHistory = async () => {
            try {
                const response = await axios.get(
                    `http://${backendIP}:8080/game-history/${email}`
                );
                setGameHistory(response.data);
            } catch (error) {
                console.error("Error fetching game history:", error);
            }
        };

        const checkSubscriptionStatus = async () => {
            try {
                const response = await axios.get(
                    `http://${backendIP}:8080/sns-subscription-status/${email}`
                );
                const { isSubscribed, isVerified } = response.data;
                setIsSubscribed(isSubscribed);
                setIsVerified(isVerified);
            } catch (error) {
                console.error("Error checking subscription status:", error);
                setIsSubscribed(false);
            }
        };

        fetchProfileImage();
        fetchGameHistory();
        checkSubscriptionStatus();

        if (socket) {
            socket.emit("setEmail", email);
        }
    }, [email, socket]);

    const handleLogout = () => {
        Swal.fire({
            icon: "info",
            title: "You have successfully logged out!",
            showConfirmButton: false,
            timer: 1500,
        }).then(() => {
            window.location.replace("/login");
            sessionStorage.clear();
            disconnectSocket();
        });
    };

    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append("email", String(email));
        formData.append("file", file);

        try {
            const response = await axios.post(
                `http://${backendIP}:8080/upload`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setProfileImage(response.data.fileUrl);
            Swal.fire({
                icon: "success",
                title: "Your image has been changed!",
                showConfirmButton: false,
                timer: 1500,
            });
            console.log("Image uploaded");
        } catch (error) {
            console.error("Error uploading image: ", error);
            Swal.fire({
                title: "ERROR",
                text: "Error uploading image.",
                icon: "error",
            });
        }
    };

    const toggleHistory = () => {
        setShowHistory(!showHistory);
    };

    const toggleRankingView = () => {
        setShowRanking(!showRanking);
    };

    const handleSubscription = async () => {
        try {
            if (isSubscribed) {
                await axios.post(`http://${backendIP}:8080/unsubscribe-sns`, {
                    email,
                });
                setIsSubscribed(false);
                setIsVerified(false);
                Swal.fire({
                    title: "Unsubscribed successfully.",
                    text: "If you change your mind, you can subscribe again.",
                    icon: "success",
                });
            } else {
                await axios.post(`http://${backendIP}:8080/subscribe-sns`, {
                    email,
                });
                setIsSubscribed(true);
                setIsVerified(false);
                Swal.fire({
                    title: "Subscribed successfully!",
                    text: "Please confirm the subscription through the email sent to you.",
                    icon: "info",
                });
            }
        } catch (error) {
            console.error("Error handling subscription:", error);
            Swal.fire({
                title: "ERROR",
                text: "Error handling subscription. Perhaps you didn't confirm the subscription.",
                icon: "error",
            });
        }
    };

    const fetchRankingData = async () => {
        try {
            const response = await axios.get(
                `http://${backendIP}:8080/ranking`
            );
            setRankingData(response.data);
        } catch (error) {
            console.error("Error fetching ranking data:", error);
        }
    };

    useEffect(() => {
        if (showRanking) {
            fetchRankingData();
        }
    }, [showRanking]);

    const getResultColor = (result) => {
        switch (result) {
            case "win":
                return "green";
            case "lose":
                return "#ac0d0da4";
            case "draw":
                return "blue";
            default:
                return "black";
        }
    };

    const getEmailColor = (result) => {
        switch (result) {
            case "win":
                return "#ac0d0da4";
            case "lose":
                return "green";
            case "draw":
                return "blue";
            default:
                return "black";
        }
    };

    return (
        <div className="headerhead">
            <div className="header">
                <label htmlFor="fileInput">
                    <img
                        src={profileImage}
                        alt="Profile"
                        className="profile-image"
                        style={{
                            cursor: "pointer",
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                        }}
                    />
                </label>
                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                />
                <span onClick={toggleHistory} style={{ cursor: "pointer" }}>
                    {email}
                </span>
                <button className="button-64" onClick={handleLogout}>
                    <span className="text">Sign Out</span>
                </button>
            </div>
            <CSSTransition
                in={showHistory}
                timeout={300}
                classNames="slide"
                unmountOnExit
            >
                <div className="history-panel">
                    <div className="panel-buttons">
                        <button
                            className="button-64"
                            onClick={handleSubscription}
                            disabled={!isVerified && isSubscribed}
                        >
                            <span className="text">
                                {isSubscribed
                                    ? isVerified
                                        ? "Unsubscribe from SNS"
                                        : "Pending Confirmation"
                                    : "Subscribe to SNS"}
                            </span>
                        </button>
                        <button
                            className="button-64"
                            onClick={toggleRankingView}
                        >
                            <span className="text">
                                {showRanking
                                    ? "Show Game History"
                                    : "Show Player Rankings"}
                            </span>
                        </button>
                    </div>
                    <CSSTransition
                        in={!showRanking}
                        timeout={300}
                        classNames="slide"
                        unmountOnExit
                    >
                        <ul className="history-list">
                            {Array.isArray(gameHistory) &&
                            gameHistory.length > 0 ? (
                                gameHistory.map((game, index) => (
                                    <li key={index}>
                                        <span
                                            className="result"
                                            style={{
                                                color: getResultColor(
                                                    game.result
                                                ),
                                            }}
                                        >
                                            {game.result}
                                        </span>
                                        :{" "}
                                        <span className="date">
                                            {new Date(
                                                game.timestamp
                                            ).toLocaleString()}
                                        </span>
                                        <br />
                                        <span className="vs">vs.</span>{" "}
                                        <span
                                            style={{
                                                color: getEmailColor(
                                                    game.result
                                                ),
                                            }}
                                        >
                                            {game.enemy}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li>No game history available.</li>
                            )}
                        </ul>
                    </CSSTransition>
                    <CSSTransition
                        in={showRanking}
                        timeout={300}
                        classNames="slide"
                        unmountOnExit
                    >
                        <ul className="ranking-list">
                            {Array.isArray(rankingData) &&
                            rankingData.length > 0 ? (
                                rankingData
                                    .sort((a, b) => b.rank - a.rank)
                                    .map((player, index) => (
                                        <li
                                            key={index}
                                            className="ranking-item"
                                        >
                                            <span className="place">
                                                {index + 1}.
                                            </span>
                                            <span className="email">
                                                {player.email}
                                            </span>
                                            <span className="rank">
                                                {player.rank}
                                            </span>
                                        </li>
                                    ))
                            ) : (
                                <li>No ranking data available.</li>
                            )}
                        </ul>
                    </CSSTransition>
                </div>
            </CSSTransition>
        </div>
    );
};

export default Header;
