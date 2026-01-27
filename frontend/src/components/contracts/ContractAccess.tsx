import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface Role {
    id: string;
    name: string;
}

interface ContractAccessProps {
    contractId: string;
}

export function ContractAccess({ contractId }: ContractAccessProps) {
    const [roles, setRoles] = useState<Role[]>([]);
    const [accessRoles, setAccessRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [rolesRes, accessRes] = await Promise.all([
                api.get('/roles'),
                api.get(`/contracts/${contractId}/access`)
            ]);
            setRoles(rolesRes.data || []);
            setAccessRoles(accessRes.data.accessRoles || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [contractId]);

    const toggleRole = (roleId: string) => {
        setAccessRoles(prev => prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]);
    };

    const handleSave = async () => {
        await api.put(`/contracts/${contractId}/access`, { accessRoles });
        load();
    };

    if (loading) return <div className="text-sm text-gray-500">Carregando permissões...</div>;

    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-600">
                Se nenhuma função estiver marcada, o contrato fica visível para todos.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {roles.map(role => (
                    <label key={role.id} className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white/80">
                        <input
                            type="checkbox"
                            checked={accessRoles.includes(role.id)}
                            onChange={() => toggleRole(role.id)}
                        />
                        <span className="text-sm text-gray-800">{role.name}</span>
                    </label>
                ))}
            </div>
            <button className="btn btn-primary" onClick={handleSave}>Salvar permissões</button>
        </div>
    );
}
