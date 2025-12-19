import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

export function Profile() {
    const [profile, setProfile] = useState<any>(null);
    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await api.get('/profile');
            setProfile(data);
            setFullName(data.fullName);
        } catch { }
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.patch('/profile', { fullName });
            setSuccess('Perfil atualizado com sucesso!');
            setEditing(false);
            loadProfile();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao atualizar perfil');
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.patch('/profile/password', { currentPassword, newPassword });
            setSuccess('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao alterar senha');
        }
    };

    const handlePhotoUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!photo) return;
        setError('');
        setSuccess('');
        try {
            const formData = new FormData();
            formData.append('photo', photo);
            const { data } = await api.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess('Foto atualizada com sucesso!');
            loadProfile();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao enviar foto');
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm('Tem certeza? Isso desconectará você de todos os dispositivos, incluindo este.')) return;
        try {
            await api.post('/auth/logout-all');
            alert('Desconectado de todos os dispositivos.');
            window.location.href = '/login';
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao desconectar');
        }
    };

    if (!profile) return <div>Carregando...</div>;

    return (
        <div>
            <h2>Meu Perfil</h2>

            {success && <div>✓ {success}</div>}
            {error && <div>{error}</div>}

            <div>
                {profile.profilePhoto && (
                    <img src={profile.profilePhoto} alt="Foto de perfil" width="100" height="100" />
                )}
            </div>

            <form onSubmit={handlePhotoUpload}>
                <div>
                    <label>Foto de Perfil</label>
                    <input type="file" onChange={e => setPhoto(e.target.files?.[0] || null)} accept="image/*" />
                </div>
                <button type="submit">Atualizar Foto</button>
            </form>

            <form onSubmit={handleUpdateProfile}>
                <div>
                    <label>Nome Completo</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        disabled={!editing}
                    />
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" value={profile.email} disabled />
                </div>
                {!editing ? (
                    <button type="button" onClick={() => setEditing(true)}>Editar Perfil</button>
                ) : (
                    <div>
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => setEditing(false)}>Cancelar</button>
                    </div>
                )}
            </form>

            <hr />

            <h3>Segurança</h3>
            <div>
                <h4>Zona de Perigo</h4>
                <p>Caso suspeite de acesso não autorizado, você pode desconectar sua conta de todos os dispositivos onde ela está logada.</p>
                <button onClick={handleLogoutAll}>Sair de todos os dispositivos</button>
            </div>

            <hr />

            <h3>Alterar Senha</h3>
            <form onSubmit={handleChangePassword}>
                <div>
                    <label>Senha Atual</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                    <label>Nova Senha</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <button type="submit">Alterar Senha</button>
            </form>
        </div>
    );
}
