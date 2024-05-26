import React from "react";
import ReactDOM from "react-dom/client";
import "./css/style.css";
import App from "./App.tsx";
import { SocketProvider } from "./SocketContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <SocketProvider>
        <App />
    </SocketProvider>
);