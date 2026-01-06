import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent, isMaster = false) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, isMaster);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-base)' }}
        >
            {/* Background decoration */}
            <div
                className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-30 -mr-48 -mt-48"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}
            ></div>
            <div
                className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-20 -ml-32 -mb-32"
                style={{ background: 'var(--accent-secondary)' }}
            ></div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo Card */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-2xl"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            boxShadow: 'var(--shadow-glow), var(--shadow-lg)'
                        }}
                    >
                        <span className="text-4xl">🏗️</span>
                    </div>
                    <h1
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))' }}
                    >
                        ConstruSys
                    </h1>
                    <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
                        Bem-vindo de volta! Faça login para continuar.
                    </p>
                </div>

                {/* Login Card */}
                <div
                    className="card p-8 animate-fadeIn"
                    style={{
                        animationDelay: '0.1s',
                        boxShadow: 'var(--shadow-lg)'
                    }}
                >
                    {error && (
                        <div
                            className="p-4 rounded-xl mb-6 text-sm flex items-center gap-3"
                            style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: 'var(--danger)'
                            }}
                        >
                            <span className="text-lg">⚠️</span>
                            <div>
                                {error}
                                {error === 'Network Error' && (
                                    <p className="mt-1 opacity-80 text-xs">
                                        Verifique se o backend está rodando.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="label mb-0">Senha</label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm transition-colors"
                                    style={{ color: 'var(--accent-primary)' }}
                                >
                                    Esqueceu?
                                </Link>
                            </div>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full btn btn-primary py-3 text-base font-semibold"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">⏳</span> Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full" style={{ borderTop: '1px solid var(--border-default)' }}></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span
                                className="px-3"
                                style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
                            >
                                ou
                            </span>
                        </div>
                    </div>

                    {/* Master Login */}
                    <button
                        onClick={(e: any) => handleSubmit(e, true)}
                        className="w-full btn btn-secondary text-sm"
                        disabled={loading}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span>⭐</span> Login Administrador (Demo)
                        </span>
                    </button>
                </div>

                {/* Footer */}
                <p
                    className="text-center mt-6 text-sm animate-fadeIn"
                    style={{ color: 'var(--text-muted)', animationDelay: '0.2s' }}
                >
                    © 2026 ConstruSys. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
