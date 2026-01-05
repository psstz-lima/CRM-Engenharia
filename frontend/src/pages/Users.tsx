import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { Users as UsersIcon, UserPlus, Mail, Edit2, Shield, Building2 } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

export function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para Criação
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [roleId, setRoleId] = useState('');
    const [password, setPassword] = useState('');

    // Estados para Edição
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editFullName, setEditFullName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editCompanyId, setEditCompanyId] = useState('');
    const [editRoleId, setEditRoleId] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);

    // Estado para Reset de Senha
    const [resetPassword, setResetPassword] = useState('');

    // Estado Convite
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteFullName, setInviteFullName] = useState('');
    const [inviteCompanyId, setInviteCompanyId] = useState('');
    const [inviteRoleId, setInviteRoleId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, companiesRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/companies'),
                api.get('/roles')
            ]);
            setUsers(usersRes.data.data || usersRes.data);
            setCompanies(companiesRes.data);
            setRoles(rolesRes.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', { email, fullName, companyId, roleId, password });
            setShowCreateModal(false);
            loadData();
            setEmail('');
            setFullName('');
            setPassword('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar usuário');
        }
    };

    const handleInvite = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users/invite', {
                email: inviteEmail,
                fullName: inviteFullName,
                companyId: inviteCompanyId,
                roleId: inviteRoleId
            });
            setShowInviteModal(false);
            loadData();
            setInviteEmail('');
            setInviteFullName('');
            setInviteCompanyId('');
            setInviteRoleId('');
            alert('Convite enviado com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao enviar convite');
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setEditFullName(user.fullName || '');
        setEditEmail(user.email || '');
        setEditCompanyId(user.companyId || '');
        setEditRoleId(user.roleId || '');
        setEditIsActive(user.isActive);
        setResetPassword('');
        setShowEditModal(true);
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/users/${editingUser.id}`, {
                fullName: editFullName,
                email: editEmail,
                companyId: editCompanyId,
                roleId: editRoleId,
                isActive: editIsActive
            });

            if (resetPassword) {
                await api.patch(`/users/${editingUser.id}/reset-password`, { newPassword: resetPassword });
            }

            setShowEditModal(false);
            loadData();
            alert('Usuário atualizado com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao atualizar usuário');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Gestão de Usuários"
                subtitle="Gerencie o acesso e permissões dos usuários do sistema."
                icon={<UsersIcon className="text-[var(--accent-primary)]" />}
                actions={
                    <div className="flex gap-3">
                        <button onClick={() => setShowInviteModal(true)} className="btn btn-secondary flex items-center gap-2">
                            <Mail size={16} />
                            Convidar Usuário
                        </button>
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
                            <UserPlus size={16} />
                            Novo Usuário
                        </button>
                    </div>
                }
            />

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase font-semibold border-b border-[var(--border-subtle)]">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Empresa</th>
                                <th className="p-4">Perfil (Role)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="hover:bg-[var(--bg-hover)] transition-colors text-sm group">
                                        <td className="p-4 font-medium text-[var(--text-primary)] flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm ring-1 ring-primary-500/30">
                                                {user.fullName.substring(0, 2).toUpperCase()}
                                            </div>
                                            {user.fullName}
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">{user.email}</td>
                                        <td className="p-4 text-[var(--text-secondary)] flex items-center gap-2">
                                            {user.company?.name ? (
                                                <>
                                                    <Building2 size={14} className="opacity-50" />
                                                    {user.company.name}
                                                </>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            {user.role?.name ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] text-xs border border-[var(--border-subtle)] font-medium">
                                                    <Shield size={10} className="opacity-70" />
                                                    {user.role.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${user.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {user.isActive ? 'ATIVO' : 'INATIVO'}
                                                </span>
                                                {user.isMaster && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                        MASTER
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                                                title="Editar Usuário"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Convite */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Convidar Usuário</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm mb-4 flex gap-3">
                                <span className="text-lg">ℹ️</span>
                                O usuário receberá um e-mail com um link para definir sua senha.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Nome Completo</label>
                                    <input type="text" value={inviteFullName} onChange={e => setInviteFullName(e.target.value)} required className="input" />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Empresa</label>
                                    <select value={inviteCompanyId} onChange={e => setInviteCompanyId(e.target.value)} required className="input">
                                        <option value="">Selecione...</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Perfil de Acesso</label>
                                    <select value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)} required className="input">
                                        <option value="">Selecione...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Enviar Convite</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Criação */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Novo Usuário</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Nome Completo</label>
                                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="input" />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Empresa</label>
                                    <select value={companyId} onChange={e => setCompanyId(e.target.value)} required className="input">
                                        <option value="">Selecione...</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Perfil de Acesso</label>
                                    <select value={roleId} onChange={e => setRoleId(e.target.value)} required className="input">
                                        <option value="">Selecione...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="label">Senha Inicial</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Criar Usuário</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {showEditModal && editingUser && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Editar Usuário</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Nome Completo</label>
                                    <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} required className="input" />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Empresa</label>
                                    <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)} required className="input">
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Perfil de Acesso</label>
                                    <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)} required className="input">
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                                <label className="flex items-center cursor-pointer gap-3 text-[var(--text-secondary)] select-none">
                                    <input
                                        type="checkbox"
                                        checked={editIsActive}
                                        onChange={e => setEditIsActive(e.target.checked)}
                                        className="rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-primary-600 focus:ring-primary-500 w-5 h-5"
                                    />
                                    <span className="font-medium">Usuário Ativo</span>
                                </label>
                            </div>

                            <div className="border-t border-[var(--border-subtle)] pt-6 mt-2">
                                <label className="label text-amber-500 font-bold mb-2 block">Redefinir Senha (opcional)</label>
                                <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Nova senha" className="input border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20" />
                                <p className="text-xs text-[var(--text-muted)] mt-2">Preencha apenas se desejar alterar a senha do usuário.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
