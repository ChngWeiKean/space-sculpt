import React, { useState } from 'react';

export const Droppable = ({ children, id, cellWidth, cellHeight, onDrop, onHover, isOverlapping }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragEnter = () => {
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        onDrop();
        setIsOver(false);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        onHover(id);
    };

    const style = {
        border: isOverlapping ? '2px solid red' : isOver ? '2px solid green' : 'none',
        background: isOverlapping ? 'rgba(255, 0, 0, 0.2)' : isOver ? 'rgba(0, 255, 0, 0.2)' : 'none',
        width: `${cellWidth}px`,
        height: `${cellHeight}px`,
        pointerEvents: 'auto',
        position: 'relative',
    };

    return (
        <div
            style={style}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {children}
        </div>
    );
};