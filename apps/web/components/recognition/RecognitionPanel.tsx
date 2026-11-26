'use client';

import React from 'react';
import { Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';
import { CandidateSign, PredictionStatus, SignLanguage } from '../../types';
import { ConfidenceIndicator } from '../ui/ConfidenceIndicator';
import { StatusBadge } from '../ui/StatusBadge';

interface RecognitionPanelProps {
  signLanguage: SignLanguage;
  status: PredictionStatus;
  topPrediction?: CandidateSign | null;
  candidates: CandidateSign[];
  modelName: string;
  latencyMs: number;
}

export const RecognitionPanel: React.FC<RecognitionPanelProps> = ({
  signLanguage,
  status,
  topPrediction,
  candidates,
  modelName,
  latencyMs,
}) => {
  return (
    <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-ink/10 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-ink/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet" />
          <h3 className="font-display font-semibold text-sm text-ink">Sign Recognition</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-muted">{signLanguage} Heuristic</span>
          <StatusBadge
            size="sm"
            status={
              status === 'prediction_available'
                ? 'EXPERIMENTAL'
                : status === 'low_confidence'
                ? 'EXPERIMENTAL'
                : 'ACTIVE'
            }
          />
        </div>
      </div>

      {/* Main Detected Sign Card */}
      {topPrediction ? (
        <div className="p-4 rounded-xl bg-cream/70 border border-ink/10 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                Detected Sign (Gloss)
              </span>
              <h2 className="font-display font-bold text-2xl text-navy tracking-tight mt-0.5">
                {topPrediction.gloss}
              </h2>
              <p className="text-xs text-ink-muted">{topPrediction.display_text}</p>
            </div>
            <div className="flex items-center gap-1 text-softgreen bg-white px-2 py-1 rounded-md border border-ink/10 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          </div>

          <ConfidenceIndicator
            confidence={topPrediction.confidence}
            uncertainty={topPrediction.uncertainty}
          />
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-ink/5 border border-dashed border-ink/15 text-center flex flex-col items-center justify-center">
          <HelpCircle className="w-6 h-6 text-ink-subtle mb-1.5" />
          <p className="text-xs font-medium text-ink-muted">
            {status === 'no_sign_detected'
              ? 'Present hands in front of camera to perform signs.'
              : status === 'low_confidence'
              ? 'Gestures detected, but below confidence threshold.'
              : 'Sign recognition awaiting video frames.'}
          </p>
        </div>
      )}

      {/* Alternative Candidates */}
      {candidates.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-ink-muted uppercase">Candidate Spans:</span>
          <div className="flex flex-wrap gap-2">
            {candidates.slice(1).map((cand, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white border border-ink/15 text-xs font-mono flex items-center gap-2"
              >
                <span className="font-semibold text-ink">{cand.gloss}</span>
                <span className="text-ink-subtle text-[10px]">
                  {(cand.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostic Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-ink/10 text-[10px] font-mono text-ink-subtle">
        <span>Adapter: {modelName}</span>
        <span>Latency: {latencyMs.toFixed(1)} ms</span>
      </div>
    </div>
  );
};
