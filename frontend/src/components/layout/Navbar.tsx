import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../common/NotificationBell';
import { LogOut } from 'lucide-react';

export function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="topbar">
            {/* Left side: Current date */}
            <div className="topbar-date">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Right side: Actions & Profile */}
            <ul className="topbar-actions">
                {/* Notifications */}
                <li>
                    <NotificationBell />
                </li>

                {/* Divider */}
                <li className="topbar-divider"></li>

                {/* User Info */}
                <li>
                    <div className="topbar-user">
                        <span>{user?.fullName}</span>
                        {user?.isMaster && <span>Master</span>}
                    </div>
                </li>

                {/* Logout */}
                <li>
                    <button
                        onClick={handleLogout}
                        title="Sair"
                        className="icon-button"
                    >
                        <LogOut size={18} />
                    </button>
                </li>
            </ul>
        </nav>
    );
}
