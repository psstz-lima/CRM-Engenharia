import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckCircle, Clock, User } from 'lucide-react';

interface ApprovalLevel {
    id: string;
    name: string;
    level: number;
    description?: string;
}

interface Approval {
    id: string;
    approvalLevelId: string;
    approvedByName: string;
    approvedAt: string;
    notes?: string;
    approvalLevel: ApprovalLevel;
}

interface ApprovalPanelProps {
    measurementId: string;
    measurementStatus: string;
    canApprove?: boolean;
    onApprovalChange?: () => void;
}

export function ApprovalPanel({ measurementId, measurementStatus, canApprove = false, onApprovalChange }: ApprovalPanelProps) {
    const [levels, setLevels] = useState<ApprovalLevel[]>([]);
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, [measurementId]);

    const loadData = async () => {
        try {
            const [levelsRes, approvalsRes] = await Promise.all([
                api.get('/approvals/levels'),
                api.get(`/approvals/measurements/${measurementId}`)
            ]);
            setLevels(levelsRes.data);
            setApprovals(approvalsRes.data);
        } catch (e) {
            console.error('Erro ao carregar aprovações', e);
        }
    };

    const handleApprove = async (levelId: string) => {
        if (!confirm('Confirma a aprovação neste nível?')) return;

        setLoading(true);
        try {
            await api.post('/approvals/measurements', {
                measurementId,
                approvalLevelId: levelId,
                notes: notes || undefined
            });
            setNotes('');
            loadData();
            onApprovalChange?.();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Erro ao aprovar');
        } finally {
            setLoading(false);
        }
    };

    const isApproved = (levelId: string) => approvals.some(a => a.approvalLevelId === levelId);
    const getApproval = (levelId: string) => approvals.find(a => a.approvalLevelId === levelId);
    const canApproveLevel = (level: ApprovalLevel) => {
        if (!canApprove || measurementStatus === 'DRAFT') return false;
        if (isApproved(level.id)) return false;
        // Check if previous levels are approved
        const previousLevels = levels.filter(l => l.level < level.level);
        return previousLevels.every(l => isApproved(l.id));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (measurementStatus === 'DRAFT') {
        return (
            <div style={{ padding: '16px', border: '1px solid #fbbf24', borderRadius: '8px', backgroundColor: '#fef3c7' }}>
                <p style={{ margin: 0, color: '#92400e' }}>
                    <Clock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Medição em rascunho. Feche a medição para habilitar aprovações.
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '16px' }}>Status de Aprovação</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {levels.map(level => {
                    const approval = getApproval(level.id);
                    const approved = !!approval;
                    const canApproveThis = canApproveLevel(level);

                    return (
                        <div key={level.id} style={{
                            padding: '16px',
                            border: `2px solid ${approved ? '#16a34a' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            backgroundColor: approved ? '#f0fdf4' : '#fff'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {approved ? (
                                        <CheckCircle size={24} color="#16a34a" />
                                    ) : (
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #d1d5db' }} />
                                    )}
                                    <div>
                                        <strong>Nível {level.level}: {level.name}</strong>
                                        {level.description && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>{level.description}</p>}
                                    </div>
                                </div>

                                {canApproveThis && (
                                    <button
                                        onClick={() => handleApprove(level.id)}
                                        disabled={loading}
                                        style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                    >
                                        Aprovar
                                    </button>
                                )}
                            </div>

                            {approved && approval && (
                                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#dcfce7', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <User size={14} />
                                        <strong>{approval.approvedByName}</strong>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#166534' }}>
                                        Aprovado em: {formatDate(approval.approvedAt)}
                                    </div>
                                    {approval.notes && <p style={{ margin: '8px 0 0', fontSize: '12px' }}>Obs: {approval.notes}</p>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {canApprove && levels.some(l => canApproveLevel(l)) && (
                <div style={{ marginTop: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Observações (opcional):</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Adicione observações sobre a aprovação..."
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '60px' }}
                    />
                </div>
            )}
        </div>
    );
}
