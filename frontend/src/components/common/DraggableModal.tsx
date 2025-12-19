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
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'transparent', // No shadow
                zIndex: 1100,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'none' // Allow clicks to pass through outside
            }}
        >
            <div
                ref={modalRef}
                className={className}
                style={{
                    background: 'white',
                    width: width,
                    maxWidth: maxWidth,
                    height: height,
                    maxHeight: height ? undefined : '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    // Important: remove default transition during drag to prevent lag
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    pointerEvents: 'auto' // Re-enable clicks inside modal
                }}
            >
                {/* Header - Drag Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '15px 20px',
                        borderBottom: '1px solid #eee',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        background: '#f8f9fa',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}
                >
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5em',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
