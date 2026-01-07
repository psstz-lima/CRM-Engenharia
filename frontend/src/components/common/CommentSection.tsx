import { useState, useEffect, FormEvent } from 'react';
import api from '../../services/api';
import { MessageSquare, Send, Trash2 } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        fullName: string;
        profilePhoto?: string;
    };
    userId: string;
}

interface CommentSectionProps {
    targetType: 'MEASUREMENT_ITEM' | 'CONTRACT_ITEM' | 'MEASUREMENT' | 'CONTRACT';
    targetId: string;
    currentUserId?: string;
    canComment?: boolean;
}

export function CommentSection({ targetType, targetId, currentUserId, canComment = true }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadComments();
    }, [targetType, targetId]);

    const loadComments = async () => {
        try {
            const { data } = await api.get(`/comments/${targetType}/${targetId}`);
            setComments(data);
        } catch (e) {
            console.error('Erro ao carregar comentários', e);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            await api.post('/comments', { content: newComment, targetType, targetId });
            setNewComment('');
            loadComments();
        } catch (e) {
            console.error('Erro ao adicionar comentário', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja remover este comentário?')) return;
        try {
            await api.delete(`/comments/${id}`);
            loadComments();
        } catch (e) {
            console.error('Erro ao remover comentário', e);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div style={{ marginTop: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={18} /> Comentários ({comments.length})
            </h4>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                {comments.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhum comentário ainda.</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} style={{ padding: '12px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                        {comment.user.fullName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <strong>{comment.user.fullName}</strong>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{formatDate(comment.createdAt)}</div>
                                    </div>
                                </div>
                                {currentUserId === comment.userId && (
                                    <button onClick={() => handleDelete(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} title="Remover">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <p style={{ marginTop: '8px', marginBottom: 0 }}>{comment.content}</p>
                        </div>
                    ))
                )}
            </div>

            {canComment && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Adicionar comentário..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '8px' }} />
                    <button type="submit" disabled={loading || !newComment.trim()} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Send size={16} /> Enviar
                    </button>
                </form>
            )}
        </div>
    );
}
