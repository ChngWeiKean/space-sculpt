import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export function Droppable({ children, id, cellWidth, cellHeight }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    const style = {
        border: isOver ? '2px dashed green' : 'none',
        width: `${cellWidth}px`, // Set the width to cellWidth
        height: `${cellHeight}px`, // Set the height to cellHeight
        pointerEvents: 'auto', // Allow pointer events for dropping
    };

    return (
        <div ref={setNodeRef} style={style}>
            {children}
        </div>
    );
}