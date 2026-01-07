import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import {
    Users,
    Shield,
    Building2,
    Scale,
    Award,
    ClipboardList,
    Settings,
    ChevronRight,
    LucideIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AdminModuleCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    to: string;
    colorClass: string;
    permission?: string;
    requiredPermissions?: string[];
}

export function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Helper to check permissions (duplicated from Sidebar, could be a hook)
    const hasPermission = (permission: string): boolean => {
        if (user?.isMaster) return true;
        const perms = user?.role?.permissions || {};
        return perms.all === true || perms[permission] === true;
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        if (user?.isMaster) return true;
        const perms = user?.role?.permissions || {};
        if (perms.all === true) return true;
        return permissions.some(p => perms[p] === true);
    };

    const modules: AdminModuleCardProps[] = [
        {
            title: 'Usuários',
            description: 'Gerencie o acesso, convites e resets de senha.',
            icon: Users,
            to: '/admin/users',
            colorClass: 'text-blue-500 bg-blue-500/10',
            requiredPermissions: ['users_view', 'users_manage']
        },
        {
            title: 'Empresas',
            description: 'Cadastro de clientes, parceiros e fornecedores.',
            icon: Building2,
            to: '/admin/companies',
            colorClass: 'text-purple-500 bg-purple-500/10',
            permission: 'companies_manage'
        },
        {
            title: 'Perfis & Permissões',
            description: 'Defina o que cada função pode fazer no sistema.',
            icon: Shield,
            to: '/admin/roles',
            colorClass: 'text-orange-500 bg-orange-500/10',
            permission: 'admin_roles'
        },
        {
            title: 'Níveis de Aprovação',
            description: 'Configure a hierarquia de aprovação (Engenharia, Financeiro...).',
            icon: Award,
            to: '/admin/approval-levels',
            colorClass: 'text-yellow-500 bg-yellow-500/10',
            permission: 'admin_roles' // Using same permission for now
        },
        {
            title: 'Unidades de Medida',
            description: 'Padronize as unidades utilizadas em contratos (m, kg, vb).',
            icon: Scale,
            to: '/admin/units',
            colorClass: 'text-emerald-500 bg-emerald-500/10',
            requiredPermissions: ['admin_roles', 'users_manage'] // Loose permission
        },
        {
            title: 'Auditoria',
            description: 'Histórico completo de ações e segurança.',
            icon: ClipboardList,
            to: '/admin/audit-logs',
            colorClass: 'text-slate-500 bg-slate-500/10',
            permission: 'admin_audit'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <PageHeader
                title="Administração"
                subtitle="Central de controle e configurações do sistema."
                icon={<Settings className="text-gray-700" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module, index) => {
                    const canAccess = module.permission
                        ? hasPermission(module.permission)
                        : module.requiredPermissions
                            ? hasAnyPermission(module.requiredPermissions)
                            : true;

                    if (!canAccess) return null;

                    return (
                        <div
                            key={index}
                            onClick={() => navigate(module.to)}
                            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer overflow-hidden relative"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${module.colorClass}`}>
                                        <module.icon size={24} />
                                    </div>
                                    <div className="p-2 text-gray-300 group-hover:text-primary-500 transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                            <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary-500/0 to-transparent group-hover:via-primary-500/50 transition-all absolute bottom-0" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
