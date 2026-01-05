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
        <div className="min-h-screen font-sans" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <Sidebar />
            <div className="ml-64 min-h-screen flex flex-col transition-all duration-300">
                <Navbar />
                <main className="flex-1 p-8" style={{ backgroundColor: 'var(--bg-base)' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
