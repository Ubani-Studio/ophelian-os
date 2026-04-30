'use client';

import { useState, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'default-dev-key';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (disabled) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a JPEG, PNG, GIF, or WebP image');
        return;
      }


      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/uploads`, {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        // Cloudinary returns full URL, use it directly
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [disabled, handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleUpload]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  return (
    <div className="form-group">
      <label className="label">Avatar Image</label>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `1px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 0,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? 'var(--primary-muted)' : 'transparent',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          position: 'relative',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        {value ? (
          <div style={{ position: 'relative' }}>
            <img
              src={value}
              alt="Avatar preview"
              style={{
                maxWidth: '150px',
                maxHeight: '150px',
                borderRadius: 0,
                objectFit: 'cover',
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'var(--error)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                x
              </button>
            )}
          </div>
        ) : isUploading ? (
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Uploading...</p>
        ) : (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                marginBottom: '0.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'var(--muted-foreground)',
              }}
            >
              +
            </div>
            <p style={{ color: 'var(--muted-foreground)', margin: 0, fontSize: '0.875rem' }}>
              Drag & drop an image here, or click to select
            </p>
            <p style={{ color: 'var(--muted-foreground)', margin: '0.25rem 0 0', fontSize: '0.75rem' }}>
              JPEG, PNG, GIF, or WebP
            </p>
          </>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>
      )}
    </div>
  );
}
