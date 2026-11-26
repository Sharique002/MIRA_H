import React from 'react';
import { AlertCircle, RefreshCw, Info, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, description, actionText, onAction, icon }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-cream/40 border border-dashed border-ink/20">
    <div className="p-3 bg-white rounded-full text-navy shadow-sm mb-3">
      {icon || <HelpCircle className="w-6 h-6 text-navy/70" />}
    </div>
    <h4 className="font-display font-semibold text-base text-ink mb-1">{title}</h4>
    <p className="text-sm text-ink-muted max-w-sm mb-4 leading-relaxed">{description}</p>
    {actionText && onAction && (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Encountered an Error', message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-coral/10 border border-coral/30">
    <AlertCircle className="w-8 h-8 text-coral mb-2" />
    <h4 className="font-display font-semibold text-base text-ink mb-1">{title}</h4>
    <p className="text-sm text-coral-dark max-w-sm mb-4">{message}</p>
    {onRetry && (
      <Button variant="danger" size="sm" onClick={onRetry} className="flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Operation</span>
      </Button>
    )}
  </div>
);

export const LoadingState: React.FC<{
  label?: string;
}> = ({ label = 'Processing...' }) => (
  <div className="flex flex-col items-center justify-center p-8 gap-3">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy" />
    <span className="text-xs font-mono text-ink-muted">{label}</span>
  </div>
);

export const UnsupportedFeatureNotice: React.FC<{
  feature: string;
  rationale: string;
}> = ({ feature, rationale }) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-ink/5 border border-ink/15 text-left">
    <Info className="w-5 h-5 text-violet flex-shrink-0 mt-0.5" />
    <div>
      <h5 className="text-xs font-semibold text-ink uppercase tracking-wider mb-0.5">
        Planned / Unsupported: {feature}
      </h5>
      <p className="text-xs text-ink-muted leading-relaxed">{rationale}</p>
    </div>
  </div>
);
