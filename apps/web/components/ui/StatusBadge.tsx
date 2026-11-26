import React from 'react';

export type BadgeCapability = 'IMPLEMENTED' | 'EXPERIMENTAL' | 'PLANNED' | 'MOCK/DEMO' | 'ACTIVE' | 'CONNECTED' | 'DISCONNECTED';

interface StatusBadgeProps {
  status: BadgeCapability;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  const badgeStyles: Record<BadgeCapability, string> = {
    IMPLEMENTED: 'bg-softgreen/40 text-navy font-semibold border border-softgreen',
    EXPERIMENTAL: 'bg-violet/20 text-violet-dark font-medium border border-violet/30',
    PLANNED: 'bg-ink/5 text-ink-muted font-medium border border-ink/20',
    'MOCK/DEMO': 'bg-coral/20 text-coral-dark font-semibold border border-coral/40',
    ACTIVE: 'bg-softgreen/40 text-navy font-semibold border border-softgreen animate-pulse',
    CONNECTED: 'bg-cyan/30 text-navy font-semibold border border-cyan/50',
    DISCONNECTED: 'bg-coral/20 text-coral-dark font-medium border border-coral/30',
  };

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider rounded-md font-mono ${sizeStyles} ${badgeStyles[status] || 'bg-ink/10 text-ink'} ${className}`}
    >
      {status}
    </span>
  );
};
