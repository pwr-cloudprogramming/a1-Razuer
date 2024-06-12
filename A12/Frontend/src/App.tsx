import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import Game from "./game";
import LoginPage from "./loginPage.tsx";
import ConfirmUserPage from "./confirmUserPage.tsx";
import "./css/style.css";

const App = () => {
    const isAuthenticated = () => {
        const accessToken = sessionStorage.getItem("accessToken");
        return !!accessToken;
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        isAuthenticated() ? (
                            <Navigate replace to="/game" />
                        ) : (
                            <Navigate replace to="/login" />
                        )
                    }
                />
                <Route
                    path="/login"
                    element={
                        isAuthenticated() ? (
                            <Navigate replace to="/game" />
                        ) : (
                            <LoginPage />
                        )
                    }
                />
                <Route path="/confirm" element={<ConfirmUserPage />} />
                <Route
                    path="/game"
                    element={
                        isAuthenticated() ? (
                            <Game />
                        ) : (
                            <Navigate replace to="/login" />
                        )
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
