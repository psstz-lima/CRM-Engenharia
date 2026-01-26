import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    BarChart3,
    BadgeCheck,
    BellRing,
    Building2,
    ClipboardList,
    Database,
    FileClock,
    FileText,
    FolderOpen,
    Gauge,
    KeyRound,
    LayoutDashboard,
    LayoutGrid,
    Library,
    LogOut,
    Ruler,
    Search,
    Send,
    ShieldCheck,
    Star,
    Tag,
    UserCircle2,
    Users
} from 'lucide-react';

const hasPermission = (user: any, permission: string): boolean => {
    if (user?.isMaster) return true;
    const perms = user?.role?.permissions || {};
    if (perms.all === true) return true;

    const parts = permission.includes('_') ? permission.split('_') : permission.split('.');
    if (parts.length === 2) {
        const [module, action] = parts;
        return perms[module]?.[action] === true || perms[module] === true;
    }
    return perms[permission] === true || (typeof perms[permission] === 'object' && perms[permission] !== null);
};

const hasAnyPermission = (user: any, permissions: string[]): boolean => {
    if (user?.isMaster) return true;
    return permissions.some(p => hasPermission(user, p));
};

export function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
        const active = isActive(to);
        return (
            <li>
                <Link to={to} className={`sidebar-link ${active ? 'active' : ''}`}>
                    <span className="sidebar-icon">{icon}</span>
                    <span>{label}</span>
                </Link>
            </li>
        );
    };

    const NavGroup = ({ label, icon, children, paths = [] }: { label: string, icon: React.ReactNode, children: React.ReactNode, paths?: string[] }) => {
        const isChildActive = paths.some(path => location.pathname.startsWith(path));
        const [isOpen, setIsOpen] = useState(isChildActive);

        useEffect(() => {
            if (isChildActive) setIsOpen(true);
        }, [isChildActive]);

        return (
            <li>
                <button
                    type="button"
                    className="sidebar-group-btn"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="sidebar-group-label">
                        <span className="sidebar-icon">{icon}</span>
                        <span>{label}</span>
                    </div>
                </button>
                {isOpen && (
                    <ul className="sidebar-group-list">
                        {children}
                    </ul>
                )}
            </li>
        );
    };

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <div className="sidebar-section-title">
            {children}
        </div>
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <img
                    src="/construsys-logo.png"
                    alt="ConstruSys"
                    width="180"
                />
            </div>

            <nav className="sidebar-nav">
                <SectionTitle>Principal</SectionTitle>
                <ul>
                    <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                    <NavItem to="/profile" icon={<UserCircle2 size={18} />} label="Meu Perfil" />
                </ul>

                {hasAnyPermission(user, ['contracts_view', 'contracts_create', 'measurements_view', 'tasks_view', 'tasks_manage']) && (
                    <>
                        <SectionTitle>Operações</SectionTitle>
                        <ul>
                            {hasPermission(user, 'contracts_view') && (
                                <NavItem to="/contracts" icon={<FileText size={18} />} label="Contratos" />
                            )}
                            {hasPermission(user, 'measurements_view') && (
                                <NavItem to="/measurements" icon={<Ruler size={18} />} label="Medições" />
                            )}
                            {hasAnyPermission(user, ['tasks_view', 'tasks_manage']) && (
                                <NavItem to="/tasks" icon={<ClipboardList size={18} />} label="Tarefas" />
                            )}
                        </ul>
                    </>
                )}

                <SectionTitle>Projetos</SectionTitle>
                <ul>
                    <NavGroup
                        label="Documentação"
                        icon={<FolderOpen size={18} />}
                        paths={['/projects', '/documents', '/documents/categories', '/grd', '/analysis']}
                    >
                        <NavItem to="/projects" icon={<LayoutGrid size={18} />} label="Visão Geral" />
                        <NavItem to="/documents" icon={<Library size={18} />} label="Biblioteca de Projetos" />
                        <NavItem to="/documents/categories" icon={<Tag size={18} />} label="Categorias" />
                        <NavItem to="/grd" icon={<Send size={18} />} label="GRD" />
                        <NavItem to="/analysis" icon={<Search size={18} />} label="Análise Crítica" />
                        <NavItem to="/projects/sla" icon={<BarChart3 size={18} />} label="Dashboard SLA" />
                    </NavGroup>
                </ul>

                {hasAnyPermission(user, ['users_view', 'users_manage', 'admin_roles', 'admin_audit']) && (
                    <>
                        <SectionTitle>Administração</SectionTitle>
                        <ul>
                            <NavItem to="/admin" icon={<Gauge size={18} />} label="Visão Geral" />

                            {hasAnyPermission(user, ['users_view', 'users_manage', 'admin_roles']) && (
                                <NavGroup
                                    label="Controle de Acesso"
                                    icon={<ShieldCheck size={18} />}
                                    paths={['/admin/users', '/admin/roles']}
                                >
                                    {hasAnyPermission(user, ['users_view', 'users_manage']) && (
                                        <NavItem to="/admin/users" icon={<Users size={18} />} label="Usuários" />
                                    )}
                                    {hasPermission(user, 'admin_roles') && (
                                        <NavItem to="/admin/roles" icon={<KeyRound size={18} />} label="Perfis" />
                                    )}
                                </NavGroup>
                            )}

                            {hasAnyPermission(user, ['companies_manage', 'admin_roles', 'admin_settings', 'users_manage']) && (
                                <NavGroup
                                    label="Cadastros"
                                    icon={<Database size={18} />}
                                    paths={['/admin/companies', '/admin/units', '/admin/approval-levels']}
                                >
                                    {hasPermission(user, 'companies_manage') && (
                                        <NavItem to="/admin/companies" icon={<Building2 size={18} />} label="Empresas" />
                                    )}
                                    {hasAnyPermission(user, ['admin_roles', 'users_manage']) && (
                                        <NavItem to="/admin/units" icon={<Ruler size={18} />} label="Unidades" />
                                    )}
                                    {hasPermission(user, 'admin_roles') && (
                                        <NavItem to="/admin/approval-levels" icon={<BadgeCheck size={18} />} label="Níveis Aprov." />
                                    )}
                                </NavGroup>
                            )}

                            {hasAnyPermission(user, ['admin_audit', 'admin_settings']) && (
                                <NavGroup
                                    label="Sistema"
                                    icon={<LayoutDashboard size={18} />}
                                    paths={['/admin/audit-logs', '/admin/alert-rules']}
                                >
                                    {hasPermission(user, 'admin_audit') && (
                                        <NavItem to="/admin/audit-logs" icon={<FileClock size={18} />} label="Auditoria" />
                                    )}
                                    {hasPermission(user, 'admin_settings') && (
                                        <NavItem to="/admin/alert-rules" icon={<BellRing size={18} />} label="Regras de Alerta" />
                                    )}
                                </NavGroup>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            <div className="sidebar-user">
                <div className="sidebar-user-avatar">
                    {user?.profilePhoto ? (
                        <img
                            src={user.profilePhoto}
                            alt={user.fullName}
                            width="40"
                        />
                    ) : (
                        <span>
                            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    )}
                </div>
                <div className="sidebar-user-meta">
                    <div>
                        {user?.fullName}
                    </div>
                    <div>
                        {user?.isMaster && <Star size={14} className="text-amber-500" />}
                        {user?.isMaster ? 'Master' : user?.role?.name || 'Sem perfil'}
                    </div>
                </div>
                <button
                    onClick={logout}
                    title="Sair"
                    className="icon-button"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}


