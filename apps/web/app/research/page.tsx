import React from 'react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Database, GitFork } from 'lucide-react';

export default function ResearchPage() {
  const datasets = [
    {
      name: 'ISLTranslate Corpus',
      language: 'ISL (Indian Sign Language)',
      source: 'Verified Academic Research Consortium',
      license: 'Non-Commercial Academic Research',
      sampleCount: 'Continuous Sentence Videos & Aligned Glosses',
      split: 'Signer-Disjoint (Train / Val / Test)',
      status: 'PLANNED' as const,
      role: 'Continuous ISL Translation Training Pipeline',
    },
    {
      name: 'iSign Dataset',
      language: 'ISL (Indian Sign Language)',
      source: 'Indian Sign Language Research Group',
      license: 'Research Access Permitted',
      sampleCount: 'Isolated Signs (Dictionary & Common Phrases)',
      split: 'Disjoint Signer Protocol',
      status: 'EXPERIMENTAL' as const,
      role: 'Baseline Isolated Sign Classification',
    },
    {
      name: 'ASL Citizen',
      language: 'ASL (American Sign Language)',
      source: 'Microsoft Research / University of Washington',
      license: 'Creative Commons Attribution 4.0 International',
      sampleCount: '83,000+ Isolated Sign Videos across 52 Signers',
      split: 'Standard Signer-Disjoint Split',
      status: 'IMPLEMENTED' as const,
      role: 'Primary Benchmark for ASL Isolated Recognition',
    },
    {
      name: 'How2Sign Multimodal Corpus',
      language: 'ASL (American Sign Language)',
      source: 'Carnegie Mellon / UPC Barcelona',
      license: 'Custom Academic License',
      sampleCount: '80+ Hours of Instructional Continuous Signing',
      split: 'Speaker/Signer Isolated Partition',
      status: 'PLANNED' as const,
      role: 'Continuous ASL Sequence Modeling',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet/10 text-violet-dark text-xs font-mono mb-3">
          Academic Foundations
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight mb-3">
          Research, Datasets & Evaluation Protocols
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          Robust sign language machine learning requires rigorous dataset provenance, strict signer-disjoint
          partitioning, and honest evaluation standards.
        </p>
      </div>

      {/* Dataset Registry */}
      <div>
        <h2 className="font-display font-semibold text-lg text-ink mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-navy" />
          <span>Verified Dataset Registry</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((ds, idx) => (
            <Card key={idx} className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-base text-ink">{ds.name}</h3>
                  <StatusBadge status={ds.status} size="sm" />
                </div>
                <span className="text-xs font-mono text-violet font-semibold block mb-2">{ds.language}</span>
                <p className="text-xs text-ink-muted leading-relaxed mb-3">{ds.role}</p>

                <div className="space-y-1 text-[11px] font-mono text-ink-muted border-t border-ink/10 pt-2">
                  <div><strong className="text-ink">License:</strong> {ds.license}</div>
                  <div><strong className="text-ink">Partition:</strong> {ds.split}</div>
                  <div><strong className="text-ink">Scope:</strong> {ds.sampleCount}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Evaluation Protocol */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
          <GitFork className="w-5 h-5 text-cyan-dark" />
          <span>Signer-Disjoint Splitting Standards</span>
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          A common pitfall in sign language computer vision is evaluation on random frame or video splits where
          the same signer appears in both training and test sets. This leads to artificially inflated accuracy
          as the network memorizes idiosyncratic signer clothing, body proportions, or room backgrounds.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-2">
          <div className="p-3 rounded-xl bg-cream/60 border border-ink/10">
            <span className="text-ink font-semibold block mb-1">1. Zero Overlap</span>
            <span className="text-[11px] text-ink-muted">Signers in test set never appear in training.</span>
          </div>
          <div className="p-3 rounded-xl bg-cream/60 border border-ink/10">
            <span className="text-ink font-semibold block mb-1">2. Multi-Metric Reporting</span>
            <span className="text-[11px] text-ink-muted">Top-1, Top-5, macro F1, and per-class confusion.</span>
          </div>
          <div className="p-3 rounded-xl bg-cream/60 border border-ink/10">
            <span className="text-ink font-semibold block mb-1">3. Latency Profiling</span>
            <span className="text-[11px] text-ink-muted">Median &amp; p95 latency on target 16GB CPU machine.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
