import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';
import { Lock, Edit2, Plus, LayoutTemplate, Shield, Users, Building2, FileText, Ruler, ScrollText, BarChart3, Settings, AlertCircle, Copy, Check, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';

// Permission categories with granular permissions
const permissionCategories = [
    {
        name: 'Contratos',
        icon: <FileText size={18} />,
        permissions: [
            { key: 'contracts_view', label: 'Visualizar' },
            { key: 'contracts_create', label: 'Criar' },
            { key: 'contracts_edit', label: 'Editar' },
            { key: 'contracts_delete', label: 'Excluir' },
        ]
    },
    {
        name: 'Medições',
        icon: <Ruler size={18} />,
        permissions: [
            { key: 'measurements_view', label: 'Visualizar' },
            { key: 'measurements_create', label: 'Criar' },
            { key: 'measurements_edit', label: 'Editar' },
            { key: 'measurements_close', label: 'Encerrar' },
        ]
    },
    {
        name: 'Aditivos',
        icon: <ScrollText size={18} />,
        permissions: [
            { key: 'addendums_view', label: 'Visualizar' },
            { key: 'addendums_create', label: 'Criar' },
            { key: 'addendums_approve', label: 'Aprovar' },
        ]
    },
    {
        name: 'Empresas',
        icon: <Building2 size={18} />,
        permissions: [
            { key: 'companies_view', label: 'Visualizar' },
            { key: 'companies_manage', label: 'Gerenciar' },
        ]
    },
    {
        name: 'Usuários',
        icon: <Users size={18} />,
        permissions: [
            { key: 'users_view', label: 'Visualizar' },
            { key: 'users_manage', label: 'Gerenciar' },
        ]
    },
    {
        name: 'Relatórios',
        icon: <BarChart3 size={18} />,
        permissions: [
            { key: 'reports_view', label: 'Visualizar' },
            { key: 'reports_export', label: 'Exportar' },
        ]
    },
    {
        name: 'Administração',
        icon: <Settings size={18} />,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
            {permissionCategories.map(cat => (
                <div key={cat.name} className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                    <div
                        onClick={() => toggleAllInCategory(cat, isEdit)}
                        className="px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        <span className="text-[var(--accent-primary)]">{cat.icon}</span>
                        <span className="font-semibold text-[var(--text-primary)] text-sm">{cat.name}</span>
                        <span className="ml-auto text-xs text-gray-400">
                            ({cat.permissions.filter(p => perms[p.key]).length}/{cat.permissions.length})
                        </span>
                    </div>
                    <div className="p-3 space-y-2">
                        {cat.permissions.map(p => (
                            <label key={p.key} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${perms[p.key] ? 'bg-[var(--accent-glow)] text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                                <input
                                    type="checkbox"
                                    checked={perms[p.key] || false}
                                    onChange={() => togglePermission(p.key, isEdit)}
                                    className="w-4 h-4 rounded border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Gestão de Perfis"
                subtitle="Gerencie os níveis de acesso e permissões dos usuários do sistema."
                icon={<Lock className="text-[var(--accent-primary)]" />}
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <LayoutTemplate size={16} />
                            Usar Template
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Novo Perfil
                        </button>
                    </div>
                }
            />

            {/* Roles Table */}
            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase font-semibold border-b border-[var(--border-subtle)]">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4 text-center">Permissões</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {roles.map(role => (
                                <tr key={role.id} className="hover:bg-[var(--bg-hover)] transition-colors text-sm group">
                                    <td className="p-4 font-medium text-[var(--text-primary)]">{role.name}</td>
                                    <td className="p-4 text-[var(--text-secondary)]">{role.description || '-'}</td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-full text-xs font-medium border border-[var(--border-subtle)]">
                                            <Shield size={10} className="opacity-70" />
                                            {countPermissions(role.permissions)} ativas
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${role.isActive
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                            {role.isActive ? <Check size={12} /> : <X size={12} />}
                                            {role.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => openEditModal(role)}
                                            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                                            title="Editar perfil"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {roles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-[var(--text-muted)]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                                <AlertCircle size={32} className="opacity-50" />
                                            </div>
                                            <p className="text-lg">Nenhum perfil cadastrado.</p>
                                            <button
                                                onClick={() => setShowTemplateModal(true)}
                                                className="text-primary-400 hover:underline mt-2"
                                            >
                                                Clique aqui para usar um template
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Modal */}
            {
                showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal-content w-full max-w-4xl m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Plus size={20} className="text-[var(--accent-primary)]" />
                                    Novo Perfil
                                </h3>
                                <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="label">Nome *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                            placeholder="Ex: Gerente de Projetos"
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Descrição</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Breve descrição do papel deste perfil"
                                        />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="label mb-2 flex justify-between items-end">
                                        <span>Permissões</span>
                                        <span className="text-xs text-[var(--text-muted)] font-normal">Clique no cabeçalho para marcar/desmarcar o grupo</span>
                                    </label>
                                    <PermissionGrid perms={permissions} isEdit={false} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Criar Perfil</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                showEditModal && editingRole && (
                    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                        <div className="modal-content w-full max-w-4xl m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Edit2 size={20} className="text-[var(--accent-primary)]" />
                                    Editar Perfil
                                </h3>
                                <button onClick={() => setShowEditModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="label">Nome *</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Descrição</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="label mb-2">Permissões</label>
                                    <PermissionGrid perms={editPermissions} isEdit={true} />
                                </div>
                                <div className="mb-6">
                                    <label className="flex items-center gap-3 p-4 bg-[var(--bg-elevated)] rounded-xl cursor-pointer hover:bg-[var(--bg-hover)] transition-colors border border-[var(--border-subtle)]">
                                        <input
                                            type="checkbox"
                                            checked={editIsActive}
                                            onChange={e => setEditIsActive(e.target.checked)}
                                            className="w-5 h-5 rounded border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                        />
                                        <span className="font-medium text-[var(--text-primary)]">Perfil Ativo</span>
                                        <span className="text-xs text-[var(--text-muted)] ml-auto">Perfis inativos não podem ser atribuídos</span>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
                                    <button type="submit" className="btn btn-primary">Salvar Alterações</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Template Modal */}
            {
                showTemplateModal && (
                    <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
                        <div className="modal-content w-full max-w-lg m-4" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-elevated)]">
                                <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <LayoutTemplate size={20} className="text-[var(--accent-primary)]" />
                                    Usar Template
                                </h3>
                                <button onClick={() => setShowTemplateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-400 mb-4">Selecione um template para criar rapidamente um perfil com permissões pré-configuradas:</p>
                                <div className="space-y-3">
                                    {predefinedRoles.map(template => (
                                        <button
                                            key={template.name}
                                            onClick={() => applyTemplate(template)}
                                            className="w-full text-left p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] rounded-xl transition-all group"
                                        >
                                            <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] mb-1 flex items-center gap-2">
                                                <Copy size={14} className="opacity-50" />
                                                {template.name}
                                            </div>
                                            <div className="text-sm text-[var(--text-secondary)] mb-2 pl-6">{template.description}</div>
                                            <div className="text-xs text-[var(--accent-primary)] font-medium pl-6">
                                                {Object.keys(template.permissions).length} permissões incluídas
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-[var(--bg-elevated)] rounded-b-2xl flex justify-end">
                                <button onClick={() => setShowTemplateModal(false)} className="btn btn-secondary text-sm">Fechar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
