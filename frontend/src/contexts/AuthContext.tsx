import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface AuthContextData {
    user: any;
    loading: boolean;
    login: (email: string, password: string, isMaster?: boolean) => Promise<any>;
    logout: () => Promise<void>;
    updateUser: (data: any) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        const validateSession = async () => {
            if (token && userData) {
                try {
                    // Optimized: First set what we have (optimistic)
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);

                    // Then fetch fresh data
                    try {
                        const { data } = await api.get('/profile');
                        // Merge fresh data with existing (to keep any extra fields if needed, though usually fresh replacement is better)
                        // Actually, replacing proper fields is safer.
                        // Assuming /profile returns the full user object used for context
                        const freshUser = { ...parsedUser, ...data };
                        setUser(freshUser);
                        localStorage.setItem('user', JSON.stringify(freshUser));
                    } catch (err) {
                        // If fetching profile fails but token exists, it might be expired or server error.
                        // Ideally we might want to check for 401 and logout.
                        // api interceptor usually handles 401.
                        console.error('Failed to refresh user profile', err);
                    }
                } catch (e) {
                    console.error('Erro ao restaurar sessão:', e);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        validateSession();
    }, []);

    // Inactivity Timer
    useEffect(() => {
        let timer: any;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            if (user) {
                timer = setTimeout(() => {
                    alert('Sessão expirada por inatividade');
                    logout();
                }, 30 * 60 * 1000); // 30 minutos
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
        };
    }, [user]);

    const login = async (email: string, password: string, isMaster = false) => {
        const endpoint = isMaster ? '/auth/login-master' : '/auth/login';
        const { data } = await api.post(endpoint, { email, password });
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        try {
            await api.post('/auth/logout', { refreshToken });
        } catch { }
        localStorage.clear();
        setUser(null);
    };

    const updateUser = (data: any) => {
        const newUser = { ...user, ...data };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
