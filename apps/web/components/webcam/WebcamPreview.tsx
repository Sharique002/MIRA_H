'use client';

import React from 'react';
import { Camera, Shield, EyeOff, AlertTriangle, Activity } from 'lucide-react';
import { LandmarkCanvas } from './LandmarkCanvas';
import { HandLandmarks } from '../../types';

interface WebcamPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  hands: HandLandmarks[];
  fps: number;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  errorMessage: string | null;
  onActivate: () => void;
  width?: number;
  height?: number;
}

export const WebcamPreview: React.FC<WebcamPreviewProps> = ({
  videoRef,
  isStreaming,
  hands,
  fps,
  permissionStatus,
  errorMessage,
  onActivate,
  width = 640,
  height = 480,
}) => {
  return (
    <div className="relative w-full aspect-4/3 max-w-2xl mx-auto rounded-2xl overflow-hidden bg-navy-dark border-2 border-ink/20 shadow-xl flex flex-col justify-center items-center">
      {/* 1. Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isStreaming ? 'opacity-100 scale-x-[-1]' : 'opacity-0 pointer-events-none'
        }`}
        style={{ transform: 'scaleX(-1)' }} // Mirror view for natural signing
      />

      {/* 2. MediaPipe Landmark Canvas Overlay */}
      {isStreaming && (
        <div className="absolute inset-0" style={{ transform: 'scaleX(-1)' }}>
          <LandmarkCanvas hands={hands} width={width} height={height} />
        </div>
      )}

      {/* 3. Inactive / Permission Prompt Overlay */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-navy-dark/95 z-20">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-cyan border border-white/10">
            <Camera className="w-8 h-8" />
          </div>

          <h3 className="font-display font-semibold text-lg text-white mb-2">
            Camera Off — Explicit Activation Required
          </h3>
          <p className="text-xs text-white/70 max-w-md mb-6 leading-relaxed">
            MIRA-H processes hand landmarks entirely on your device inside your browser. No raw video is
            ever transmitted or stored on cloud servers.
          </p>

          {errorMessage ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-coral/20 border border-coral text-coral text-xs mb-4 max-w-md">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <button
            onClick={onActivate}
            className="px-6 py-2.5 rounded-xl bg-cyan hover:bg-cyan-glow text-ink font-semibold text-sm transition-all shadow-lg flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Enable Camera & Landmarks</span>
          </button>

          <div className="flex items-center gap-4 text-[11px] font-mono text-cyan/80 mt-6">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Local Wasm Processing
            </span>
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> Zero Server Stream
            </span>
          </div>
        </div>
      )}

      {/* 4. Live Floating HUD Diagnostics */}
      {isStreaming && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/80 backdrop-blur-md border border-white/10 text-white text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
            <span className="font-semibold text-cyan">REC LIVE</span>
            <span className="text-white/40">|</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan" />
              {fps} FPS
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy/80 backdrop-blur-md border border-white/10 text-white text-xs font-mono">
            <span>Hands: {hands.length}</span>
            {hands.length > 0 && (
              <span className="text-softgreen">({hands.map((h) => h.handedness[0]).join(', ')})</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
