import { useState, useEffect } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { ClipboardList, AlertCircle, Calendar, User, Activity, Database, Network } from 'lucide-react';

export function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get('/audit-logs')
            .then(res => setLogs(res.data.data || res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const getActionBadgeClass = (action: string) => {
        switch (action?.toUpperCase()) {
            case 'CREATE':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'UPDATE':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'DELETE':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'LOGIN':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            default:
                return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                    <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                    <p>Carregando logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Logs de Auditoria"
                subtitle="Histórico completo de ações e atividades realizadas no sistema."
                icon={<ClipboardList className="text-[var(--accent-primary)]" />}
            />

            <Card className="overflow-hidden border-none shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase font-semibold border-b border-[var(--border-subtle)]">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Ação</th>
                                <th className="p-4">Módulo</th>
                                <th className="p-4">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-[var(--text-muted)]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                                <AlertCircle size={32} className="opacity-50" />
                                            </div>
                                            <p className="text-lg">Nenhum log encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-[var(--bg-hover)] transition-colors text-sm group">
                                        <td className="p-4 text-[var(--text-secondary)] whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="opacity-50" />
                                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="p-4 font-medium text-[var(--text-primary)]">
                                            {log.user?.email ? (
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-[var(--accent-primary)] opacity-70" />
                                                    {log.user.email}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-muted)] italic">Sistema</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border ${getActionBadgeClass(log.action)}`}>
                                                <Activity size={12} />
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[var(--text-secondary)]">
                                            <div className="flex items-center gap-2">
                                                <Database size={14} className="opacity-50" />
                                                {log.module}
                                            </div>
                                        </td>
                                        <td className="p-4 text-[var(--text-muted)] font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <Network size={14} className="opacity-50" />
                                                {log.ipAddress}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {logs.length > 0 && (
                    <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex justify-between items-center">
                        <span>Exibindo {logs.length} registro{logs.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </Card>
        </div>
    );
}

