import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import api from '../services/api';

export function TermsOfUse() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.termsAccepted) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleAccept = async () => {
        try {
            await api.post('/profile/terms');
            updateUser({ termsAccepted: true });
            navigate('/');
        } catch (err: any) {
            alert('Erro ao aceitar termos');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page">
            <div className="w-full relative z-10">
                <div className="text-center mb-4 animate-fadeIn login-hero mx-auto w-full max-w-3xl">
                    <div className="flex justify-center mb-0">
                        <img
                            src="/construsys-logo.png"
                            alt="ConstruSys"
                            width="640"
                            className="login-logo drop-shadow-lg"
                        />
                    </div>
                </div>

                <Card className="p-8 animate-fadeIn login-card bg-white/75 backdrop-blur-xl border border-[#e5dccd] shadow-[0_24px_60px_rgba(40,30,10,0.18)] mx-auto w-full max-w-3xl mt-0">
                    <div className="flex items-start gap-3 mb-6">
                        <div className="h-11 w-11 rounded-full bg-amber-500/15 text-amber-700 flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Termos de Uso e Política de Privacidade</h2>
                            <p className="text-sm text-gray-600">Última atualização: 21/01/2026</p>
                        </div>
                    </div>

                    <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                        <p>Bem-vindo ao ConstruSys.</p>
                        <p>Ao utilizar este sistema, você concorda com os seguintes termos:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>O uso do sistema é estritamente profissional.</li>
                            <li>Suas ações são monitoradas para fins de auditoria e segurança.</li>
                            <li>Você é responsável por manter sua senha segura.</li>
                            <li>Não compartilhe suas credenciais com terceiros.</li>
                        </ul>
                        <div className="pt-2">
                            <p className="font-semibold text-gray-800">Política de Privacidade</p>
                            <p>Coletamos dados de acesso (IP e dispositivo) para segurança e auditoria.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button onClick={logout} className="btn btn-secondary w-full sm:w-auto">
                            Recusar e sair
                        </button>
                        <button onClick={handleAccept} className="btn btn-primary login-primary w-full sm:w-auto">
                            Li e aceito os termos
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
