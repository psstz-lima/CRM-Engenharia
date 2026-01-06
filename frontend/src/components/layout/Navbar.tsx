import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        checkNotifications();
        const interval = setInterval(checkNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            const unread = data.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
        } catch { }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav
            className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between border-b"
            style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
            }}
        >
            {/* Left side: Current date */}
            <div className="flex items-center gap-4">
                <div className="text-sm hidden md:block" style={{ color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Right side: Actions & Profile */}
            <ul className="flex items-center gap-4">
                {/* Notifications */}
                <li>
                    <Link
                        to="/notifications"
                        className="relative p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center"
                        style={{
                            color: 'var(--text-muted)',
                            backgroundColor: 'transparent'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <span className="text-xl">🔔</span>
                        {unreadCount > 0 && (
                            <span
                                className="absolute -top-0.5 -right-0.5 w-5 h-5 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center animate-pulse"
                                style={{ backgroundColor: 'var(--danger)' }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                </li>

                {/* Divider */}
                <li className="h-8 w-px hidden md:block" style={{ backgroundColor: 'var(--border-default)' }}></li>

                {/* User Info */}
                <li className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {user?.fullName}
                        </span>
                        {user?.isMaster && (
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
                                style={{
                                    color: 'var(--accent-primary)',
                                    backgroundColor: 'var(--accent-glow)'
                                }}
                            >
                                ⭐ Master
                            </span>
                        )}
                    </div>
                </li>

                {/* Logout */}
                <li>
                    <button
                        onClick={handleLogout}
                        className="p-2.5 rounded-xl transition-all duration-200"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => {
                            e.currentTarget.style.color = 'var(--danger)';
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        title="Sair"
                    >
                        <span className="text-xl">🚪</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}
