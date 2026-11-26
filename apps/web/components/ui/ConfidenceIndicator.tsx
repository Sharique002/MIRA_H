import React from 'react';

interface ConfidenceIndicatorProps {
  confidence?: number | null;
  uncertainty?: number | null;
  label?: string;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  uncertainty,
  label = 'Confidence',
  className = '',
}) => {
  if (confidence === undefined || confidence === null) {
    return (
      <div className={`flex items-center gap-2 text-xs font-mono text-ink-subtle ${className}`}>
        <span>{label}:</span>
        <span className="italic">N/A (uncomputed)</span>
      </div>
    );
  }

  const percent = Math.round(confidence * 100);
  const color =
    percent >= 80 ? 'bg-softgreen' : percent >= 60 ? 'bg-cyan' : 'bg-coral';

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold text-ink">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-ink/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {uncertainty !== undefined && uncertainty !== null && (
        <span className="text-[10px] font-mono text-ink-subtle">
          Uncertainty: &plusmn;{(uncertainty * 100).toFixed(1)}%
        </span>
      )}
    </div>
  );
};
