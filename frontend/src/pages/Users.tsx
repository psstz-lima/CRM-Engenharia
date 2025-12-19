import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

export function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);

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
            const [usersRes, companiesRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/companies'),
                api.get('/roles')
            ]);
            setUsers(usersRes.data.data || usersRes.data);
            setCompanies(companiesRes.data);
            setRoles(rolesRes.data);
        } catch { }
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
        <div>
            <div>
                <div>
                    <h2>Gestão de Usuários</h2>
                    <div>
                        <button onClick={() => setShowInviteModal(true)}>Convidar Usuário</button>
                        <button onClick={() => setShowCreateModal(true)}>+ Novo Usuário</button>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Empresa</th>
                            <th>Perfil</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.fullName}</td>
                                <td>{user.email}</td>
                                <td>{user.company?.name || '-'}</td>
                                <td>{user.role?.name || '-'}</td>
                                <td>
                                    {user.isActive ? (
                                        <span>Ativo</span>
                                    ) : (
                                        <span>Inativo</span>
                                    )}
                                    {user.isMaster && <span>Master</span>}
                                </td>
                                <td>
                                    <button onClick={() => openEditModal(user)}>Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Convite */}
            {showInviteModal && (
                <div onClick={() => setShowInviteModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                        <h3>Convidar Usuário</h3>
                        <p>O usuário receberá um e-mail com link para definir a senha.</p>
                        <form onSubmit={handleInvite}>
                            <div>
                                <label>Email</label>
                                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label>Nome Completo</label>
                                <input type="text" value={inviteFullName} onChange={e => setInviteFullName(e.target.value)} required />
                            </div>
                            <div>
                                <label>Empresa</label>
                                <select value={inviteCompanyId} onChange={e => setInviteCompanyId(e.target.value)} required>
                                    <option value="">Selecione</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Perfil</label>
                                <select value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)} required>
                                    <option value="">Selecione</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button type="submit">Enviar Convite</button>
                                <button type="button" onClick={() => setShowInviteModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Criação */}
            {showCreateModal && (
                <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                        <h3>Novo Usuário</h3>
                        <form onSubmit={handleCreate}>
                            <div>
                                <label>Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label>Nome Completo</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                            </div>
                            <div>
                                <label>Empresa</label>
                                <select value={companyId} onChange={e => setCompanyId(e.target.value)} required>
                                    <option value="">Selecione</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Perfil</label>
                                <select value={roleId} onChange={e => setRoleId(e.target.value)} required>
                                    <option value="">Selecione</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Senha</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button type="submit">Criar</button>
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {showEditModal && editingUser && (
                <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                        <h3>Editar Usuário</h3>
                        <form onSubmit={handleUpdate}>
                            <div>
                                <label>Nome Completo</label>
                                <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} required />
                            </div>
                            <div>
                                <label>Email</label>
                                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
                            </div>
                            <div>
                                <label>Empresa</label>
                                <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)} required>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>Perfil</label>
                                <select value={editRoleId} onChange={e => setEditRoleId(e.target.value)} required>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label>
                                    <input type="checkbox" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} />
                                    Ativo
                                </label>
                            </div>
                            <hr />
                            <div>
                                <label>Redefinir Senha (opcional)</label>
                                <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="Nova senha" />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button type="submit">Salvar Alterações</button>
                                <button type="button" onClick={() => setShowEditModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
