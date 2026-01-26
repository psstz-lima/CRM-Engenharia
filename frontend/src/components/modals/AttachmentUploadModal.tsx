import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, File as FileIcon, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { DraggableModal } from '../common/DraggableModal';

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
        <DraggableModal
            isOpen={isOpen}
            onClose={onClose}
            title="Novo Anexo"
            width="520px"
            className="max-w-[92vw]"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                    <label className="label">Arquivo</label>
                    <div className="upload-dropzone">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            {file ? (
                                <>
                                    <FileIcon size={32} className="text-emerald-600" />
                                    <span className="text-sm font-semibold text-">{file.name}</span>
                                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={32} className="text-gray-400" />
                                    <span className="text-sm text-gray-500">Clique para selecionar um arquivo</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="grid gap-2">
                    <label className="label">Descrição (opcional)</label>
                    <input
                        {...register('description')}
                        className="input"
                        placeholder="Ex: Contrato original assinado"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!file || loading}
                        className="btn btn-primary"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Enviar Arquivo
                    </button>
                </div>
            </form>
        </DraggableModal>
    );
}
