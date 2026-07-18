// src/components/ui/Modal.tsx
import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ isOpen, title, onClose, children }: ModalProps) => {
  // Tutup modal saat tekan Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Kunci scroll body saat modal terbuka agar background tidak bisa di-scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bm-charcoal-900/50 backdrop-blur-[8px]"
        onClick={onClose}
      />
      {/* Wrapper — flex + min-h-full agar centering aman (tidak terpotong atas) */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Panel */}
        <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-elevated p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-serif font-bold text-bm-charcoal-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;