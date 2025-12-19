import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export function Contracts() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [number, setNumber] = useState('');
    const [object, setObject] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadContracts();
        loadCompanies();
    }, []);

    const loadContracts = async () => {
        try {
            const { data } = await api.get('/contracts');
            setContracts(data);
        } catch { }
    };

    const loadCompanies = async () => {
        try {
            const { data } = await api.get('/companies');
            setCompanies(data);
        } catch { }
    };

    const openModal = (contract?: any) => {
        if (contract) {
            setEditingId(contract.id);
            setNumber(contract.number);
            setObject(contract.object || '');
            setCompanyId(contract.companyId);
            setStartDate(contract.startDate ? contract.startDate.split('T')[0] : '');
            setEndDate(contract.endDate ? contract.endDate.split('T')[0] : '');
        } else {
            setEditingId(null);
            setNumber('');
            setObject('');
            setCompanyId('');
            setStartDate('');
            setEndDate('');
        }
        setShowModal(true);
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                number,
                object,
                companyId,
                startDate,
                endDate
            };

            if (editingId) {
                await api.put(`/contracts/${editingId}`, payload);
            } else {
                await api.post('/contracts', payload);
            }

            setShowModal(false);
            loadContracts();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar contrato');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = confirm(
            '⚠️ ATENÇÃO: Ação Irreversível!\n\n' +
            'Ao excluir este contrato, serão PERMANENTEMENTE removidos:\n\n' +
            '• Todos os itens do contrato\n' +
            '• Todas as medições vinculadas\n' +
            '• Todas as memórias de cálculo\n' +
            '• Todos os aditivos\n\n' +
            'Deseja realmente excluir?'
        );
        if (!confirmed) return;
        
        try {
            await api.delete(`/contracts/${id}`);
            loadContracts();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao excluir contrato');
        }
    };

    return (
        <div>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Contratos</h2>
                    <button onClick={() => openModal()} style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Novo Contrato</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Número</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Empresa</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Início</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Fim</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Valor Total</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Status</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map(contract => (
                                <tr key={contract.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={{ padding: '10px' }}>{contract.number}</td>
                                    <td style={{ padding: '10px' }}>{contract.company?.name}</td>
                                    <td style={{ padding: '10px' }}>{new Date(contract.startDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px' }}>{new Date(contract.endDate).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.totalValue)}</td>
                                    <td style={{ padding: '10px' }}>{contract.isActive ? 'Ativo' : 'Inativo'}</td>
                                    <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                                        <Link to={`/contracts/${contract.id}`}>
                                            <button style={{ padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Detalhes</button>
                                        </Link>
                                        <button onClick={() => openModal(contract)} style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                                        <button onClick={() => handleDelete(contract.id)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
                        <h3>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</h3>
                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Número do Contrato</label>
                                <input type="text" value={number} onChange={e => setNumber(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Objeto do Contrato</label>
                                <textarea value={object} onChange={e => setObject(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', resize: 'vertical' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Empresa</label>
                                <select value={companyId} onChange={e => setCompanyId(e.target.value)} required style={{ width: '100%', padding: '8px' }}>
                                    <option value="">Selecione</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Data Início</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Data Fim</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                                </div>
                            </div>
                            {!editingId && (
                                <div style={{ marginBottom: '10px' }}>
                                    <small style={{ color: '#666' }}>O valor total será calculado automaticamente conforme os itens forem adicionados.</small>
                                </div>
                            )}
                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{ padding: '8px 15px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 15px', background: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
