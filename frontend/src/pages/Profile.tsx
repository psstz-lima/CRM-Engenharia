import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardTitle } from '../components/ui/Card';

export function Profile() {
    const { theme, setTheme, themes } = useTheme();
    const { updateUser } = useAuth(); // Get updateUser from AuthContext
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
            // Sync global user state with latest data from backend
            updateUser(data);
        } catch { }
    };

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const { data } = await api.patch('/profile', { fullName });
            setSuccess('Perfil atualizado com sucesso!');
            setEditing(false);
            loadProfile(); // This will also update global state via loadProfile
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
            setPhoto(null);

            // Start of fix: Force update of profile rendering immediately
            // Often backend returns the new photo URL in 'data'
            // If not, loadProfile() will fetch it.
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

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditing(true);
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setFullName(profile?.fullName || '');
    };

    if (!profile) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-[var(--text-muted)]">Carregando...</div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            <PageHeader
                title="Meu Perfil"
                subtitle="Gerencie suas informações pessoais e configurações"
                icon="👤"
            />

            {/* Mensagens de feedback */}
            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                    <span>✓</span> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                    <span>✕</span> {error}
                </div>
            )}

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna 1: Foto e Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <div className="text-center">
                            {/* Avatar */}
                            <div className="relative inline-block mb-4">
                                {profile.profilePhoto ? (
                                    <img
                                        src={profile.profilePhoto}
                                        alt="Foto de perfil"
                                        className="w-32 h-32 rounded-2xl object-cover border-4 border-[var(--border-default)] shadow-xl"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-5xl text-white shadow-xl">
                                        {profile.fullName?.charAt(0)?.toUpperCase() || '👤'}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)]">{profile.fullName}</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-1">{profile.email}</p>

                            {profile.role && (
                                <span className="inline-block mt-3 badge badge-primary">
                                    {profile.role.name}
                                </span>
                            )}

                            {/* Upload de foto */}
                            <form onSubmit={handlePhotoUpload} className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                                <input
                                    type="file"
                                    onChange={e => setPhoto(e.target.files?.[0] || null)}
                                    accept="image/*"
                                    className="text-sm text-[var(--text-muted)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--bg-hover)] file:text-[var(--text-secondary)] hover:file:bg-[var(--accent-glow)] file:cursor-pointer file:transition-all"
                                />
                                {photo && (
                                    <button type="submit" className="btn btn-primary mt-3 w-full">
                                        📤 Enviar Foto
                                    </button>
                                )}
                            </form>
                        </div>
                    </Card>
                </div>

                {/* Coluna 2: Formulários */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tema */}
                    <Card>
                        <CardTitle icon="🎨">Aparência</CardTitle>
                        <p className="text-sm text-[var(--text-muted)] mt-1 mb-6">
                            Escolha o tema visual da plataforma
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${theme === t.id
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)] shadow-[var(--shadow-glow)]'
                                        : 'border-[var(--border-default)] hover:border-[var(--border-strong)] bg-[var(--bg-elevated)]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{t.icon}</span>
                                        <span className="font-medium text-[var(--text-primary)]">{t.name}</span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">{t.description}</p>

                                    {theme === t.id && (
                                        <div className="absolute top-3 right-3">
                                            <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-xs">
                                                ✓
                                            </span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Informações Pessoais */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <CardTitle icon="📝">Informações Pessoais</CardTitle>
                            {!editing && (
                                <button onClick={handleEditClick} className="btn btn-ghost text-sm">
                                    ✏️ Editar
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <div>
                                <label className="label">Nome Completo</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    disabled={!editing}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="input opacity-60"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">O email não pode ser alterado</p>
                            </div>

                            {editing && (
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="btn btn-primary">
                                        💾 Salvar
                                    </button>
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </form>
                    </Card>

                    {/* Alterar Senha */}
                    <Card>
                        <CardTitle icon="🔐">Alterar Senha</CardTitle>
                        <form onSubmit={handleChangePassword} className="space-y-5 mt-6">
                            <div>
                                <label className="label">Senha Atual</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    required
                                    className="input"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="label">Nova Senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                    className="input"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                🔑 Alterar Senha
                            </button>
                        </form>
                    </Card>

                    {/* Zona de Perigo */}
                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardTitle icon="⚠️" className="text-red-400">Zona de Perigo</CardTitle>
                        <p className="text-sm text-[var(--text-muted)] mt-2 mb-4">
                            Caso suspeite de acesso não autorizado, você pode desconectar de todos os dispositivos.
                        </p>
                        <button onClick={handleLogoutAll} className="btn btn-danger">
                            🚪 Sair de todos os dispositivos
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
