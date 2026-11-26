import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'warning';
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
}) => {
  const dotStyles = {
    online: 'bg-softgreen border-navy/20',
    offline: 'bg-coral border-coral-dark/20',
    busy: 'bg-cyan animate-ping',
    warning: 'bg-coral',
  }[status];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        {status === 'online' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-softgreen opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotStyles}`} />
      </span>
      {label && <span className="text-xs font-mono text-ink-muted">{label}</span>}
    </div>
  );
};
