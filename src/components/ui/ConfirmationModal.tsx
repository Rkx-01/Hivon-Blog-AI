'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(26, 26, 26, 0.4)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      animation: 'modal-fade 0.3s ease-out'
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        backgroundColor: 'var(--bg-primary)',
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
        position: 'relative',
        animation: 'modal-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <h3 className="font-display" style={{ 
          fontSize: '28px', 
          marginBottom: '16px', 
          color: 'var(--text-primary)' 
        }}>
          {title}
        </h3>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '1rem', 
          lineHeight: '1.6',
          marginBottom: '32px' 
        }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '12px 24px' }}
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="btn btn-primary"
            style={{ 
              padding: '12px 24px',
              backgroundColor: 'var(--danger, #ef4444)',
              borderColor: 'var(--danger, #ef4444)',
              color: 'white'
            }}
          >
            {confirmText}
          </button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modal-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modal-slide {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />
      </div>
    </div>,
    document.body
  );
}
