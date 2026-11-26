'use client';

import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { ShieldCheck, Eye, EyeOff, Sliders, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [defaultSign, setDefaultSign] = useState('ISL');
  const [defaultSpoken, setDefaultSpoken] = useState('EN');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 text-ink-muted text-xs font-mono mb-3">
          Configuration &amp; Accessibility
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight mb-2">
          System Preferences
        </h1>
        <p className="text-sm text-ink-muted">
          Manage your default communication directions, privacy thresholds, and assistive display preferences.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-softgreen/30 border border-softgreen text-navy text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-navy" />
          <span>Preferences updated successfully for this browser session.</span>
        </div>
      )}

      {/* Language Preferences */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-base text-ink">Language &amp; Region Defaults</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Default Sign Language"
            value={defaultSign}
            onChange={(e) => setDefaultSign(e.target.value)}
            options={[
              { value: 'ISL', label: 'Indian Sign Language (ISL)' },
              { value: 'ASL', label: 'American Sign Language (ASL)' },
            ]}
          />
          <Select
            label="Default Spoken Translation"
            value={defaultSpoken}
            onChange={(e) => setDefaultSpoken(e.target.value)}
            options={[
              { value: 'EN', label: 'English' },
              { value: 'HI', label: 'Hindi (हिंदी)' },
            ]}
          />
        </div>
      </Card>

      {/* Privacy Protocols */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-base text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-softgreen" />
            <span>Local-First Privacy Configuration</span>
          </h2>
          <span className="px-2.5 py-1 rounded-md bg-softgreen/30 text-navy font-mono text-xs font-semibold">
            ENFORCED
          </span>
        </div>
        <div className="space-y-3 text-xs text-ink-muted">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-cream/50 border border-ink/10">
            <EyeOff className="w-4 h-4 text-navy flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block">Zero Video Retention:</strong>
              No raw webcam frames are saved to disk or transmitted to remote cloud endpoints.
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-cream/50 border border-ink/10">
            <Sliders className="w-4 h-4 text-navy flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block">Hardware Track Teardown:</strong>
              When the camera is stopped, every MediaStream track is immediately severed to release hardware.
            </div>
          </div>
        </div>
      </Card>

      {/* Accessibility Preferences */}
      <Card className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-base text-ink">Accessibility (WCAG 2.2 AA)</h2>
        <div className="space-y-3 text-xs">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-4 h-4 rounded border-ink/20 text-navy focus:ring-navy"
            />
            <span className="text-ink">
              <strong>Prefer Reduced Motion:</strong> Suppress subtle 3D avatar idle breathing and animated transitions.
            </span>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
