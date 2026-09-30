function AttachmentPreview({ files = [], onRemoveFile, disabled = false }) {
  if (!files || files.length === 0) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="file-preview-strip" role="region" aria-label="Attached files preview">
      {files.map((file, idx) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext);
        const previewUrl = (isImage || isVideo) ? URL.createObjectURL(file) : null;

        return (
          <div key={`${file.name}-${idx}`} className={`file-preview-chip ${isVideo ? 'video-preview-chip' : ''}`}>
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="file-preview-thumbnail"
              />
            ) : isVideo && previewUrl ? (
              <div className="file-preview-video-container">
                <video
                  src={previewUrl}
                  className="file-preview-video"
                  preload="metadata"
                  muted
                />
                <span className="video-overlay-icon">▶</span>
              </div>
            ) : (
              <span className="file-preview-doc-badge">{ext.toUpperCase()}</span>
            )}

            <div className="file-preview-info">
              <span className="file-preview-name" title={file.name}>
                {isVideo && <span className="video-prefix">🎥 </span>}
                {file.name}
              </span>
              <span className="file-preview-size">
                {formatFileSize(file.size)}
              </span>
            </div>

            {!disabled && (
              <button
                type="button"
                className="file-preview-remove"
                onClick={() => onRemoveFile(idx)}
                title={`Remove ${file.name}`}
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AttachmentPreview;
