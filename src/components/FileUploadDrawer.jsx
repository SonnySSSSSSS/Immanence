import React, { useRef } from 'react';

export const FileUploadDrawer = ({ isOpen, onClose, onFileSelect, accept = "audio/mp3,audio/mpeg" }) => {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-elevated)',
          borderTop: '2px solid var(--border-active)',
          borderRadius: '20px 20px 0 0',
          padding: '24px 16px',
          maxHeight: '60vh',
          overflowY: 'auto',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-primary)' }}>
            LOAD AUDIO FILE
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          style={{
            border: '2px dashed var(--border-active)',
            borderRadius: '12px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(74, 222, 128, 0.05)',
            transition: 'all 0.2s ease',
            marginBottom: '16px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-active)';
            e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.05)';
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎵</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
            DRAG FILE HERE
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.05em' }}>
            or click to browse
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Browse Button */}
        <button
          onClick={triggerFileInput}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'var(--accent-primary)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          BROWSE FILES
        </button>

        {/* Keyboard hint */}
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center', letterSpacing: '0.05em' }}>
          Press ESC to close
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
};
