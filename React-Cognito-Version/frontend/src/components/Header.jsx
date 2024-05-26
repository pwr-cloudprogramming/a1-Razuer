import React from "react";
import { signOut, getUserEmail } from "../authService.ts";
import { useNavigate } from "react-router-dom";
import "../css/style.css";
import { useSocket } from "../SocketContext";

const Header = () => {
    const { disconnectSocket } = useSocket();
    const email = getUserEmail();
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.clear();
        disconnectSocket();
        navigate("/login");
    };

    return (
        <div className="header">
            <span>{email}</span>
            <button className="button-64" onClick={handleLogout}>
                <span className="text">Sign Out</span>
            </button>
        </div>
    );
};

export default Header;
