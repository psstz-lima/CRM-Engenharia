import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';

export function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao enviar e-mail');
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page">
                <div className="w-full relative z-10">
                    <div className="text-center mb-3 animate-fadeIn login-hero mx-auto w-full max-w-3xl">
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
                        <div className="flex items-center gap-3 text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                            <CheckCircle2 size={20} />
                            <div>
                                <h4 className="text-base font-semibold">E-mail enviado!</h4>
                                <p className="text-sm text-emerald-700/80">
                                    Verifique sua caixa de entrada para redefinir sua senha.
                                </p>
                            </div>
                        </div>
                        <Link to="/login" className="btn btn-secondary w-full text-sm">
                            Voltar para Login
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page">
            <div className="w-full relative z-10">
                <div className="text-center mb-3 animate-fadeIn login-hero mx-auto w-full max-w-3xl">
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
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-700 flex items-center justify-center">
                            <Mail size={18} />
                        </div>
                        <div>
                            <h4 className="text-base font-semibold">Esqueceu a senha?</h4>
                            <p className="text-sm text-gray-600">
                                Digite seu e-mail e enviaremos instruções para redefinir sua senha.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl mb-6 text-sm flex items-center gap-3 bg-red-500/10 text-red-600 border border-red-500/20">
                            <ShieldCheck size={18} />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">E-mail</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="Digite seu e-mail"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button className="w-full btn btn-primary py-3 text-base font-semibold login-primary">
                            Enviar link de redefinição
                        </button>
                    </form>

                    <div className="mt-6">
                        <Link to="/login" className="btn btn-secondary w-full text-sm">
                            Voltar para Login
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}

