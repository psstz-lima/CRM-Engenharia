import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { ImageEditorModal } from './ImageEditorModal';
import { DraggableModal } from '../common/DraggableModal';

interface PhotoGalleryModalProps {
    show: boolean;
    onClose: () => void;
    measurementId: string;
    contractItemId: string;
    itemName: string;
    isClosed: boolean;
}

interface Photo {
    id: string;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
    description: string | null;
    photoDate: string | null;
    location: string | null;
    createdAt: string;
}

interface UploadMetadata {
    description: string;
    photoDate: string;
    location: string;
}

export function PhotoGalleryModal({ show, onClose, measurementId, contractItemId, itemName, isClosed }: PhotoGalleryModalProps) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [editingDescription, setEditingDescription] = useState<string | null>(null);
    const [descriptionText, setDescriptionText] = useState('');

    // Upload form state
    const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadMetadata, setUploadMetadata] = useState<UploadMetadata>({
        description: '',
        photoDate: '',
        location: ''
    });

    // Editor states (unified editor for all editing)
    const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null);
    const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

    const loadPhotos = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/contracts/measurements/${measurementId}/items/${contractItemId}/photos`);
            setPhotos(data);
        } catch (err) {
            console.error('Error loading photos:', err);
        } finally {
            setLoading(false);
        }
    }, [measurementId, contractItemId]);

    useEffect(() => {
        if (show) {
            loadPhotos();
        }
    }, [show, loadPhotos]);

    const getPhotoUrl = (photo: Photo) => {
        const normalizedPath = photo.path.replace(/\\/g, '/');
        const filename = normalizedPath.split('/').pop();
        return `http://localhost:3001/uploads/measurements/${filename}`;
    };

    // Show upload form when files are selected
    const handleSelectFiles = (files: FileList | null) => {
        if (!files || files.length === 0 || isClosed) return;
        setPendingFiles(files);
        setUploadMetadata({ description: '', photoDate: '', location: '' });
        setShowUploadForm(true);
    };

    // Cancel upload form
    const handleCancelUpload = () => {
        setPendingFiles(null);
        setShowUploadForm(false);
        setUploadMetadata({ description: '', photoDate: '', location: '' });
    };

    // Confirm upload with metadata
    const handleConfirmUpload = async () => {
        if (!pendingFiles || pendingFiles.length === 0) return;

        setUploading(true);
        setShowUploadForm(false);

        const formData = new FormData();
        Array.from(pendingFiles).forEach(file => {
            formData.append('photos', file);
        });
        if (uploadMetadata.description) formData.append('description', uploadMetadata.description);
        if (uploadMetadata.photoDate) formData.append('photoDate', uploadMetadata.photoDate);
        if (uploadMetadata.location) formData.append('location', uploadMetadata.location);

        try {
            await api.post(`/contracts/measurements/${measurementId}/items/${contractItemId}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            loadPhotos();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao fazer upload');
        } finally {
            setUploading(false);
            setPendingFiles(null);
            setUploadMetadata({ description: '', photoDate: '', location: '' });
        }
    };

    // Open editor for existing photo
    const handleOpenEditor = (photo: Photo) => {
        setEditingPhoto(photo);
        setEditorImageSrc(getPhotoUrl(photo));
    };

    const closeEditor = () => {
        setEditorImageSrc(null);
        setEditingPhoto(null);
    };

    // Save edited image
    const handleEditorSave = async (editedBlob: Blob) => {
        if (!editingPhoto) return;

        setUploading(true);
        const formData = new FormData();
        const editedFile = new File([editedBlob], 'edited-image.jpg', { type: 'image/jpeg' });
        formData.append('photos', editedFile);

        try {
            await api.delete(`/contracts/measurements/photos/${editingPhoto.id}`);
            await api.post(`/contracts/measurements/${measurementId}/items/${contractItemId}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            loadPhotos();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar imagem editada');
        } finally {
            setUploading(false);
            closeEditor();
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleSelectFiles(e.dataTransfer.files);
    };

    const handleDelete = async (photoId: string) => {
        try {
            await api.delete(`/contracts/measurements/photos/${photoId}`);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            if (selectedPhoto?.id === photoId) {
                setSelectedPhoto(null);
            }
        } catch (err: any) {
            console.error('Erro ao excluir foto:', err);
            alert(err.response?.data?.error || 'Erro ao excluir foto. Tente novamente.');
        }
    };

    const handleSaveDescription = async (photoId: string) => {
        try {
            await api.patch(`/contracts/measurements/photos/${photoId}`, { description: descriptionText });
            setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, description: descriptionText } : p));
            setEditingDescription(null);
        } catch (err: any) {
            alert('Erro ao salvar descrição');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-slate-50 border border-slate-200 rounded-xl w-[90%] max-w-[900px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">Fotos do Item</h2>
                        <p className="text-slate-600 text-sm mt-1">{itemName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-600 hover:text-slate-900 text-xl">✕</button>
                </div>

                {/* Upload Area */}
                {!isClosed && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        className={`m-5 p-8 border-2 border-dashed rounded-lg text-center transition-all ${dragOver
                                ? 'border-slate-400 bg-slate-100/60'
                                : 'border-slate-300 bg-slate-50 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                    >
                        {uploading ? (
                            <p className="text-slate-600">Enviando...</p>
                        ) : (
                            <>
                                <p className="text-slate-700">
                                    Arraste fotos aqui ou{' '}
                                    <label className="text-slate-700 hover:text-slate-900 cursor-pointer hover:underline font-medium">
                                        selecione arquivos
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={e => handleSelectFiles(e.target.files)}
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="text-xs text-slate-500 mt-2">
                                    JPG, PNG, WebP, GIF (máx. 10MB cada)
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Photo Grid */}
                <div className="flex-1 overflow-y-auto p-5 pt-0 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
                            <p className="text-slate-600">Carregando...</p>
                        </div>
                    ) : photos.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <p className="text-4xl mb-2">🖼️</p>
                            <p>Nenhuma foto cadastrada</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {photos.map(photo => (
                                <div
                                    key={photo.id}
                                    className="group relative border border-slate-200 rounded-lg overflow-hidden bg-white hover:border-slate-300 transition-all hover:shadow-lg"
                                >
                                    <div className="aspect-square relative overflow-hidden bg-slate-100">
                                        <img
                                            src={getPhotoUrl(photo)}
                                            alt={photo.filename}
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
                                        />

                                        {!isClosed && (
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEditor(photo);
                                                    }}
                                                    title="Editar"
                                                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(photo.id);
                                                    }}
                                                    title="Excluir"
                                                    className="w-7 h-7 flex items-center justify-center bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-2 text-xs">
                                        {editingDescription === photo.id ? (
                                            <div className="flex gap-1 mb-1">
                                                <input
                                                    type="text"
                                                    value={descriptionText}
                                                    onChange={e => setDescriptionText(e.target.value)}
                                                    placeholder="Descrição..."
                                                    className="flex-1 bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-900 focus:border-slate-400 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleSaveDescription(photo.id)}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-1.5"
                                                >
                                                    ✓
                                                </button>
                                            </div>
                                        ) : (
                                            <p
                                                onClick={() => { if (!isClosed) { setEditingDescription(photo.id); setDescriptionText(photo.description || ''); } }}
                                                className={`mb-1 truncate cursor-pointer ${photo.description ? 'text-slate-700' : 'text-slate-500 italic'}`}
                                                title={photo.description || 'Clique para adicionar descrição'}
                                            >
                                                {photo.description || 'Sem descrição'}
                                            </p>
                                        )}

                                        {(photo.photoDate || photo.location) && (
                                            <div className="flex flex-col gap-0.5 text-slate-500 mb-1 scale-90 origin-left">
                                                {photo.photoDate && (
                                                    <span>Data: {new Date(photo.photoDate).toLocaleDateString('pt-BR')}</span>
                                                )}
                                                {photo.location && (
                                                    <span>Local: {photo.location}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="text-slate-600 text-[10px] flex justify-between">
                                            <span>{formatSize(photo.size)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <span className="text-slate-600 text-sm">{photos.length} foto(s)</span>
                    <button onClick={onClose} className="btn bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 text-sm">
                        Fechar
                    </button>
                </div>
            </div>

            {/* Full Size Preview */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[1001] bg-black/95 flex items-center justify-center"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <img
                        src={getPhotoUrl(selectedPhoto)}
                        alt={selectedPhoto.filename}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-[95%] max-h-[90vh] object-contain shadow-2xl rounded-sm"
                    />

                    <button
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all"
                    >
                        ✕
                    </button>

                    {!isClosed && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4"
                        >
                            <button
                                onClick={() => {
                                    handleOpenEditor(selectedPhoto);
                                    setSelectedPhoto(null);
                                }}
                                className="btn bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 flex items-center gap-2"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedPhoto.id);
                                }}
                                className="btn bg-red-600 hover:bg-red-500 text-white border-none flex items-center gap-2"
                            >
                                Excluir
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Form Modal */}
            {showUploadForm && pendingFiles && (
                <div className="modal-overlay z-[1002]" onClick={handleCancelUpload}>
                    <DraggableModal
                        isOpen={showUploadForm}
                        onClose={handleCancelUpload}
                        title={`Informações da Foto (${pendingFiles.length} arquivo${pendingFiles.length > 1 ? 's' : ''})`}
                        className="w-[560px] max-w-[92vw]"
                    >
                        <div onClick={e => e.stopPropagation()} className="space-y-4">
                            <p className="text-slate-600 text-sm">
                                Preencha os campos opcionais abaixo para aplicar a todas as fotos selecionadas.
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="label">Descrição</label>
                                    <input
                                        type="text"
                                        value={uploadMetadata.description}
                                        onChange={e => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Ex: Vista geral do trecho"
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Data da Foto</label>
                                    <input
                                        type="date"
                                        value={uploadMetadata.photoDate}
                                        onChange={e => setUploadMetadata(prev => ({ ...prev, photoDate: e.target.value }))}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Local / Estaca / Km</label>
                                    <input
                                        type="text"
                                        value={uploadMetadata.location}
                                        onChange={e => setUploadMetadata(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="Ex: Estaca 120+5 ou Km 45"
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={handleCancelUpload} className="btn bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200">
                                    Cancelar
                                </button>
                                <button onClick={handleConfirmUpload} className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                                    Enviar
                                </button>
                            </div>
                        </div>
                    </DraggableModal>
                </div>
            )}

            {/* Editor Modal */}
            {editorImageSrc && (
                <ImageEditorModal
                    show={true}
                    imageSrc={editorImageSrc}
                    onClose={closeEditor}
                    onSave={handleEditorSave}
                />
            )}
        </div>
    );
}

