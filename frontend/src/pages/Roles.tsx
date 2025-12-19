import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

// Permission categories with granular permissions
const permissionCategories = [
    {
        name: 'Contratos',
        icon: '📄',
        permissions: [
            { key: 'contracts_view', label: 'Visualizar' },
            { key: 'contracts_create', label: 'Criar' },
            { key: 'contracts_edit', label: 'Editar' },
            { key: 'contracts_delete', label: 'Excluir' },
        ]
    },
    {
        name: 'Medições',
        icon: '📏',
        permissions: [
            { key: 'measurements_view', label: 'Visualizar' },
            { key: 'measurements_create', label: 'Criar' },
            { key: 'measurements_edit', label: 'Editar' },
            { key: 'measurements_close', label: 'Encerrar' },
        ]
    },
    {
        name: 'Aditivos',
        icon: '📝',
        permissions: [
            { key: 'addendums_view', label: 'Visualizar' },
            { key: 'addendums_create', label: 'Criar' },
            { key: 'addendums_approve', label: 'Aprovar' },
        ]
    },
    {
        name: 'Empresas',
        icon: '🏢',
        permissions: [
            { key: 'companies_view', label: 'Visualizar' },
            { key: 'companies_manage', label: 'Gerenciar' },
        ]
    },
    {
        name: 'Usuários',
        icon: '👥',
        permissions: [
            { key: 'users_view', label: 'Visualizar' },
            { key: 'users_manage', label: 'Gerenciar' },
        ]
    },
    {
        name: 'Relatórios',
        icon: '📊',
        permissions: [
            { key: 'reports_view', label: 'Visualizar' },
            { key: 'reports_export', label: 'Exportar' },
        ]
    },
    {
        name: 'Administração',
        icon: '⚙️',
        permissions: [
            { key: 'admin_roles', label: 'Perfis' },
            { key: 'admin_audit', label: 'Auditoria' },
        ]
    },
];

// Predefined role templates
const predefinedRoles = [
    {
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        permissions: Object.fromEntries(
            permissionCategories.flatMap(c => c.permissions.map(p => [p.key, true]))
        )
    },
    {
        name: 'Gestor de Contratos',
        description: 'Gerencia contratos e aditivos',
        permissions: {
            contracts_view: true, contracts_create: true, contracts_edit: true, contracts_delete: true,
            addendums_view: true, addendums_create: true, addendums_approve: true,
            measurements_view: true, reports_view: true, reports_export: true
        }
    },
    {
        name: 'Engenheiro de Medição',
        description: 'Executa e gerencia medições',
        permissions: {
            contracts_view: true,
            measurements_view: true, measurements_create: true, measurements_edit: true, measurements_close: true,
            addendums_view: true, reports_view: true
        }
    },
    {
        name: 'Visualizador',
        description: 'Apenas consulta (somente leitura)',
        permissions: {
            contracts_view: true, measurements_view: true, addendums_view: true,
            companies_view: true, reports_view: true
        }
    },
];

