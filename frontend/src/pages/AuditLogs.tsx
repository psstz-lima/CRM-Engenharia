import { useState, useEffect } from 'react';
import api from '../services/api';

export function AuditLogs() {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        api.get('/audit-logs').then(res => setLogs(res.data.data || res.data)).catch(() => { });
    }, []);

    return (
        <div>
            <div>
                <h2>Logs de Auditoria</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Usuário</th>
                            <th>Ação</th>
                            <th>Módulo</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.createdAt).toLocaleString()}</td>
                                <td>{log.user?.email || 'Sistema'}</td>
                                <td>{log.action}</td>
                                <td>{log.module}</td>
                                <td>{log.ipAddress}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
