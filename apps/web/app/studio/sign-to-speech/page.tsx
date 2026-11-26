'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Video, ShieldCheck, Activity, Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { useWebcam } from '../../../hooks/useWebcam';
import { useMediaPipeLandmarks } from '../../../hooks/useMediaPipeLandmarks';
import { WebcamPreview } from '../../../components/webcam/WebcamPreview';
import { CameraControls } from '../../../components/webcam/CameraControls';
import { RecognitionPanel } from '../../../components/recognition/RecognitionPanel';
import { TranscriptPanel } from '../../../components/recognition/TranscriptPanel';
import { LanguageSelector } from '../../../components/ui/LanguageSelector';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Card } from '../../../components/ui/Card';
import { apiClient } from '../../../services/api';
import {
  SignLanguage,
  SpokenLanguage,
  CandidateSign,
  PredictionStatus,
  TranslationResponse,
  VisionFramePayload,
} from '../../../types';

export default function SignToSpeechStudioPage() {
  const [signLanguage, setSignLanguage] = useState<SignLanguage>('ISL');
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguage>('EN');
  const [sessionId, setSessionId] = useState<string>('');

  // Recognition state
  const [predictionStatus, setPredictionStatus] = useState<PredictionStatus>('not_processed');
  const [topPrediction, setTopPrediction] = useState<CandidateSign | null>(null);
  const [candidates, setCandidates] = useState<CandidateSign[]>([]);
  const [modelName, setModelName] = useState<string>('isl-geometric-heuristic-v1');
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [translation, setTranslation] = useState<TranslationResponse | null>(null);

  // Frame buffer for temporal recognition
  const frameBufferRef = useRef<VisionFramePayload[]>([]);
  const lastInferenceTimeRef = useRef<number>(0);

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
  const { hands, fps, latestPayload } = useMediaPipeLandmarks(videoRef, isStreaming, sessionId);

  // Initialize or terminate backend session
  useEffect(() => {
    let active = true;
    if (isStreaming && !sessionId) {
      apiClient
        .createSession({
          sign_language: signLanguage,
          spoken_language: spokenLanguage,
          mode: 'sign-to-speech',
        })
        .then((res) => {
          if (active) setSessionId(res.session_id);
        })
        .catch(() => {
          if (active) setSessionId(`local-${Date.now()}`);
        });
    } else if (!isStreaming && sessionId) {
      apiClient.terminateSession(sessionId).catch(() => {});
      setSessionId('');
      setTopPrediction(null);
      setCandidates([]);
      setPredictionStatus('not_processed');
      frameBufferRef.current = [];
    }

    return () => {
      active = false;
    };
  }, [isStreaming, sessionId, signLanguage, spokenLanguage]);

  // Buffer frames and periodically execute recognition
  useEffect(() => {
    if (!isStreaming || !latestPayload) return;

    // Ingest frame into buffer
    frameBufferRef.current.push(latestPayload);
    if (frameBufferRef.current.length > 20) {
      frameBufferRef.current.shift();
    }

    // Rate-limit API inference requests (every ~500ms)
    const now = Date.now();
    if (now - lastInferenceTimeRef.current >= 500 && frameBufferRef.current.length >= 5) {
      lastInferenceTimeRef.current = now;
      const bufferCopy = [...frameBufferRef.current];

      apiClient
        .predictSign({
          session_id: sessionId || 'local-session',
          sign_language: signLanguage,
          frames: bufferCopy,
          min_confidence_threshold: 0.60,
        })
        .then((pred) => {
          setPredictionStatus(pred.status);
          setTopPrediction(pred.top_prediction || null);
          setCandidates(pred.candidates || []);
          setModelName(pred.model_name);
          setLatencyMs(pred.processing_duration_ms);

          // If valid sign detected, request contextual translation
          if (pred.top_prediction && pred.status === 'prediction_available') {
            apiClient
              .translateGloss({
                source_sign_language: signLanguage,
                target_spoken_language: spokenLanguage,
                gloss_sequence: [pred.top_prediction.gloss],
                confidence: pred.top_prediction.confidence,
              })
              .then((trans) => {
                setTranslation(trans);
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          setPredictionStatus('processing_failure');
        });
    }
  }, [latestPayload, isStreaming, sessionId, signLanguage, spokenLanguage]);

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
            setTopPrediction(null);
          }}
          onSpokenLanguageChange={(lang) => {
            setSpokenLanguage(lang);
            setTranslation(null);
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
            status={predictionStatus}
            topPrediction={topPrediction}
            candidates={candidates}
            modelName={modelName}
            latencyMs={latencyMs}
          />

          <TranscriptPanel
            translation={translation}
            targetLanguage={spokenLanguage}
            onClear={() => {
              setTranslation(null);
              setTopPrediction(null);
            }}
          />

          {/* Live Diagnostic Telemetry */}
          <Card className="p-4 flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span>Session ID:</span>
              <span className="font-semibold text-ink">{sessionId || 'Standby'}</span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Hands Detected:</span>
              <span className="font-semibold text-ink">{hands.length}</span>
            </div>
            <div className="flex items-center justify-between text-ink-muted">
              <span>Temporal Buffer:</span>
              <span className="font-semibold text-ink">{frameBufferRef.current.length} frames</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
