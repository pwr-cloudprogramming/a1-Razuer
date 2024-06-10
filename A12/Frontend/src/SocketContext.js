import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const backendIP = process.env.REACT_APP_BACKEND_IP;
const socketPort = 8080;
const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const token = sessionStorage.getItem("idToken");
        if (token && !socket) {
            const newSocket = io(`http://${backendIP}:${socketPort}`, {
                transports: ["websocket", "polling", "flashsocket"],
            });
            setSocket(newSocket);
        }
    }, [socket]);

    const disconnectSocket = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, disconnectSocket }}>
            {children}
        </SocketContext.Provider>
    );
};
