import React from "react";

const Cell = ({ value, index, onClick }) => {
    return (
        <div className="cell" data-index={index} onClick={() => onClick(index)}>
            {value}
        </div>
    );
};

export default Cell;
