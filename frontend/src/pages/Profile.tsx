import { useState, useEffect, FormEvent } from 'react';
import { UserCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardTitle } from '../components/ui/Card';

export function Profile() {
    const { updateUser } = useAuth();
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
            updateUser(data);
        } catch {
            // ignore
        }
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
            await api.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess('Foto atualizada com sucesso!');
            setPhoto(null);
            loadProfile();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao enviar foto');
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm('Tem certeza? Isso desconectara voce de todos os dispositivos, incluindo este.')) return;
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

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <PageHeader
                title="Meu Perfil"
                subtitle="Gerencie suas informações pessoais e configurações"
                icon={<UserCircle2 className="text-" />}
            />

            {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                    <span>OK</span> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                    <span>X</span> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <div className="text-center">
                            <div className="relative inline-block mb-4">
                                {profile.profilePhoto ? (
                                    <img
                                        src={profile.profilePhoto}
                                        alt="Foto de perfil"
                                        className="w-32 h-32 rounded-2xl object-cover border-4 border- shadow-xl"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from- to- flex items-center justify-center text-5xl text-gray-900 shadow-xl">
                                        {profile.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-">{profile.fullName}</h3>
                            <p className="text-sm text- mt-1">{profile.email}</p>

                            {profile.role && (
                                <span className="inline-block mt-3 badge badge-primary">
                                    {profile.role.name}
                                </span>
                            )}

                            <form onSubmit={handlePhotoUpload} className="mt-6 pt-6 border-t border-">
                                <div className="flex items-center gap-3">
                                    <label className="btn btn-secondary cursor-pointer">
                                        Escolher foto
                                        <input
                                            type="file"
                                            onChange={e => setPhoto(e.target.files?.[0] || null)}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-xs text-">
                                        {photo?.name || 'Nenhuma foto selecionada'}
                                    </span>
                                </div>
                                {photo && (
                                    <button type="submit" className="btn btn-primary mt-3 w-full">
                                        Enviar foto
                                    </button>
                                )}
                            </form>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <CardTitle icon={<UserCircle2 className="text-" />}>Informacoes Pessoais</CardTitle>
                            {!editing && (
                                <button onClick={handleEditClick} className="btn btn-secondary text-sm flex items-center gap-2">
                                    Editar
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
                                <p className="text-xs text- mt-1">O email nao pode ser alterado</p>
                            </div>

                            {editing && (
                                <div className="flex gap-3 pt-2">
                                    <button type="submit" className="btn btn-primary">
                                        Salvar
                                    </button>
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </form>
                    </Card>

                    <Card>
                        <CardTitle icon={<UserCircle2 className="text-" />}>Alterar Senha</CardTitle>
                        <form onSubmit={handleChangePassword} className="space-y-5 mt-6">
                            <div>
                                <label className="label">Senha Atual</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    required
                                    className="input"
                                    placeholder="--------"
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
                                    placeholder="--------"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                Alterar Senha
                            </button>
                        </form>
                    </Card>

                    <Card className="border-red-500/20 bg-red-500/5">
                        <CardTitle icon={<UserCircle2 className="text-" />} className="text-red-400">Zona de Perigo</CardTitle>
                        <p className="text-sm text- mt-2 mb-4">
                            Caso suspeite de acesso nao autorizado, voce pode desconectar de todos os dispositivos.
                        </p>
                        <button onClick={handleLogoutAll} className="btn btn-danger">
                            Sair de todos os dispositivos
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}

