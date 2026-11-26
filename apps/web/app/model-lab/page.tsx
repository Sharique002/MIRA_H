'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Database, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ModelStatusCard } from '../../components/ui/ModelStatusCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/FeedbackStates';
import { apiClient } from '../../services/api';
import { ModelMetadataItem } from '../../types';

export default function ModelLabPage() {
  const [models, setModels] = useState<ModelMetadataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getModels();
      setModels(res.models);
    } catch (err: any) {
      setError(err.message || 'Failed to query model registry from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-violet/10 text-violet-dark font-mono text-xs font-semibold">
              DIAGNOSTICS &amp; REGISTRY
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl text-ink tracking-tight">
            AI Model Lab
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Verified model runtime status, dataset provenance, evaluation metrics, and operational limitations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchModels}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Registry</span>
        </Button>
      </div>

      {/* Honest AI Standard Notice */}
      <div className="p-4 rounded-xl bg-white border border-ink/10 flex items-start gap-3 shadow-xs">
        <CheckCircle2 className="w-5 h-5 text-softgreen flex-shrink-0 mt-0.5" />
        <div className="text-xs text-ink-muted leading-relaxed">
          <strong className="text-ink">Product Honesty Standard:</strong> Uninstalled or untrained architectures
          are strictly labeled <span className="font-mono text-ink font-semibold">NOT_TRAINED</span> or{' '}
          <span className="font-mono text-ink font-semibold">NOT_INSTALLED</span>. No fabricated benchmark scores
          or synthetic accuracies are displayed.
        </div>
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <LoadingState label="Querying backend model registry (/api/v1/models)..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchModels} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map((model) => (
            <ModelStatusCard key={model.model_id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
