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

        >
            <div className="max-w-md w-full relative z-10">
                {/* Logo Card */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div>
                        <img
                            src="/construsys-logo.png"
                            alt="ConstruSys"
                            width="200"
                        />
                    </div>
                    <h1>
                        ConstruSys
                    </h1>
                    <p>
                        Bem-vindo de volta! Faça login para continuar.
                    </p>
                </div>

                {/* Login Card */}
                <div
                    className="card p-8 animate-fadeIn"

                >
                    {error && (
                        <div
                            className="p-4 rounded-xl mb-6 text-sm flex items-center gap-3"

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
                            <div className="w-full" ></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span
                                className="px-3"

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

                >
                    © 2026 ConstruSys. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
