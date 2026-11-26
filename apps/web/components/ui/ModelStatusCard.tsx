import React from 'react';
import { ModelMetadataItem } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Card } from './Card';

interface ModelStatusCardProps {
  model: ModelMetadataItem;
}

export const ModelStatusCard: React.FC<ModelStatusCardProps> = ({ model }) => {
  const getBadgeStatus = (item: ModelMetadataItem) => {
    if (item.implementation_type === 'RULE_BASED_HEURISTIC') {
      return 'EXPERIMENTAL';
    }
    if (item.implementation_type === 'TRAINED_NEURAL_MODEL' && item.status === 'loaded') {
      return 'IMPLEMENTED';
    }
    if (
      item.implementation_type === 'UNTRAINED_ARCHITECTURE' ||
      item.implementation_type === 'INTERFACE_ONLY' ||
      item.status === 'not_trained' ||
      item.status === 'not_installed' ||
      item.status === 'not_available'
    ) {
      return 'PLANNED';
    }
    return 'MOCK/DEMO';
  };

  const formatImplementationType = (implType: ModelMetadataItem['implementation_type']) => {
    switch (implType) {
      case 'RULE_BASED_HEURISTIC':
        return 'Rule-Based Heuristic';
      case 'TRAINED_NEURAL_MODEL':
        return 'Trained Neural Model';
      case 'UNTRAINED_ARCHITECTURE':
        return 'Untrained Architecture';
      case 'INTERFACE_ONLY':
        return 'Interface Only';
      default:
        return implType;
    }
  };

  return (
    <Card className="flex flex-col gap-4 border border-ink/15 hover:border-ink/30 transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-base text-ink">{model.model_name}</h3>
            <span className="text-xs font-mono text-ink-muted">v{model.version}</span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            {formatImplementationType(model.implementation_type)} &bull; {model.model_id}
          </p>
        </div>
        <StatusBadge status={getBadgeStatus(model)} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono py-2 border-y border-ink/10">
        <div>
          <span className="text-ink-muted block text-[11px]">Sign Language:</span>
          <span className="font-semibold text-ink">{model.supported_sign_language}</span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px]">Training Status:</span>
          <span className="font-semibold text-ink uppercase">{model.training_status}</span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px]">Neural Parameters:</span>
          <span className="text-ink">
            {model.parameters_count !== null && model.parameters_count !== undefined
              ? model.parameters_count.toLocaleString()
              : model.parameter_count_status || 'NOT_APPLICABLE'}
          </span>
        </div>
        <div>
          <span className="text-ink-muted block text-[11px]">Checkpoint / Runtime:</span>
          <span className="font-semibold text-ink uppercase">
            {model.checkpoint_status} ({model.status})
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <span className="font-semibold text-ink">Dataset Provenance:</span>
        <span className="text-ink-muted text-[11px] leading-relaxed">{model.dataset_provenance}</span>
      </div>

      <div className="flex flex-col gap-1 text-xs bg-cream/60 p-2.5 rounded-lg border border-ink/10">
        <span className="font-semibold text-ink">Evaluation Status:</span>
        {model.evaluation.top1_accuracy !== null && model.evaluation.top1_accuracy !== undefined ? (
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Top-1 Acc: {(model.evaluation.top1_accuracy * 100).toFixed(1)}%</span>
            <span>Disjoint: {model.evaluation.signer_disjoint_verified ? 'Yes' : 'No'}</span>
          </div>
        ) : (
          <span className="italic text-ink-subtle text-[11px]">
            {model.implementation_type === 'RULE_BASED_HEURISTIC'
              ? 'Not evaluated on benchmark corpus; experimental geometric rules only.'
              : model.training_status === 'NOT_TRAINED'
              ? 'Model architecture/interface specified; not trained on a dataset.'
              : 'Empirical benchmark pending on signer-disjoint validation set.'}
          </span>
        )}
      </div>

      {model.known_limitations.length > 0 && (
        <div className="flex flex-col gap-1 text-[11px] text-ink-muted">
          <span className="font-semibold text-ink">Known Boundaries:</span>
          <ul className="list-disc list-inside space-y-0.5">
            {model.known_limitations.map((lim, i) => (
              <li key={i}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
