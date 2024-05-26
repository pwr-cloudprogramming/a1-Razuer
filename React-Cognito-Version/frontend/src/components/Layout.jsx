import React from "react";
import Header from "./Header";
import "../css/style.css";

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Header />
            <div className="content">{children}</div>
        </div>
    );
};

export default Layout;
