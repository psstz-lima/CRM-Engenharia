import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { ImageEditorModal } from './ImageEditorModal';

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
        console.log('handleDelete called with photoId:', photoId);

        // Direct deletion without confirm for testing
        try {
            console.log('Sending DELETE request...');
            await api.delete(`/contracts/measurements/photos/${photoId}`);
            console.log('Delete successful!');
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            if (selectedPhoto?.id === photoId) {
                setSelectedPhoto(null);
            }
            alert('Foto excluída com sucesso!');
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
        <div
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '12px', width: '90%', maxWidth: '900px',
                    maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.3em' }}>📷 Fotos do Item</h2>
                        <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9em' }}>{itemName}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#666' }}>×</button>
                </div>

                {/* Upload Area */}
                {!isClosed && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        style={{
                            margin: '20px',
                            padding: '30px',
                            border: `2px dashed ${dragOver ? '#2563eb' : '#ddd'}`,
                            borderRadius: '8px',
                            background: dragOver ? '#eff6ff' : '#f9fafb',
                            textAlign: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        {uploading ? (
                            <p style={{ margin: 0, color: '#666' }}>⏳ Enviando...</p>
                        ) : (
                            <>
                                <p style={{ margin: 0, color: '#666' }}>
                                    📁 Arraste fotos aqui ou{' '}
                                    <label style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
                                        selecione arquivos
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={e => handleSelectFiles(e.target.files)}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </p>
                                <p style={{ margin: '5px 0 0', fontSize: '0.85em', color: '#999' }}>
                                    JPG, PNG, WebP, GIF (máx. 10MB cada)
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Photo Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>Carregando...</p>
                    ) : photos.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma foto cadastrada</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                            {photos.map(photo => (
                                <div
                                    key={photo.id}
                                    style={{
                                        position: 'relative',
                                        border: '1px solid #eee',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: '#f9f9f9'
                                    }}
                                >
                                    <img
                                        src={getPhotoUrl(photo)}
                                        alt={photo.filename}
                                        onClick={() => setSelectedPhoto(photo)}
                                        style={{
                                            width: '100%',
                                            height: '120px',
                                            objectFit: 'cover',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ padding: '8px', fontSize: '0.8em' }}>
                                        {editingDescription === photo.id ? (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <input
                                                    type="text"
                                                    value={descriptionText}
                                                    onChange={e => setDescriptionText(e.target.value)}
                                                    placeholder="Descrição..."
                                                    style={{ flex: 1, padding: '4px', fontSize: '0.9em' }}
                                                />
                                                <button onClick={() => handleSaveDescription(photo.id)} style={{ padding: '4px 8px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                                            </div>
                                        ) : (
                                            <p
                                                onClick={() => { if (!isClosed) { setEditingDescription(photo.id); setDescriptionText(photo.description || ''); } }}
                                                style={{ margin: 0, color: photo.description ? '#333' : '#999', cursor: isClosed ? 'default' : 'pointer' }}
                                                title={isClosed ? '' : 'Clique para editar'}
                                            >
                                                {photo.description || 'Sem descrição'}
                                            </p>
                                        )}
                                        {/* Photo metadata */}
                                        {(photo.photoDate || photo.location) && (
                                            <div style={{ marginTop: '4px', fontSize: '0.85em', color: '#666' }}>
                                                {photo.photoDate && (
                                                    <span style={{ marginRight: '8px' }}>📅 {new Date(photo.photoDate).toLocaleDateString('pt-BR')}</span>
                                                )}
                                                {photo.location && (
                                                    <span>📍 {photo.location}</span>
                                                )}
                                            </div>
                                        )}
                                        <p style={{ margin: '4px 0 0', color: '#999', fontSize: '0.85em' }}>{formatSize(photo.size)}</p>
                                    </div>
                                    {!isClosed && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    console.log('Edit button clicked');
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleOpenEditor(photo);
                                                }}
                                                title="Editar foto"
                                                style={{
                                                    position: 'absolute', top: '8px', right: '45px',
                                                    background: 'rgba(124,58,237,0.95)', color: 'white',
                                                    border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                                                    cursor: 'pointer', fontSize: '1em', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 10
                                                }}
                                            >🎨</button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    console.log('Delete button clicked for photo:', photo.id);
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(photo.id);
                                                }}
                                                title="Excluir foto"
                                                style={{
                                                    position: 'absolute', top: '8px', right: '8px',
                                                    background: 'rgba(220,38,38,0.95)', color: 'white',
                                                    border: 'none', borderRadius: '50%', width: '30px', height: '30px',
                                                    cursor: 'pointer', fontSize: '1.2em', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 10, fontWeight: 'bold'
                                                }}
                                            >×</button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '0.9em' }}>{photos.length} foto(s)</span>
                    <button onClick={onClose} style={{ padding: '10px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Fechar</button>
                </div>
            </div>

            {/* Full Size Preview */}
            {selectedPhoto && (
                <div
                    onClick={() => setSelectedPhoto(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1001
                    }}
                >
                    <img
                        src={getPhotoUrl(selectedPhoto)}
                        alt={selectedPhoto.filename}
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />

                    {/* Close button */}
                    <button
                        onClick={() => setSelectedPhoto(null)}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(255,255,255,0.2)', color: 'white',
                            border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                            cursor: 'pointer', fontSize: '1.5em'
                        }}
                    >×</button>

                    {/* Action buttons at bottom */}
                    {!isClosed && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                                display: 'flex', gap: '15px'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    handleOpenEditor(selectedPhoto);
                                    setSelectedPhoto(null);
                                }}
                                style={{
                                    padding: '12px 24px', background: '#7c3aed', color: 'white',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    fontSize: '1em', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >🎨 Editar</button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleDelete(selectedPhoto.id);
                                }}
                                style={{
                                    padding: '12px 24px', background: '#dc2626', color: 'white',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    fontSize: '1em', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >🗑️ Excluir</button>
                        </div>
                    )}
                </div>
            )}
            {/* Upload Form Modal */}
            {showUploadForm && pendingFiles && (
                <div
                    onClick={handleCancelUpload}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1002
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '12px', width: '90%', maxWidth: '450px',
                            padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                        }}
                    >
                        <h3 style={{ margin: '0 0 20px', fontSize: '1.2em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            📸 Informações da Foto
                            <span style={{ fontSize: '0.7em', color: '#666', fontWeight: 'normal' }}>
                                ({pendingFiles.length} arquivo{pendingFiles.length > 1 ? 's' : ''})
                            </span>
                        </h3>

                        <p style={{ margin: '0 0 20px', fontSize: '0.9em', color: '#666' }}>
                            Preencha os campos abaixo (opcional). Os dados serão aplicados a todas as fotos selecionadas.
                        </p>

                        {/* Description */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#333' }}>
                                📝 Descrição
                            </label>
                            <input
                                type="text"
                                value={uploadMetadata.description}
                                onChange={e => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Ex: Vista geral do trecho"
                                style={{
                                    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                                    borderRadius: '6px', fontSize: '0.95em', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Photo Date */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#333' }}>
                                📅 Data da Foto
                            </label>
                            <input
                                type="date"
                                value={uploadMetadata.photoDate}
                                onChange={e => setUploadMetadata(prev => ({ ...prev, photoDate: e.target.value }))}
                                style={{
                                    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                                    borderRadius: '6px', fontSize: '0.95em', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Location */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#333' }}>
                                📍 Local / Estaca / Km
                            </label>
                            <input
                                type="text"
                                value={uploadMetadata.location}
                                onChange={e => setUploadMetadata(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Ex: Estaca 120+5 ou Km 45"
                                style={{
                                    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                                    borderRadius: '6px', fontSize: '0.95em', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCancelUpload}
                                style={{
                                    padding: '10px 20px', background: '#f3f4f6', color: '#374151',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95em'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                style={{
                                    padding: '10px 20px', background: '#2563eb', color: 'white',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95em'
                                }}
                            >
                                📤 Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Modal (unified editor for all editing) */}
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
