import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Helper to check if user has a specific permission
const hasPermission = (user: any, permission: string): boolean => {
    if (user?.isMaster) return true;
    const perms = user?.role?.permissions || {};
    return perms.all === true || perms[permission] === true;
};

// Helper to check if user has any of the permissions
const hasAnyPermission = (user: any, permissions: string[]): boolean => {
    if (user?.isMaster) return true;
    const perms = user?.role?.permissions || {};
    if (perms.all === true) return true;
    return permissions.some(p => perms[p] === true);
};

export function Sidebar() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavItem = ({ to, icon, label }: { to: string, icon: string, label: string }) => (
        <li>
            <Link
                to={to}
                className={`sidebar-item ${isActive(to) ? 'sidebar-item-active' : ''}`}
            >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
            </Link>
        </li>
    );

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <div className="px-4 py-2 mt-6 mb-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">
            {children}
        </div>
    );

    return (
        <aside className="sidebar fixed left-0 top-0 h-screen w-64 flex flex-col z-40">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border-subtle)]">
                <span className="text-xl font-bold flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-sm shadow-lg">
                        🏗️
                    </span>
                    <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                        CRM Engenharia
                    </span>
                </span>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
                <SectionTitle>Principal</SectionTitle>
                <ul className="space-y-1">
                    <NavItem to="/" icon="📊" label="Dashboard" />
                    <NavItem to="/profile" icon="👤" label="Meu Perfil" />
                </ul>

                {/* Operations */}
                {hasAnyPermission(user, ['contracts_view', 'contracts_create', 'measurements_view']) && (
                    <>
                        <SectionTitle>Operações</SectionTitle>
                        <ul className="space-y-1">
                            {hasPermission(user, 'contracts_view') && (
                                <NavItem to="/contracts" icon="📄" label="Contratos" />
                            )}
                            {hasPermission(user, 'measurements_view') && (
                                <NavItem to="/measurements" icon="📏" label="Medições" />
                            )}
                        </ul>
                    </>
                )}

                {/* Companies */}
                {hasPermission(user, 'companies_view') && (
                    <>
                        <SectionTitle>Cadastros</SectionTitle>
                        <ul className="space-y-1">
                            <NavItem to="/companies" icon="🏢" label="Empresas" />
                        </ul>
                    </>
                )}

                {/* Administration */}
                {hasAnyPermission(user, ['users_view', 'users_manage', 'admin_roles', 'admin_audit']) && (
                    <>
                        <SectionTitle>Administração</SectionTitle>
                        <ul className="space-y-1">
                            {hasAnyPermission(user, ['users_view', 'users_manage']) && (
                                <NavItem to="/admin/users" icon="👥" label="Usuários" />
                            )}
                            {hasPermission(user, 'companies_manage') && (
                                <NavItem to="/admin/companies" icon="🏢" label="Empresas" />
                            )}
                            {hasPermission(user, 'admin_roles') && (
                                <NavItem to="/admin/roles" icon="🔐" label="Perfis" />
                            )}
                            {hasPermission(user, 'admin_audit') && (
                                <NavItem to="/admin/audit-logs" icon="📋" label="Auditoria" />
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-medium shadow-lg overflow-hidden">
                        {user?.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            user?.fullName?.charAt(0)?.toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {user?.fullName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1">
                            {user?.isMaster && <span className="text-amber-400">⭐</span>}
                            {user?.isMaster ? 'Master' : user?.role?.name || 'Sem perfil'}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
