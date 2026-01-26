import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page">
            <div className="w-full relative z-10">
                <div className="text-center mb-1 animate-fadeIn login-hero mx-auto w-full max-w-3xl">
                    <div className="flex justify-center mb-0">
                        <img
                            src="/construsys-logo.png"
                            alt="ConstruSys"
                            width="640"
                            className="login-logo drop-shadow-lg"
                        />
                    </div>
                </div>

                <Card className="p-8 animate-fadeIn login-card bg-white/70 backdrop-blur-xl border border-[#e5dccd] shadow-[0_24px_60px_rgba(40,30,10,0.18)] mx-auto w-full max-w-md mt-0">
                    {error && (
                        <div className="p-4 rounded-xl mb-6 text-sm flex items-center gap-3 bg-red-500/10 text-red-600 border border-red-500/20">
                            <ShieldCheck size={18} />
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
                                    className="text-sm text-gray-600 hover:text- transition-colors"
                                >
                                    Esqueceu?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-12"
                                    placeholder="Digite sua senha"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text- transition-colors"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full btn btn-primary py-3 text-base font-semibold login-primary bg-gradient-to-r from-amber-600 to-amber-800 text-[#20170a] shadow-[0_12px_28px_rgba(126,94,24,0.35)]"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={18} className="animate-spin" /> Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                </Card>

                <p className="text-center mt-5 text-sm text-gray-600 animate-fadeIn">
                    (c) 2026 ConstruSys. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
