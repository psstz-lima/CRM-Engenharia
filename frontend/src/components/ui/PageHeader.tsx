import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    actions?: ReactNode;
    breadcrumb?: { label: string; href?: string }[];
    center?: boolean;
}

export function PageHeader({ title, subtitle, icon, actions, breadcrumb, center }: PageHeaderProps) {
    return (
        <div className="page-header">
            {/* Breadcrumb - Always Left */}
            {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-2 text-sm mb-4">
                    {breadcrumb.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <span className="text-[var(--text-muted)]">/</span>}
                            {item.href ? (
                                <Link
                                    to={item.href}
                                    className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-[var(--text-secondary)]">{item.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}

            {/* Header Content */}
            <div className={`flex items-end ${center ? 'justify-center relative' : 'justify-between'} gap-4`}>
                <div className={`${center ? 'text-center w-full' : ''}`}>
                    <h1 className={`page-title ${center ? 'justify-center' : ''}`}>
                        {icon && <span className="text-2xl">{icon}</span>}
                        <span className="bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                            {title}
                        </span>
                    </h1>
                    {subtitle && (
                        <p className="page-subtitle">{subtitle}</p>
                    )}
                </div>

                {actions && (
                    <div className={`flex items-center gap-3 ${center ? 'absolute right-0 top-1/2 -translate-y-1/2' : ''}`}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
