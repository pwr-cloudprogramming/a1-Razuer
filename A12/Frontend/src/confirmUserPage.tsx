// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmSignUp } from "./authService.ts";
import Swal from 'sweetalert2'

const ConfirmUserPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // eslint-disable-next-line
    const [email, setEmail] = useState(location.state?.email || "");
    const [confirmationCode, setConfirmationCode] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            await confirmSignUp(email, confirmationCode);
            Swal.fire({
                title: "Hurray!",
                text: "Account confirmed successfully!\nSign in on next page.",
                icon: "success"
            });
            navigate("/login");
        } catch (error) {
            Swal.fire({
                title: "Upsyy ...",
                text: `Failed to confirm account: ${error}`,
                icon: "error"
            });
        }
    };

    return (
        <div className="loginForm" id="container">
            <h2>Confirm Account</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        placeholder="Confirmation Code"
                        required
                    />
                </div>
                <button className="button-64" type="submit">
                    <span className="text">Confirm Account</span>
                </button>
            </form>
        </div>
    );
};

export default ConfirmUserPage;
