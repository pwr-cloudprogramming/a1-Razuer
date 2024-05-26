// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp } from "./authService.ts";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();

    const handleSignIn = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        try {
            const session = await signIn(email, password);
            console.log("Sign in successful", session);
            if (session && typeof session.AccessToken !== "undefined") {
                sessionStorage.setItem("accessToken", session.AccessToken);
                if (sessionStorage.getItem("accessToken")) {
                    window.location.href = "/game";
                } else {
                    console.error("Session token was not set properly.");
                }
            } else {
                console.error("SignIn session or AccessToken is undefined.");
            }
        } catch (error) {
            alert(`Sign in failed: ${error}`);
        }
    };

    const handleSignUp = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            await signUp(email, password);
            navigate("/confirm", { state: { email } });
        } catch (error) {
            alert(`Sign up failed: ${error}`);
        }
    };

    return (
        <div className="loginForm" id="container">
            <h1>Welcome</h1>
            <h4>
                {isSignUp
                    ? "Sign up to create an account"
                    : "Sign in to your account"}
            </h4>
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                <div>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>
                <div>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                </div>
                {isSignUp && (
                    <div>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                        />
                    </div>
                )}
                <button className="button-64" type="submit">
                    <span className="text">
                        {isSignUp ? "Sign Up" : "Sign In"}
                    </span>
                </button>
            </form>
            <button
                className="button-64"
                type="submit"
                onClick={() => setIsSignUp(!isSignUp)}
            >
                <span className="text">
                    {isSignUp
                        ? "Already have an account? Sign In"
                        : "Need an account? Sign Up"}
                </span>
            </button>
        </div>
    );
};

export default LoginPage;
