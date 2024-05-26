import React from "react";
import Cell from "./Cell";

const Board = ({ board, onCellClick, winningCombination }) => {
    const getStrikeClass = (combination) => {
        switch (combination) {
            case 0:
                return "strike-row strike-row-1";
            case 1:
                return "strike-row strike-row-2";
            case 2:
                return "strike-row strike-row-3";
            case 3:
                return "strike-column strike-column-1";
            case 4:
                return "strike-column strike-column-2";
            case 5:
                return "strike-column strike-column-3";
            case 6:
                return "strike-diagonal-1";
            case 7:
                return "strike-diagonal-2";
            default:
                return "";
        }
    };

    return (
        <div className="board">
            {board.map((cell, index) => (
                <Cell
                    key={index}
                    value={cell}
                    index={index}
                    onClick={onCellClick}
                />
            ))}
            {winningCombination >= 0 && (
                <div
                    className={`strike ${getStrikeClass(winningCombination)}`}
                />
            )}
        </div>
    );
};

export default Board;
