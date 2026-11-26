import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-ink/10 relative">
        <div className="flex items-center justify-between pb-4 border-b border-ink/10 mb-4">
          <h3 className="font-display font-semibold text-lg text-ink">{title}</h3>
          <IconButton ariaLabel="Close dialog" onClick={onClose} size="sm">
            <X className="w-4 h-4 text-ink-muted" />
          </IconButton>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({
  content,
  children,
}) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 px-2 py-1 text-[11px] font-mono text-white bg-ink rounded shadow-lg whitespace-nowrap">
        {content}
      </div>
    </div>
  );
};
