import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
            setError(err.response?.data?.error || 'Erro ao enviar email');
        }
    };

    if (success) {
        return (
            <div>
                <div>
                    <div>
                        <div>
                            <div>
                                <span>CRM Engenharia</span>
                            </div>
                            <h4>Email Enviado! 🚀</h4>
                            <p>Verifique sua caixa de entrada para redefinir sua senha.</p>
                            <Link to="/login">Voltar para Login</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div>
                <div>
                    <div>
                        <div>
                            <span>CRM Engenharia</span>
                        </div>
                        <h4>Esqueceu a senha? 🔒</h4>
                        <p>Digite seu email e enviaremos instruções para redefinir sua senha.</p>

                        {error && <div>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div>
                                <label>Email</label>
                                <input type="email" placeholder="Digite seu email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <button>Enviar Link</button>
                        </form>
                        <div>
                            <Link to="/login">
                                <i></i>
                                Voltar para Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
