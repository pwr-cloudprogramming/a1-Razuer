import React from "react";

const Info = ({ playerRole, info }) => {
    return (
        <div id="playerInfo">
            {playerRole !== null && <p>You are playing as {playerRole}</p>}
            <p id="info">{info}</p>
        </div>
    );
};

export default Info;
