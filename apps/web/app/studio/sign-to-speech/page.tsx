'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useWebcam } from '../../../hooks/useWebcam';
import { useMediaPipeLandmarks } from '../../../hooks/useMediaPipeLandmarks';
import { WebcamPreview } from '../../../components/webcam/WebcamPreview';
import { CameraControls } from '../../../components/webcam/CameraControls';
import { RecognitionPanel } from '../../../components/recognition/RecognitionPanel';
import { TranscriptPanel } from '../../../components/recognition/TranscriptPanel';
import { LanguageSelector } from '../../../components/ui/LanguageSelector';
import { Card } from '../../../components/ui/Card';
import { apiClient } from '../../../services/api';
import {
  createSignToSpeechLifecycle,
  getDefaultModelIdForLanguage,
  SignToSpeechLifecycleState,
} from '../../../services/signToSpeechLifecycle';
import { SignLanguage, SpokenLanguage } from '../../../types';

export default function SignToSpeechStudioPage() {
  const [signLanguage, setSignLanguage] = useState<SignLanguage>('ISL');
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguage>('EN');
  const [lifecycle, setLifecycle] = useState<SignToSpeechLifecycleState>(() => ({
    sessionId: '',
    sessionMode: 'idle',
    sessionNotice: null,
    predictionStatus: 'not_processed',
    topPrediction: null,
    candidates: [],
    modelName: getDefaultModelIdForLanguage('ISL'),
    latencyMs: 0,
    translation: null,
    translationNotice: null,
    isProcessingRequest: false,
    frameBufferCount: 0,
  }));

  const controllerRef = useRef<ReturnType<typeof createSignToSpeechLifecycle> | null>(null);
  const wasStreamingRef = useRef<boolean>(false);

  if (controllerRef.current === null) {
    controllerRef.current = createSignToSpeechLifecycle({
      initialSignLanguage: signLanguage,
      api: {
        createSession: (params) => apiClient.createSession(params),
        terminateSession: (sessionId) => apiClient.terminateSession(sessionId),
        predictSign: (params) => apiClient.predictSign(params),
        translateGloss: (params) => apiClient.translateGloss(params),
      },
      onSnapshot: (nextState) => {
        setLifecycle(nextState);
      },
    });
  }

  useEffect(() => {
    const controller = controllerRef.current;
    controller?.mount();
    return () => {
      controller?.unmount();
    };
  }, []);

  // Camera hook
  const {
    videoRef,
    isStreaming,
    permissionStatus,
    errorMessage,
    startCamera,
    stopCamera,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useWebcam();

  // MediaPipe Landmark hook
  const { hands, fps, latestPayload } = useMediaPipeLandmarks(
    videoRef,
    isStreaming,
    lifecycle.sessionId
  );

  // Synchronize camera stream start/stop with backend/local session lifecycle
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    if (isStreaming && !wasStreamingRef.current) {
      wasStreamingRef.current = true;
      void controller.startSession({ signLanguage, spokenLanguage });
    } else if (!isStreaming && wasStreamingRef.current) {
      wasStreamingRef.current = false;
      controller.stopSession();
    }
  }, [isStreaming, signLanguage, spokenLanguage]);

  // Buffer frames and execute rate-limited recognition & translation safely
  useEffect(() => {
    if (!isStreaming || !latestPayload || !controllerRef.current) return;
    void controllerRef.current.enqueueAndMaybePredict(latestPayload, {
      signLanguage,
      spokenLanguage,
      nowMs: Date.now(),
    });
  }, [latestPayload, isStreaming, signLanguage, spokenLanguage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan/20 text-navy font-mono text-xs font-bold">
              WORKSPACE
            </span>
            <span className="text-xs font-mono text-ink-muted">Sign &rarr; Spoken Pipeline</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Sign-to-Speech Studio
          </h1>
        </div>

        <LanguageSelector
          signLanguage={signLanguage}
          spokenLanguage={spokenLanguage}
          onSignLanguageChange={(lang) => {
            setSignLanguage(lang);
            controllerRef.current?.resetOnLanguageChange({
              signLanguage: lang,
              resetPrediction: true,
            });
          }}
          onSpokenLanguageChange={(lang) => {
            setSpokenLanguage(lang);
            controllerRef.current?.resetOnLanguageChange({
              signLanguage,
              resetTranslation: true,
            });
          }}
          disabled={isStreaming}
        />
      </div>

      {/* Main Studio Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Webcam & Controls (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <WebcamPreview
            videoRef={videoRef}
            isStreaming={isStreaming}
            hands={hands}
            fps={fps}
            permissionStatus={permissionStatus}
            errorMessage={errorMessage}
            onActivate={startCamera}
          />

          <CameraControls
            isStreaming={isStreaming}
            onStart={startCamera}
            onStop={stopCamera}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
          />

          {/* Privacy Note */}
          <div className="p-3.5 rounded-xl bg-white border border-ink/10 flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-softgreen flex-shrink-0" />
              <span>Camera frames never leave your browser. Landmark extraction runs via local WebAssembly.</span>
            </div>
            <span className="font-mono text-[10px] bg-cream px-2 py-0.5 rounded">Local Wasm</span>
          </div>
        </div>

        {/* Right Column: AI Recognition & Translation (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <RecognitionPanel
            signLanguage={signLanguage}
            status={lifecycle.predictionStatus}
            topPrediction={lifecycle.topPrediction}
            candidates={lifecycle.candidates}
            modelName={lifecycle.modelName}
            latencyMs={lifecycle.latencyMs}
          />

          <TranscriptPanel
            translation={lifecycle.translation}
            targetLanguage={spokenLanguage}
            onClear={() => {
              controllerRef.current?.clearResults();
            }}
          />

          {(lifecycle.sessionNotice || lifecycle.translationNotice) && (
            <div className="flex flex-col gap-2">
              {lifecycle.sessionNotice && (
                <div
                  role="status"
                  className="p-3 rounded-xl bg-coral/15 border border-coral/40 text-ink text-xs flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-coral-dark flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{lifecycle.sessionNotice}</span>
                </div>
              )}
              {lifecycle.translationNotice && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-coral/15 border border-coral/40 text-ink text-xs flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-coral-dark flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{lifecycle.translationNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Live Diagnostic Telemetry */}
          <Card className="p-4 flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span>Session ID:</span>
              <span className="font-semibold text-ink">{lifecycle.sessionId || 'Standby'}</span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Hands Detected:</span>
              <span className="font-semibold text-ink">{hands.length}</span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Temporal Buffer:</span>
              <span className="font-semibold text-ink">{lifecycle.frameBufferCount} frames</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
