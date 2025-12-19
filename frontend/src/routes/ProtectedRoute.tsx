import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children, masterOnly = false }: any) {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;
    if (!user) return <Navigate to="/login" />;
    if (masterOnly && !user.isMaster) return <Navigate to="/" />;
    return children;
}
