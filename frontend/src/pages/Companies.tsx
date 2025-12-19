import { useState, useEffect, FormEvent } from 'react';
import api from '../services/api';

export function Companies() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [name, setName] = useState('');
    const [cnpj, setCnpj] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editCnpj, setEditCnpj] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const { data } = await api.get('/companies');
            setCompanies(data);
        } catch { }
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/companies', { name, cnpj });
            setShowCreateModal(false);
            loadCompanies();
            setName('');
            setCnpj('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar empresa');
        }
    };

    const openEditModal = (company: any) => {
        setEditingCompany(company);
        setEditName(company.name || '');
        setEditCnpj(company.cnpj || '');
        setEditIsActive(company.isActive);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await api.patch(`/companies/${editingCompany.id}`, {
                name: editName,
                cnpj: editCnpj,
                isActive: editIsActive
            });
            setShowEditModal(false);
            loadCompanies();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao atualizar empresa');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
        try {
            await api.delete(`/companies/${id}`);
            loadCompanies();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir empresa');
        }
    };

    return (
        <div>
            <div>
                <div>
                    <h2>Gestão de Empresas</h2>
                    <button onClick={() => setShowCreateModal(true)}>+ Nova Empresa</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CNPJ</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(company => (
                            <tr key={company.id}>
                                <td>{company.name}</td>
                                <td>{company.cnpj}</td>
                                <td>{company.isActive ? 'Ativa' : 'Inativa'}</td>
                                <td>
                                    <button onClick={() => openEditModal(company)} style={{ marginRight: '5px' }}>Editar</button>
                                    <button onClick={() => handleDelete(company.id)} style={{ background: '#ef4444', color: 'white' }}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div onClick={() => setShowCreateModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                        <h3>Nova Empresa</h3>
                        <form onSubmit={handleCreate}>
                            <div>
                                <label>Nome</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <label>CNPJ</label>
                                <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button type="submit">Criar</button>
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingCompany && (
                <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                        <h3>Editar Empresa</h3>
                        <form onSubmit={handleUpdate}>
                            <div>
                                <label>Nome</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
                            </div>
                            <div>
                                <label>CNPJ</label>
                                <input type="text" value={editCnpj} onChange={e => setEditCnpj(e.target.value)} required />
                            </div>
                            <div>
                                <label>
                                    <input type="checkbox" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} />
                                    Ativa
                                </label>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <button type="submit">Salvar</button>
                                <button type="button" onClick={() => setShowEditModal(false)}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
