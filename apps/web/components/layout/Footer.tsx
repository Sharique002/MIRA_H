import React from 'react';
import Link from 'next/link';
import { ShieldCheck, EyeOff } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-navy text-white border-t border-navy-light/40 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan flex items-center justify-center text-navy font-bold text-sm">
              M
            </div>
            <span className="font-display font-bold text-lg tracking-tight">MIRA-H</span>
            <span className="text-xs font-mono text-cyan/80">Local-First Prototype</span>
          </div>
          <p className="text-xs text-white/70 max-w-md leading-relaxed">
            Human-centred multimodal assistive communication platform bridging Indian Sign Language (ISL),
            American Sign Language (ASL), English, and Hindi through real-time edge computer vision and
            accessible interaction architecture.
          </p>
          <div className="flex items-center gap-4 text-xs text-cyan">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Privacy-First Edge Processing
            </span>
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> Zero Video Retention
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-cyan mb-3">Workspaces</h4>
          <ul className="space-y-2 text-xs text-white/70">
            <li>
              <Link href="/studio" className="hover:text-white transition-colors">Studio Dashboard</Link>
            </li>
            <li>
              <Link href="/studio/sign-to-speech" className="hover:text-white transition-colors">Sign-to-Speech (Webcam)</Link>
            </li>
            <li>
              <Link href="/studio/speech-to-sign" className="hover:text-white transition-colors">Speech-to-Sign (3D Avatar)</Link>
            </li>
            <li>
              <Link href="/model-lab" className="hover:text-white transition-colors">Model Lab & Registry</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-cyan mb-3">Governance</h4>
          <ul className="space-y-2 text-xs text-white/70">
            <li>
              <Link href="/about" className="hover:text-white transition-colors">Mission & Limitations</Link>
            </li>
            <li>
              <Link href="/research" className="hover:text-white transition-colors">Research & Datasets</Link>
            </li>
            <li>
              <Link href="/settings" className="hover:text-white transition-colors">Privacy & Accessibility</Link>
            </li>
            <li>
              <span className="text-white/40 font-mono text-[11px]">WCAG 2.2 AA Conformance</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 font-mono gap-4">
        <div>
          &copy; {new Date().getFullYear()} MIRA-H by Sharique. Strictly honest AI disclosure standard.
        </div>
        <div>
          Engineered for local-first deployment on CPU runtime (~16GB RAM envelope).
        </div>
      </div>
    </footer>
  );
};
