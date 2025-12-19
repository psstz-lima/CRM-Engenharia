import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent, isMaster = false) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password, isMaster);
            navigate('/');
        } catch (err: any) {
            console.error('Login error details:', err);
            console.log('Error response:', err.response);
            setError(err.response?.data?.error || 'Erro ao fazer login');
        }
    };

    return (
        <div>
            <div>
                <div>
                    <div>
                        <div>
                            <span>CRM Engenharia</span>
                        </div>
                        <h4>Bem-vindo ao CRM! 👋</h4>
                        <p>Por favor, faça login na sua conta e comece a aventura.</p>

                        {error && (
                            <div style={{ color: 'red', background: '#ffebee', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                                {typeof error === 'string' ? error : JSON.stringify(error)}
                                {error === 'Network Error' && <p><small>Verifique se o backend está rodando na porta 3001.</small></p>}
                            </div>
                        )}

                        <form onSubmit={(e) => handleSubmit(e, false)}>
                            <div>
                                <label>Email</label>
                                <input type="email" placeholder="Digite seu email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div>
                                <div>
                                    <label>Senha</label>
                                    <Link to="/forgot-password">
                                        <small>Esqueceu a senha?</small>
                                    </Link>
                                </div>
                                <input type="password" placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <div>
                                <button type="submit">Entrar</button>
                            </div>
                        </form>

                        <p>
                            <span>Novo na plataforma? </span>
                            <a href="#" onClick={(e) => e.preventDefault()}>
                                <span>Crie uma conta</span>
                            </a>
                        </p>

                        <div>
                            <div>ou</div>
                        </div>

                        <button onClick={(e: any) => handleSubmit(e, true)}>
                            Login Usuário Master
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
