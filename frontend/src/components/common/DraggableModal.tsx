import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface DraggableModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
    maxWidth?: string;
    height?: string;
    className?: string; // For extra styling if needed
    initialOffset?: { x: number; y: number };
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = '500px',
    maxWidth,
    height,
    className,
    initialOffset = { x: 0, y: 0 }
}) => {
    const [position, setPosition] = useState(initialOffset);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset position when opening
    useEffect(() => {
        if (isOpen) {
            setPosition(initialOffset);
        }
    }, [isOpen]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only trigger drag if clicking the header itself, not buttons inside it
        if ((e.target as HTMLElement).closest('button')) return;

        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        setPosition({
            x: e.clientX - dragStartPos.current.x,
            y: e.clientY - dragStartPos.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Global event listeners for drag to work even if mouse leaves the header
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-backdrop pointer-events-none">
            <div
                ref={modalRef}
                className={`modal-shell pointer-events-auto ${className || ''}`}
                style={{
                    width: width,
                    maxWidth: maxWidth,
                    height: height,
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
            >
                {/* Header - Drag Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`modal-header select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                    <h3 className="modal-title">{title}</h3>
                    <button
                        onClick={onClose}
                        className="modal-close"
                        aria-label="Fechar"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="modal-body custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
