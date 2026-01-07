import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'glass' | 'glow';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

const variantClasses = {
    default: 'card',
    glass: 'card-glass',
    glow: 'card-glow',
};

export function Card({
    children,
    className = '',
    variant = 'default',
    padding = 'md',
    hover = false
}: CardProps) {
    return (
        <div
            className={`
                ${variantClasses[variant]} 
                ${paddingClasses[padding]}
                ${hover ? 'hover:border- hover:shadow- transition-all duration-300' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`border-b border- pb-4 mb-4 ${className}`}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: ReactNode;
    icon?: string;
    className?: string;
}

export function CardTitle({ children, icon, className = '' }: CardTitleProps) {
    return (
        <h3 className={`text-lg font-semibold text- flex items-center gap-2 ${className}`}>
            {icon && <span>{icon}</span>}
            {children}
        </h3>
    );
}
