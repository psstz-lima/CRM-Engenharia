import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../common/NotificationBell';

export function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav>
            {/* Left side: Current date */}
            <div>
                <div>
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Right side: Actions & Profile */}
            <ul>
                {/* Notifications */}
                {/* Notifications */}
                <li>
                    <NotificationBell />
                </li>

                {/* Divider */}
                <li></li>

                {/* User Info */}
                <li>
                    <div>
                        <span>
                            {user?.fullName}
                        </span>
                        {user?.isMaster && (
                            <span>
                                ⭐ Master
                            </span>
                        )}
                    </div>
                </li>

                {/* Logout */}
                <li>
                    <button
                        onClick={handleLogout}
                        title="Sair"
                    >
                        <span>🚪</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}
