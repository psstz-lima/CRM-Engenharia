import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Plus, Paperclip } from 'lucide-react';
import api from '../../services/api';
import { AttachmentUploadModal } from '../modals/AttachmentUploadModal';

interface Attachment {
    id: string;
    filename: string;
    description?: string;
    size: number;
    mimeType: string;
    createdAt: string;
    uploadedByName?: string;
}

interface AttachmentListProps {
    targetType: string;
    targetId: string;
    readOnly?: boolean;
}

export function AttachmentList({ targetType, targetId, readOnly = false }: AttachmentListProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const loadAttachments = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/attachments/${targetType}/${targetId}`);
            setAttachments(data);
        } catch (error) {
            console.error('Error loading attachments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (targetId) {
            loadAttachments();
        }
    }, [targetId, targetType]);

    const handleDownload = async (id: string, filename: string) => {
        try {
            const response = await api.get(`/attachments/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Erro ao baixar arquivo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este anexo?')) return;
        try {
            await api.delete(`/attachments/${id}`);
            setAttachments(attachments.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Erro ao excluir arquivo.');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Paperclip size={20} />
                    Anexos ({attachments.length})
                </h3>
                {!readOnly && (
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="btn btn-sm btn-outline flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Novo Anexo
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando anexos...</div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500">Nenhum anexo encontrado.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {attachments.map(attachment => (
                        <div
                            key={attachment.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="font-medium">{attachment.filename}</p>
                                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                        <span>{formatSize(attachment.size)}</span>
                                        <span>•</span>
                                        <span>{new Date(attachment.createdAt).toLocaleString('pt-BR')}</span>
                                        {attachment.description && (
                                            <>
                                                <span>•</span>
                                                <span className="italic">{attachment.description}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDownload(attachment.id, attachment.filename)}
                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Baixar"
                                >
                                    <Download size={18} />
                                </button>
                                {!readOnly && (
                                    <button
                                        onClick={() => handleDelete(attachment.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AttachmentUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={loadAttachments}
                targetType={targetType}
                targetId={targetId}
            />
        </div>
    );
}
