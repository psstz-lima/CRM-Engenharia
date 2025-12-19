import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export function Measurements() {
    const { id } = useParams(); // Contract ID
    const navigate = useNavigate();
    const [contract, setContract] = useState<any>(null);
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal
    const [showModal, setShowModal] = useState(false);
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            const [contractRes, measurementsRes] = await Promise.all([
                api.get(`/contracts/${id}`),
                api.get(`/contracts/${id}/measurements`)
            ]);
            setContract(contractRes.data);
            setMeasurements(measurementsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            const { data } = await api.post(`/contracts/${id}/measurements`, {
                periodStart,
                periodEnd,
                notes
            });
            navigate(`/measurements/${data.id}`);
        } catch (err: any) {
            alert('Erro ao criar medição');
        }
    }

    if (loading) return <div>Carregando...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
                    <Link to="/measurements" style={{ textDecoration: 'none', color: '#666' }}>Módulo Medições</Link>
                    {' > '}
                    <span>Contrato {contract?.number}</span>
                </div>
                <Link to={`/contracts/${id}`} style={{ textDecoration: 'none', color: '#2563eb', display: 'block', marginBottom: '10px' }}>&larr; Ver Detalhes do Contrato</Link>
                <h2>Medições: {contract?.number}</h2>
                <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Nova Medição</button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Número</th>
                            <th style={{ padding: '12px' }}>Período</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {measurements.map(m => (
                            <tr key={m.id} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{m.number}</td>
                                <td style={{ padding: '12px' }}>{new Date(m.periodStart).toLocaleDateString()} - {new Date(m.periodEnd).toLocaleDateString()}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: m.status === 'CLOSED' ? '#dcfce7' : '#fef9c3', color: m.status === 'CLOSED' ? '#166534' : '#854d0e', fontSize: '0.9em' }}>
                                        {m.status === 'CLOSED' ? 'FECHADO' : 'RASCUNHO'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <Link to={`/measurements/${m.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>Abrir</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
                        <h3>Nova Medição</h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block' }}>Início</label>
                                <input type="date" required value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block' }}>Fim</label>
                                <input type="date" required value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block' }}>Observações</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '5px' }} />
                            </div>
                            <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>Criar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
