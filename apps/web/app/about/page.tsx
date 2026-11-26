import React from 'react';
import { Card } from '../../components/ui/Card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-ink-muted text-xs font-mono mb-3">
          Governance & Scope
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight mb-3">
          Mission & Boundary Limitations
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          MIRA-H is dedicated to creating accessible, reliable, and verified multimodal communication tools.
          We provide transparent engineering boundaries for every capability in this prototype.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-lg text-ink">Core Values & Methodology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ink-muted leading-relaxed">
          <div className="p-4 rounded-xl bg-cream/50 border border-ink/10">
            <strong className="text-ink block mb-1">Human-Centred Assistive Design</strong>
            Sign languages possess distinct cultural and grammatical identities. We avoid reductionist
            paradigms that treat signs merely as English or Hindi word substitutions.
          </div>
          <div className="p-4 rounded-xl bg-cream/50 border border-ink/10">
            <strong className="text-ink block mb-1">Strict Product Honesty</strong>
            We reject the practice of presenting deterministic mock data or simulated prototypes as trained
            production neural networks. Model evaluation metrics are reported only when backed by empirical
            disjoint splits.
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 border-coral/30 bg-coral/5">
        <div className="flex items-center gap-2 text-coral-dark">
          <AlertCircle className="w-5 h-5 text-coral" />
          <h2 className="font-display font-semibold text-base">Known Prototype Limitations (v2.0)</h2>
        </div>
        <ul className="space-y-2 text-xs text-ink-muted list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-ink">Isolated Signs vs. Continuous Sentences:</strong> The initial
            prototype accurately recognizes isolated gestures and short sequential phrases. Full continuous
            sign language sentence translation requires multi-hour annotated corpora and is currently in
            research pipeline (P06).
          </li>
          <li>
            <strong className="text-ink">Facial & Non-Manual Signals:</strong> While facial landmarks are
            technically extractable, we do not claim emotional understanding or deep grammatical facial parsing
            without validated ground-truth classifiers.
          </li>
          <li>
            <strong className="text-ink">Hardware & Lighting Constraints:</strong> Edge landmark extraction
            performs optimally in well-lit environments where hands and upper torso are unoccluded.
          </li>
          <li>
            <strong className="text-ink">Speech Synthesis Accents:</strong> Spoken audio playback relies on
            the browser client Web Speech API and host OS text-to-speech synthesizers.
          </li>
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display font-semibold text-base text-ink">Accessibility Conformance (WCAG 2.2 AA)</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          The MIRA-H web application is built to meet Web Content Accessibility Guidelines (WCAG) 2.2 Level AA:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono pt-2">
          <div className="p-2.5 rounded-lg bg-white border border-ink/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-softgreen" />
            <span>Keyboard Accessible</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-ink/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-softgreen" />
            <span>4.5:1+ Contrast Ratio</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-ink/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-softgreen" />
            <span>Screen-Reader Labels</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-ink/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-softgreen" />
            <span>Reduced Motion Ready</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-ink/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-softgreen" />
            <span>Explicit Consent</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-ink/10 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-softgreen" />
            <span>Visible Hardware State</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
