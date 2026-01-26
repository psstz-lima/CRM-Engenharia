import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import {
    Building2,
    Edit2,
    Mail,
    Shield,
    Trash2,
    UserPlus,
    Users as UsersIcon
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { DraggableModal } from '../components/common/DraggableModal';

export function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [roleId, setRoleId] = useState('');
    const [password, setPassword] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editFullName, setEditFullName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editCompanyId, setEditCompanyId] = useState('');
    const [editRoleId, setEditRoleId] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);

    const [resetPassword, setResetPassword] = useState('');

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteFullName, setInviteFullName] = useState('');
    const [inviteCompanyId, setInviteCompanyId] = useState('');
    const [inviteRoleId, setInviteRoleId] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

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
            // noop
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

    const handleDelete = async (user: any) => {
        if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${user.fullName}"?

ATENÇÃO: Esta ação NÃO pode ser desfeita!`)) return;
        try {
            await api.delete(`/users/${user.id}`);
            loadData();
            alert('Usuário excluído com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir usuário');
        }
    };

    const filteredUsers = users.filter(u => {
        if (searchTerm && !u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !u.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterCompany && u.companyId !== filterCompany) return false;
        if (filterRole && u.roleId !== filterRole) return false;
        if (filterStatus === 'active' && !u.isActive) return false;
        if (filterStatus === 'inactive' && u.isActive) return false;
        return true;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Gestão de Usuários"
                subtitle="Gerencie o acesso e permissões dos usuários do sistema."
                icon={<UsersIcon className="text-" />}
                actions={
                    <div className="flex gap-3">
                        <button onClick={() => setShowInviteModal(true)} className="btn btn-secondary flex items-center gap-2">
                            <Mail size={16} />
                            Convidar usuário
                        </button>
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center gap-2">
                            <UserPlus size={16} />
                            Novo usuário
                        </button>
                    </div>
                }
            />

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg- text- text-xs uppercase font-semibold border-b border-">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Empresa</th>
                                <th className="p-4">Perfil</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg- transition-colors text-sm group">
                                        <td className="p-4 font-medium text- flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from- to- flex items-center justify-center text-gray-900 font-bold text-sm ring-1 ring-">
                                                {user.fullName.substring(0, 2).toUpperCase()}
                                            </div>
                                            {user.fullName}
                                        </td>
                                        <td className="p-4 text-">{user.email}</td>
                                        <td className="p-4 text- flex items-center gap-2">
                                            {user.company?.name ? (
                                                <>
                                                    <Building2 size={14} className="opacity-50" />
                                                    {user.company.name}
                                                </>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-">
                                            {user.role?.name ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg- text-xs border border- font-medium">
                                                    <Shield size={10} className="opacity-70" />
                                                    {user.role.name}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${user.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                    }`}>
                                                    {user.isActive ? 'ATIVO' : 'INATIVO'}
                                                </span>
                                                {user.isMaster && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                                        MASTER
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 rounded-lg hover:bg- text- hover:text- transition-colors"
                                                    title="Editar usuário"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text- hover:text-red-500 transition-colors"
                                                    title="Excluir usuário"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showInviteModal && (
                <DraggableModal
                    isOpen={showInviteModal}
                    onClose={() => setShowInviteModal(false)}
                    title="Convidar usuário"
                    width="720px"
                    className="max-w-[96vw]"
                >
                    <form onSubmit={handleInvite} className="grid gap-4">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 text-sm flex gap-3">
                            <Mail size={18} />
                            O usuário receberá um e-mail com um link para definir sua senha.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nome completo</label>
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
                                <label className="label">Perfil de acesso</label>
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
                            <button type="submit" className="btn btn-primary">Enviar convite</button>
                        </div>
                    </form>
                </DraggableModal>
            )}

            {showCreateModal && (
                <DraggableModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Novo usuário"
                    width="820px"
                    className="max-w-[96vw]"
                >
                    <form onSubmit={handleCreate} className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nome completo</label>
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
                                <label className="label">Perfil de acesso</label>
                                <select value={roleId} onChange={e => setRoleId(e.target.value)} required className="input">
                                    <option value="">Selecione...</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Senha inicial</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input" />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                            <button type="submit" className="btn btn-primary">Criar usuário</button>
                        </div>
                    </form>
                </DraggableModal>
            )}

            {showEditModal && editingUser && (
                <DraggableModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Editar usuário"
                    width="820px"
                    className="max-w-[96vw]"
                >
                    <form onSubmit={handleUpdate} className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Nome completo</label>
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
                                <label className="label">Perfil de acesso</label>
                                <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)} required className="input">
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 bg- rounded-lg border border-">
                            <label className="flex items-center cursor-pointer gap-3 text- select-none">
                                <input
                                    type="checkbox"
                                    checked={editIsActive}
                                    onChange={e => setEditIsActive(e.target.checked)}
                                    className="rounded border- bg- text-primary-600 focus:ring-primary-500 w-5 h-5"
                                />
                                <span className="font-medium">Usuário ativo</span>
                            </label>
                        </div>

                        <div className="border-t border- pt-6 mt-2">
                            <label className="label text-amber-600 font-bold mb-2 block">Redefinir senha (opcional)</label>
                            <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Nova senha" className="input border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20" />
                            <p className="text-xs text- mt-2">Preencha apenas se desejar alterar a senha do usuário.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
                            <button type="submit" className="btn btn-primary">Salvar alterações</button>
                        </div>
                    </form>
                </DraggableModal>
            )}
        </div>
    );
}



