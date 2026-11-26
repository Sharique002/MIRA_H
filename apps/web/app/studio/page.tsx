'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Video,
  ArrowRight,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatusIndicator } from '../../components/ui/StatusIndicator';
import { apiClient } from '../../services/api';
import { SystemStatusData } from '../../types';

export default function StudioDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .getSystemStatus()
      .then((data) => {
        if (isMounted) {
          setSystemStatus(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
      {/* Studio Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-navy text-cyan text-xs font-mono font-semibold">
              MIRA-H Studio
            </span>
            <StatusIndicator status={systemStatus ? 'online' : 'offline'} label={systemStatus ? 'API Ready' : 'API Connecting'} />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink tracking-tight">
            Assistive Communication Dashboard
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Select a communication workspace to start real-time visual recognition or reverse signing translation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/studio/sign-to-speech"
            className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Video className="w-4 h-4 text-cyan" />
            <span>Open Webcam Studio</span>
          </Link>
          <Link
            href="/studio/speech-to-sign"
            className="px-4 py-2.5 rounded-xl bg-violet hover:bg-violet-dark text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open 3D Avatar</span>
          </Link>
        </div>
      </div>

      {/* Primary Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Workspace 1: Sign to Speech */}
        <Card className="flex flex-col justify-between gap-6 border-2 hover:border-navy/40 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-cyan transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <StatusBadge status="IMPLEMENTED" size="sm" />
            </div>

            <h2 className="font-display font-bold text-xl text-ink mb-2">
              Sign-to-Speech Workspace
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed mb-6">
              Webcam-driven live sign language recognition. Extracts 21-point hand landmarks, validates
              trajectories against ISL and ASL geometric baselines, and outputs translated spoken audio.
            </p>

            <div className="space-y-2 text-xs font-mono bg-cream/60 p-3.5 rounded-xl border border-ink/10">
              <div className="flex justify-between text-ink-muted">
                <span>Input Modality:</span>
                <span className="font-semibold text-ink">Webcam Hand Keypoints</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Supported Signs:</span>
                <span className="font-semibold text-ink">ISL &bull; ASL</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Output Voice:</span>
                <span className="font-semibold text-ink">English &bull; Hindi</span>
              </div>
            </div>
          </div>

          <Link
            href="/studio/sign-to-speech"
            className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-navy-light transition-colors"
          >
            <span>Enter Sign-to-Speech Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan" />
          </Link>
        </Card>

        {/* Workspace 2: Speech to Sign */}
        <Card className="flex flex-col justify-between gap-6 border-2 hover:border-violet/40 transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet/10 flex items-center justify-center text-violet-dark group-hover:bg-violet group-hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <StatusBadge status="IMPLEMENTED" size="sm" />
            </div>

            <h2 className="font-display font-bold text-xl text-ink mb-2">
              Speech-to-Sign (3D Avatar)
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed mb-6">
              Reverse communication pipeline. Type or speak English and Hindi sentences to generate
              accurate sign gloss sequences rendered by an interactive 3D humanoid avatar.
            </p>

            <div className="space-y-2 text-xs font-mono bg-cream/60 p-3.5 rounded-xl border border-ink/10">
              <div className="flex justify-between text-ink-muted">
                <span>Input Modality:</span>
                <span className="font-semibold text-ink">Text &bull; Microphone</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Target Animation:</span>
                <span className="font-semibold text-ink">Three.js Procedural Avatar</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Vocabulary:</span>
                <span className="font-semibold text-ink">Common Greetings &amp; Phrases</span>
              </div>
            </div>
          </div>

          <Link
            href="/studio/speech-to-sign"
            className="w-full py-2.5 rounded-xl bg-violet text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-violet-dark transition-colors"
          >
            <span>Enter Speech-to-Sign Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {/* System & Hardware Health */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-dark" />
            <h3 className="font-display font-semibold text-sm text-ink">Runtime &amp; System Health</h3>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            Target: 16GB RAM Local CPU Baseline
          </span>
        </div>

        {systemStatus ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-cream/50 rounded-xl border border-ink/10">
              <span className="text-ink-muted block text-[11px]">CPU Usage</span>
              <span className="text-base font-semibold text-ink mt-0.5 block">
                {systemStatus.cpu.usage_percent}%
              </span>
              <span className="text-[10px] text-ink-subtle">
                {systemStatus.cpu.logical_cores} Cores Active
              </span>
            </div>

            <div className="p-3 bg-cream/50 rounded-xl border border-ink/10">
              <span className="text-ink-muted block text-[11px]">Memory Usage</span>
              <span className="text-base font-semibold text-ink mt-0.5 block">
                {systemStatus.memory.used_percent}%
              </span>
              <span className="text-[10px] text-ink-subtle">
                {systemStatus.memory.available_gb} GB Free / {systemStatus.memory.total_gb} GB
              </span>
            </div>

            <div className="p-3 bg-cream/50 rounded-xl border border-ink/10">
              <span className="text-ink-muted block text-[11px]">Recognition Engines</span>
              <span className="text-base font-semibold text-ink mt-0.5 block">
                {systemStatus.models.models_loaded} Neural / {systemStatus.models.rule_based_active ?? 0} Heuristic
              </span>
              <span className="text-[10px] text-ink-subtle">
                {systemStatus.models.total_registered} Registered (Rule-Based Active)
              </span>
            </div>

            <div className="p-3 bg-cream/50 rounded-xl border border-ink/10">
              <span className="text-ink-muted block text-[11px]">Environment</span>
              <span className="text-base font-semibold text-ink mt-0.5 block uppercase">
                {systemStatus.environment}
              </span>
              <span className="text-[10px] text-ink-subtle">Local-First</span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs font-mono text-ink-muted">
            Connecting to FastAPI backend (http://localhost:8000)...
          </div>
        )}
      </Card>
    </div>
  );
}
