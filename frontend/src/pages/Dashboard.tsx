import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export function Dashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ users: 0, companies: 0, roles: 0 });

    useEffect(() => {
        loadProfile();
        if (user.isMaster) loadStats();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await api.get('/profile');
            setProfile(data);
        } catch { }
    };

    const loadStats = async () => {
        try {
            const [users, companies, roles] = await Promise.all([
                api.get('/users'),
                api.get('/companies'),
                api.get('/roles'),
            ]);
            const usersData = users.data.data || users.data;
            setStats({ users: usersData.length, companies: companies.data.length, roles: roles.data.length });
        } catch { }
    };

    return (
        <div>
            <div>
                <h1>Bem-vindo, {user.fullName}!</h1>
                <p>Email: {user.email}</p>
                <p>Empresa: {user.company?.name || 'N/A'}</p>
                <p>Perfil: {user.role?.name || 'N/A'}</p>
                {user.isMaster && <span>Usuário Master</span>}
            </div>

            {user.isMaster && (
                <div>
                    <div>
                        <h3>Usuários</h3>
                        <p>{stats.users}</p>
                    </div>
                    <div>
                        <h3>Empresas</h3>
                        <p>{stats.companies}</p>
                    </div>
                    <div>
                        <h3>Perfis</h3>
                        <p>{stats.roles}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
