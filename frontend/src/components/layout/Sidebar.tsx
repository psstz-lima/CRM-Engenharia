import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const menuItemStyle = (path: string) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 15px',
        color: isActive(path) ? '#2563eb' : '#374151',
        background: isActive(path) ? '#eff6ff' : 'transparent',
        textDecoration: 'none',
        borderRadius: '6px',
        fontWeight: isActive(path) ? '600' : '400',
        transition: 'all 0.2s'
    });

    const sectionTitleStyle = {
        padding: '15px 15px 8px',
        fontSize: '0.75em',
        fontWeight: '600',
        color: '#9ca3af',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px'
    };

    return (
        <aside style={{
            width: '240px',
            background: 'white',
            borderRight: '1px solid #e5e7eb',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Logo */}
            <div style={{ padding: '20px 15px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#1e40af' }}>🏗️ CRM Engenharia</span>
            </div>

            {/* Menu */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {/* Main */}
                <div style={sectionTitleStyle}>Principal</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li>
                        <Link to="/" style={menuItemStyle('/')}>
                            <span>📊</span>
                            <span>Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/profile" style={menuItemStyle('/profile')}>
                            <span>👤</span>
                            <span>Meu Perfil</span>
                        </Link>
                    </li>
                </ul>

                {/* Contracts & Measurements - check if user has any contract/measurement permission */}
                {hasAnyPermission(user, ['contracts_view', 'contracts_create', 'measurements_view']) && (
                    <>
                        <div style={sectionTitleStyle}>Operações</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {hasPermission(user, 'contracts_view') && (
                                <li>
                                    <Link to="/contracts" style={menuItemStyle('/contracts')}>
                                        <span>📄</span>
                                        <span>Contratos</span>
                                    </Link>
                                </li>
                            )}
                            {hasPermission(user, 'measurements_view') && (
                                <li>
                                    <Link to="/measurements" style={menuItemStyle('/measurements')}>
                                        <span>📏</span>
                                        <span>Medições</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </>
                )}

                {/* Companies - for users with companies permission or master */}
                {hasPermission(user, 'companies_view') && (
                    <>
                        <div style={sectionTitleStyle}>Cadastros</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li>
                                <Link to="/companies" style={menuItemStyle('/companies')}>
                                    <span>🏢</span>
                                    <span>Empresas</span>
                                </Link>
                            </li>
                        </ul>
                    </>
                )}

                {/* Admin section - requires admin permissions or master */}
                {hasAnyPermission(user, ['users_view', 'users_manage', 'admin_roles', 'admin_audit']) && (
                    <>
                        <div style={sectionTitleStyle}>Administração</div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {hasAnyPermission(user, ['users_view', 'users_manage']) && (
                                <li>
                                    <Link to="/admin/users" style={menuItemStyle('/admin/users')}>
                                        <span>👥</span>
                                        <span>Usuários</span>
                                    </Link>
                                </li>
                            )}
                            {hasPermission(user, 'companies_manage') && (
                                <li>
                                    <Link to="/admin/companies" style={menuItemStyle('/admin/companies')}>
                                        <span>🏢</span>
                                        <span>Empresas</span>
                                    </Link>
                                </li>
                            )}
                            {hasPermission(user, 'admin_roles') && (
                                <li>
                                    <Link to="/admin/roles" style={menuItemStyle('/admin/roles')}>
                                        <span>🔐</span>
                                        <span>Perfis</span>
                                    </Link>
                                </li>
                            )}
                            {hasPermission(user, 'admin_audit') && (
                                <li>
                                    <Link to="/admin/audit-logs" style={menuItemStyle('/admin/audit-logs')}>
                                        <span>📋</span>
                                        <span>Auditoria</span>
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </>
                )}
            </nav>

            {/* User info at bottom */}
            <div style={{
                padding: '15px',
                borderTop: '1px solid #e5e7eb',
                background: '#f9fafb',
                fontSize: '0.85em'
            }}>
                <div style={{ fontWeight: '500', color: '#374151' }}>{user?.fullName}</div>
                <div style={{ color: '#9ca3af', fontSize: '0.9em' }}>
                    {user?.isMaster ? '⭐ Master' : user?.role?.name || 'Sem perfil'}
                </div>
            </div>
        </aside>
    );
}
