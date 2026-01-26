import { useEffect, useState } from 'react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';

export function Tasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [assignedToId, setAssignedToId] = useState('');
    const [contractId, setContractId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [tasksRes, usersRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/users')
            ]);
            setTasks(tasksRes.data);
            setUsers(usersRes.data);
        } catch { }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/tasks', {
                title,
                description,
                priority,
                assignedToId: assignedToId || null,
                contractId: contractId || null
            });
            setShowModal(false);
            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setAssignedToId('');
            setContractId('');
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao criar tarefa');
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await api.post(`/tasks/${id}/complete`);
            loadData();
        } catch {
            alert('Erro ao concluir tarefa');
        }
    };

    if (loading) return <div className="p-6">Carregando...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="Tarefas"
                subtitle="Acompanhe e distribua pendências do projeto"
                icon="✅"
                actions={
                    <button onClick={() => setShowModal(true)} className="btn btn-primary flex items-center gap-2">
                        <Plus size={16} />
                        Nova Tarefa
                    </button>
                }
            />

            <Card className="overflow-hidden">
                <table className="w-full">
                    <thead className="bg- text- text-xs uppercase font-semibold border-b border-">
                        <tr>
                            <th className="p-4 text-left">Título</th>
                            <th className="p-4 text-left">Responsável</th>
                            <th className="p-4 text-left">Prioridade</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-">
                        {tasks.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-">
                                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                    Nenhuma tarefa cadastrada
                                </td>
                            </tr>
                        ) : tasks.map(task => (
                            <tr key={task.id} className="hover:bg- transition-colors">
                                <td className="p-4">
                                    <div className="font-medium">{task.title}</div>
                                    {task.description && <div className="text-xs opacity-70">{task.description}</div>}
                                </td>
                                <td className="p-4">{task.assignedTo?.fullName || '-'}</td>
                                <td className="p-4">{task.priority}</td>
                                <td className="p-4">{task.status}</td>
                                <td className="p-4 text-right">
                                    {task.status !== 'DONE' && (
                                        <button
                                            onClick={() => handleComplete(task.id)}
                                            className="btn btn-secondary flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            Concluir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border- flex justify-between items-center bg-">
                            <h3 className="text-xl font-bold text-">Nova Tarefa</h3>
                            <button onClick={() => setShowModal(false)} className="text- hover:text-">×</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="label">Título *</label>
                                <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label">Descrição</label>
                                <textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Prioridade</label>
                                    <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                                        <option value="LOW">Baixa</option>
                                        <option value="MEDIUM">Média</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Responsável</label>
                                    <select className="input" value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                                        <option value="">Não atribuir</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="label">Contrato (opcional)</label>
                                <input className="input" value={contractId} onChange={e => setContractId(e.target.value)} placeholder="ID do contrato" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
