import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight, LogOut } from 'lucide-react';

// Helper to check if user has a specific permission
// Permission format can be: 'users_view' or 'users.view' -> checks perms.users.view
const hasPermission = (user: any, permission: string): boolean => {
    if (user?.isMaster) return true;
    const perms = user?.role?.permissions || {};
    if (perms.all === true) return true;

    // Handle formats like 'contracts_view' -> 'contracts.view'
    const parts = permission.includes('_') ? permission.split('_') : permission.split('.');
    if (parts.length === 2) {
        const [module, action] = parts;
        return perms[module]?.[action] === true || perms[module] === true;
    }
    // Simple format: just check if module exists with any truthy value
    return perms[permission] === true || (typeof perms[permission] === 'object' && perms[permission] !== null);
};

// Helper to check if user has any of the permissions
const hasAnyPermission = (user: any, permissions: string[]): boolean => {
    if (user?.isMaster) return true;
    return permissions.some(p => hasPermission(user, p));
};

export function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => {
        return (
            <li>
                <Link to={to}>
                    <span>{icon}</span>
                    <span>{label}</span>
                </Link>
            </li>
        );
    };

    const NavGroup = ({ label, icon, children, paths = [] }: { label: string, icon: any, children: React.ReactNode, paths?: string[] }) => {
        const isChildActive = paths.some(path => location.pathname.startsWith(path));
        const [isOpen, setIsOpen] = useState(isChildActive);

        useEffect(() => {
            if (isChildActive) setIsOpen(true);
        }, [isChildActive]);

        return (
            <li>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div>
                        <span>{icon}</span>
                        <span>{label}</span>
                    </div>
                </button>
                {isOpen && (
                    <ul>
                        {children}
                    </ul>
                )}
            </li>
        );
    };

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <div>
            {children}
        </div>
    );

    return (
        <aside>
            {/* Logo */}
            <div>
                <img
                    src="/construsys-logo.png"
                    alt="ConstruSys"
                    width="150"
                />
            </div>

            {/* Menu */}
            <nav>
                <SectionTitle>Principal</SectionTitle>
                <ul>
                    <NavItem to="/" icon="📊" label="Dashboard" />
                    <NavItem to="/profile" icon="👤" label="Meu Perfil" />
                </ul>

                {/* Operations */}
                {hasAnyPermission(user, ['contracts_view', 'contracts_create', 'measurements_view']) && (
                    <>
                        <SectionTitle>Operações</SectionTitle>
                        <ul>
                            {hasPermission(user, 'contracts_view') && (
                                <NavItem to="/contracts" icon="📄" label="Contratos" />
                            )}
                            {hasPermission(user, 'measurements_view') && (
                                <NavItem to="/measurements" icon="📏" label="Medições" />
                            )}
                        </ul>
                    </>
                )}

                {/* Projetos - Documentação Técnica */}
                <SectionTitle>Projetos</SectionTitle>
                <ul>
                    <NavGroup
                        label="Documentação"
                        icon="📐"
                        paths={['/projects', '/documents', '/grd', '/analysis']}
                    >
                        <NavItem to="/projects" icon="📁" label="Visão Geral" />
                        <NavItem to="/documents" icon="📚" label="Biblioteca de Projetos" />
                        <NavItem to="/grd" icon="📬" label="GRD" />
                        <NavItem to="/analysis" icon="🔍" label="Análise Crítica" />
                        <NavItem to="/projects/sla" icon="📊" label="Dashboard SLA" />
                    </NavGroup>
                </ul>

                {/* Administration */}
                {hasAnyPermission(user, ['users_view', 'users_manage', 'admin_roles', 'admin_audit']) && (
                    <>
                        <SectionTitle>Administração</SectionTitle>
                        <ul>
                            <NavItem to="/admin" icon="⚙️" label="Visão Geral" />

                            {/* Access Control Group */}
                            {hasAnyPermission(user, ['users_view', 'users_manage', 'admin_roles']) && (
                                <NavGroup
                                    label="Controle de Acesso"
                                    icon="🛡️"
                                    paths={['/admin/users', '/admin/roles']}
                                >
                                    {hasAnyPermission(user, ['users_view', 'users_manage']) && (
                                        <NavItem to="/admin/users" icon="👥" label="Usuários" />
                                    )}
                                    {hasPermission(user, 'admin_roles') && (
                                        <NavItem to="/admin/roles" icon="🔐" label="Perfis" />
                                    )}
                                </NavGroup>
                            )}

                            {/* Cadastros Group */}
                            {hasAnyPermission(user, ['companies_manage', 'admin_roles', 'admin_settings', 'users_manage']) && (
                                <NavGroup
                                    label="Cadastros"
                                    icon="🗂️"
                                    paths={['/admin/companies', '/admin/units', '/admin/approval-levels']}
                                >
                                    {hasPermission(user, 'companies_manage') && (
                                        <NavItem to="/admin/companies" icon="🏢" label="Empresas" />
                                    )}
                                    {hasAnyPermission(user, ['admin_roles', 'users_manage']) && (
                                        <NavItem to="/admin/units" icon="⚖️" label="Unidades" />
                                    )}
                                    {hasPermission(user, 'admin_roles') && (
                                        <NavItem to="/admin/approval-levels" icon="🎖️" label="Níveis Aprov." />
                                    )}
                                </NavGroup>
                            )}

                            {/* System Group */}
                            {hasPermission(user, 'admin_audit') && (
                                <NavGroup
                                    label="Sistema"
                                    icon="🖥️"
                                    paths={['/admin/audit-logs']}
                                >
                                    <NavItem to="/admin/audit-logs" icon="📋" label="Auditoria" />
                                </NavGroup>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* User info */}
            <div>
                <div>
                    <div>
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
                    <div>
                        <div>
                            {user?.fullName}
                        </div>
                        <div>
                            {user?.isMaster && <span>⭐</span>}
                            {user?.isMaster ? 'Master' : user?.role?.name || 'Sem perfil'}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Sair"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
