import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
        <div>
            <div>
                <h2>Termos de Uso e Política de Privacidade</h2>
                <div>
                    <p>Bem-vindo ao ConstruSys.</p>
                    <p>Ao utilizar este sistema, você concorda com os seguintes termos:</p>
                    <ul>
                        <li>O uso do sistema é estritamente profissional.</li>
                        <li>Suas ações são monitoradas para fins de auditoria e segurança.</li>
                        <li>Você é responsável por manter sua senha segura.</li>
                        <li>Não compartilhe suas credenciais com terceiros.</li>
                    </ul>
                    <p>Política de Privacidade:</p>
                    <p>Coletamos dados de acesso (IP, dispositivo) para segurança e auditoria.</p>
                </div>
                <div>
                    <button onClick={logout}>Recusar e Sair</button>
                    <button onClick={handleAccept}>Li e Aceito os Termos</button>
                </div>
            </div>
        </div>
    );
}
