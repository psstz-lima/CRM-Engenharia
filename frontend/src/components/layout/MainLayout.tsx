import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function MainLayout() {
    const { user } = useAuth();

    if (user && !user.termsAccepted) {
        return <Navigate to="/terms" />;
    }

    return (
        <div className="app-shell">
            <Sidebar />
            <div className="app-main">
                <Navbar />
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
