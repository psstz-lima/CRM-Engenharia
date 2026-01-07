import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, File as FileIcon, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface AttachmentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetType: string;
    targetId: string;
}

interface UploadFormData {
    description: string;
}

export function AttachmentUploadModal({ isOpen, onClose, onSuccess, targetType, targetId }: AttachmentUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, reset } = useForm<UploadFormData>();

    if (!isOpen) return null;

    const onSubmit = async (data: UploadFormData) => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('targetType', targetType);
        formData.append('targetId', targetId);
        formData.append('description', data.description);

        try {
            await api.post('/attachments/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            reset();
            setFile(null);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erro ao enviar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Novo Anexo</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Arquivo</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900/50">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                {file ? (
                                    <>
                                        <FileIcon size={32} className="text-blue-500 mb-2" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
                                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={32} className="text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500">Clique para selecionar um arquivo</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Descrição (opcional)</label>
                        <input
                            {...register('description')}
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Contrato original assinado"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Enviar Arquivo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
