import React from 'react';
import Link from 'next/link';
import {
  Video,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Eye,
  CheckCircle,
  Activity,
  Mic,
  MessageSquare
} from 'lucide-react';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-16 sm:pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 border border-ink/10 text-xs font-mono text-ink-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-softgreen animate-pulse" />
          <span>Local-First Prototype Architecture &bull; v2.0 Specification</span>
        </div>

        <h1 className="font-display font-bold text-4xl sm:text-6xl text-ink tracking-tight max-w-4xl leading-[1.15] mb-6">
          Dignified, Bi-Directional Sign & Speech Communication
        </h1>

        <p className="text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed mb-10">
          Bridging <span className="font-semibold text-ink">Indian Sign Language (ISL)</span> and{' '}
          <span className="font-semibold text-ink">American Sign Language (ASL)</span> with{' '}
          <span className="font-semibold text-ink">English</span> and{' '}
          <span className="font-semibold text-ink">Hindi</span> using on-device computer vision and honest AI systems.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio/sign-to-speech"
            className="px-6 py-3.5 rounded-xl bg-navy hover:bg-navy-light text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2.5"
          >
            <Video className="w-4 h-4 text-cyan" />
            <span>Launch Sign-to-Speech Studio</span>
            <ArrowRight className="w-4 h-4 text-cyan" />
          </Link>

          <Link
            href="/studio/speech-to-sign"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-cream border border-ink/20 text-ink font-semibold text-sm transition-all shadow-xs flex items-center gap-2.5"
          >
            <MessageSquare className="w-4 h-4 text-violet" />
            <span>Spoken-to-Sign (3D Avatar)</span>
          </Link>

          <Link
            href="/model-lab"
            className="px-6 py-3.5 rounded-xl bg-cream/70 hover:bg-cream border border-ink/15 text-ink font-medium text-sm transition-all flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-ink-muted" />
            <span>Model Diagnostics</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-3xl w-full border-t border-ink/10 pt-8 text-left">
          <div>
            <span className="text-xs font-mono text-ink-muted block uppercase">Source Signs</span>
            <span className="font-display font-bold text-base text-ink">ISL & ASL</span>
          </div>
          <div>
            <span className="text-xs font-mono text-ink-muted block uppercase">Spoken Output</span>
            <span className="font-display font-bold text-base text-ink">English & Hindi</span>
          </div>
          <div>
            <span className="text-xs font-mono text-ink-muted block uppercase">Video Privacy</span>
            <span className="font-display font-bold text-base text-softgreen font-semibold">100% On-Device</span>
          </div>
          <div>
            <span className="text-xs font-mono text-ink-muted block uppercase">Architecture</span>
            <span className="font-display font-bold text-base text-cyan font-semibold">Local CPU Target</span>
          </div>
        </div>
      </section>

      {/* 2. Communication Problem & Mission */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-ink/10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-coral/15 text-coral-dark text-xs font-mono font-bold mb-3 uppercase">
              The Communication Barrier
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight mb-4 leading-snug">
              Sign languages are full natural languages with independent grammars
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed mb-4">
              Over 70 million deaf individuals worldwide face daily barriers when interacting with hearing
              counterparts. Crucially, sign languages like Indian Sign Language (ISL) and American Sign
              Language (ASL) are not word-for-word codes for English or Hindi—they possess rich spatial
              structures, distinct grammatical syntax, and essential non-manual markers.
            </p>
            <p className="text-sm text-ink-muted leading-relaxed">
              MIRA-H treats sign-to-spoken and spoken-to-sign as distinct pipelines, preserving
              linguistic nuance without fabricating synthetic translation shortcuts.
            </p>
          </div>

          <div className="flex flex-col gap-4 bg-cream/50 p-6 rounded-2xl border border-ink/10">
            <h3 className="font-display font-semibold text-base text-ink mb-1">Our Product Mandate</h3>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-softgreen flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-muted leading-relaxed">
                <strong className="text-ink">Distinct Language Engines:</strong> Never merge ISL and ASL into an
                invented generic switch.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-softgreen flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-muted leading-relaxed">
                <strong className="text-ink">No Invented Benchmarks:</strong> Every status badge accurately
                distinguishes between tested implementations and planned research models.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-softgreen flex-shrink-0 mt-0.5" />
              <p className="text-xs text-ink-muted leading-relaxed">
                <strong className="text-ink">Complete User Agency:</strong> The camera activates solely upon
                deliberate user initiation and instantly disconnects hardware tracks upon stop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Both Workflows */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-3xl text-ink tracking-tight mb-3">
            Two Symmetrical Communication Pipelines
          </h2>
          <p className="text-sm text-ink-muted">
            Engineered as independent subsystems ensuring natural bi-directional conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pipeline A: Sign to Spoken */}
          <div className="p-8 rounded-3xl bg-white border border-ink/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-cyan/20 text-navy font-mono text-xs font-bold uppercase">
                  Workflow A
                </span>
                <StatusBadge status="IMPLEMENTED" size="sm" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">
                Sign-to-Spoken (Visual Ingestion)
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed mb-6">
                Captures user hand movements via local webcam, applies MediaPipe 21-point 3D landmark
                extraction, normalizes spatial coordinates, classifies isolated signs, and synthesizes natural
                spoken audio.
              </p>

              <div className="space-y-3 font-mono text-xs bg-cream/50 p-4 rounded-xl border border-ink/10 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Browser Camera (Explicit Consent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>MediaPipe 21-Keypoint Hand Skeleton</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>ISL / ASL Geometric & Temporal Classifier</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold">4</span>
                  <span>Contextual English / Hindi Speech Output</span>
                </div>
              </div>
            </div>

            <Link
              href="/studio/sign-to-speech"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-light transition-colors"
            >
              <span>Test Sign-to-Speech Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pipeline B: Spoken to Sign */}
          <div className="p-8 rounded-3xl bg-white border border-ink/10 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-violet/20 text-violet-dark font-mono text-xs font-bold uppercase">
                  Workflow B
                </span>
                <StatusBadge status="IMPLEMENTED" size="sm" />
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">
                Spoken-to-Sign (3D Avatar Engine)
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed mb-6">
                Converts English or Hindi spoken words or typed text into standardized sign glosses and
                joint rotation keyframes, driving an interactive Three.js 3D avatar viewport in real-time.
              </p>

              <div className="space-y-3 font-mono text-xs bg-cream/50 p-4 rounded-xl border border-ink/10 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet text-white text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Speech Input / Typed English & Hindi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet text-white text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>NLP Gloss & Temporal Sequence Generator</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet text-white text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Three.js Skeletal Joint Kinematics</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet text-white text-[10px] flex items-center justify-center font-bold">4</span>
                  <span>Animated 3D Signing Avatar Display</span>
                </div>
              </div>
            </div>

            <Link
              href="/studio/speech-to-sign"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet text-white text-xs font-semibold hover:bg-violet-dark transition-colors"
            >
              <span>Test Speech-to-Sign Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Security Commitment */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-navy text-white border border-navy-light/40 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Edge-First Privacy Guarantee</span>
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-2">
              Your camera never records or streams video to the cloud
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              In accordance with OWASP security standards and privacy-first principles, video frames are
              processed locally within your browser using WebAssembly. The API backend only receives
              sanitized coordinate landmark arrays for inference.
            </p>
          </div>
          <Link
            href="/settings"
            className="px-6 py-3 rounded-xl bg-cyan text-ink font-semibold text-xs hover:bg-cyan-glow transition-all flex items-center gap-2 flex-shrink-0"
          >
            <span>Review Privacy & Permissions</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
