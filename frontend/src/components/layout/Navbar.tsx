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
        <nav>
            <div>
                <div>
                    <div>
                        <span>CRM Engenharia</span>
                    </div>
                </div>

                <ul>
                    <li>
                        <Link to="/notifications">
                            🔔
                            {unreadCount > 0 && (
                                <span>
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    </li>
                    <li>
                        <div>
                            <div>
                                <span>{user.fullName}</span>
                                {user.isMaster && <small>Master</small>}
                            </div>
                        </div>
                    </li>
                    <li>
                        <button onClick={handleLogout}>Sair</button>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