export function Roles() {
    const [roles, setRoles] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<any>({});

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPermissions, setEditPermissions] = useState<any>({});
    const [editIsActive, setEditIsActive] = useState(true);

    const [showTemplateModal, setShowTemplateModal] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const { data } = await api.get('/roles');
            setRoles(data);
        } catch { }
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/roles', { name, description, permissions });
            setShowCreateModal(false);
            loadRoles();
            setName('');
            setDescription('');
            setPermissions({});
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar perfil');
        }
    };

    const openEditModal = (role: any) => {
        setEditingRole(role);
        setEditName(role.name || '');
        setEditDescription(role.description || '');
        setEditPermissions(role.permissions || {});
        setEditIsActive(role.isActive);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/roles/${editingRole.id}`, {
                name: editName,
                description: editDescription,
                permissions: editPermissions,
                isActive: editIsActive
            });
            setShowEditModal(false);
            loadRoles();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao atualizar perfil');
        }
    };

    const togglePermission = (key: string, isEdit = false) => {
        if (isEdit) {
            setEditPermissions((prev: any) => ({ ...prev, [key]: !prev[key] }));
        } else {
            setPermissions((prev: any) => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const toggleAllInCategory = (category: typeof permissionCategories[0], isEdit = false) => {
        const allChecked = category.permissions.every(p =>
            isEdit ? editPermissions[p.key] : permissions[p.key]
        );
        const newValue = !allChecked;
        if (isEdit) {
            setEditPermissions((prev: any) => {
                const next = { ...prev };
                category.permissions.forEach(p => { next[p.key] = newValue; });
                return next;
            });
        } else {
            setPermissions((prev: any) => {
                const next = { ...prev };
                category.permissions.forEach(p => { next[p.key] = newValue; });
                return next;
            });
        }
    };

    const applyTemplate = async (template: typeof predefinedRoles[0]) => {
        try {
            await api.post('/roles', {
                name: template.name,
                description: template.description,
                permissions: template.permissions
            });
            loadRoles();
            setShowTemplateModal(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar perfil');
        }
    };

    const countPermissions = (perms: any) => {
        return Object.values(perms || {}).filter(Boolean).length;
    };

    // Permission grid component
    const PermissionGrid = ({ perms, isEdit }: { perms: any; isEdit: boolean }) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
            {permissionCategories.map(cat => (
                <div key={cat.name} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div
                        onClick={() => toggleAllInCategory(cat, isEdit)}
                        style={{
                            padding: '10px 12px',
                            background: '#f1f5f9',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9em'
                        }}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8em', color: '#6b7280' }}>
                            ({cat.permissions.filter(p => perms[p.key]).length}/{cat.permissions.length})
                        </span>
                    </div>
                    <div style={{ padding: '8px' }}>
                        {cat.permissions.map(p => (
                            <label key={p.key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontSize: '0.85em'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={perms[p.key] || false}
                                    onChange={() => togglePermission(p.key, isEdit)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                {p.label}
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>🔐 Gestão de Perfis</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        style={{ padding: '10px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        📋 Usar Template
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{ padding: '10px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        + Novo Perfil
                    </button>
                </div>
            </div>

            {/* Roles Table */}
            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600' }}>Nome</th>
                            <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '600' }}>Descrição</th>
                            <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '600' }}>Permissões</th>
                            <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '600' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(role => (
                            <tr key={role.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px 15px', fontWeight: '500' }}>{role.name}</td>
                                <td style={{ padding: '12px 15px', color: '#6b7280' }}>{role.description || '-'}</td>
                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        background: '#e0f2fe',
                                        color: '#0369a1',
                                        borderRadius: '20px',
                                        fontSize: '0.85em',
                                        fontWeight: '500'
                                    }}>
                                        {countPermissions(role.permissions)} ativas
                                    </span>
                                </td>
                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        background: role.isActive ? '#dcfce7' : '#fee2e2',
                                        color: role.isActive ? '#166534' : '#991b1b',
                                        borderRadius: '20px',
                                        fontSize: '0.85em',
                                        fontWeight: '500'
                                    }}>
                                        {role.isActive ? '✓ Ativo' : '✕ Inativo'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => openEditModal(role)}
                                        style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}
                                    >
                                        ✏️ Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {roles.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                                    Nenhum perfil cadastrado. Clique em "Usar Template" para começar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>➕ Novo Perfil</h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nome *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descrição</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Permissões (clique no cabeçalho para marcar/desmarcar todos)</label>
                                <PermissionGrid perms={permissions} isEdit={false} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Criar Perfil</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingRole && (
                <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>✏️ Editar Perfil</h3>
                        <form onSubmit={handleUpdate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nome *</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Descrição</label>
                                    <input
                                        type="text"
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>Permissões</label>
                                <PermissionGrid perms={editPermissions} isEdit={true} />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editIsActive}
                                        onChange={e => setEditIsActive(e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontWeight: '500' }}>Perfil Ativo</span>
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div onClick={() => setShowTemplateModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <h3 style={{ margin: '0 0 20px 0' }}>📋 Criar Perfil a partir de Template</h3>
                        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Selecione um template para criar rapidamente um perfil com permissões pré-configuradas:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {predefinedRoles.map(template => (
                                <button
                                    key={template.name}
                                    onClick={() => applyTemplate(template)}
                                    style={{
                                        padding: '15px',
                                        background: '#f8fafc',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#e0f2fe'}
                                    onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                                >
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{template.name}</div>
                                    <div style={{ fontSize: '0.85em', color: '#6b7280' }}>{template.description}</div>
                                    <div style={{ fontSize: '0.8em', color: '#0369a1', marginTop: '6px' }}>
                                        {Object.keys(template.permissions).length} permissões
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button onClick={() => setShowTemplateModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
