'use client';

import React, { useMemo, useRef, useState } from 'react';
import { MessageSquare, Mic, MicOff, Sparkles, AlertTriangle } from 'lucide-react';
import { AvatarViewport } from '../../../components/avatar/AvatarViewport';
import { buildSequenceTimeline, hasPlayableDuration } from '../../../components/avatar/keyframeTimeline';
import { LanguageSelector } from '../../../components/ui/LanguageSelector';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ErrorState, UnsupportedFeatureNotice } from '../../../components/ui/FeedbackStates';
import { apiClient } from '../../../services/api';
import {
  SignLanguage,
  SpokenLanguage,
  SignMappingProvenance,
  SignSequenceItem,
} from '../../../types';

const SAMPLE_PHRASES: Record<SignLanguage, Record<SpokenLanguage, Array<{ label: string; text: string }>>> = {
  ISL: {
    EN: [
      { label: 'Hello, thank you', text: 'Hello, thank you' },
      { label: 'Welcome, please help', text: 'Welcome, please help' },
      { label: 'Water, yes', text: 'Water, yes' },
      { label: 'No, thank you', text: 'No, thank you' },
    ],
    HI: [
      { label: 'नमस्ते, पानी और मदद चाहिए।', text: 'नमस्ते, पानी और मदद चाहिए।' },
      { label: 'आपका स्वागत है, धन्यवाद', text: 'आपका स्वागत है, धन्यवाद' },
      { label: 'कृपया, हाँ', text: 'कृपया, हाँ' },
      { label: 'नहीं, शुक्रिया', text: 'नहीं, शुक्रिया' },
    ],
  },
  ASL: {
    EN: [
      { label: 'Hello, thank you', text: 'Hello, thank you' },
      { label: 'I love you', text: 'I love you' },
      { label: 'Welcome, please help', text: 'Welcome, please help' },
      { label: 'Water, yes, no', text: 'Water, yes, no' },
    ],
    HI: [
      { label: 'नमस्ते, मदद और पानी चाहिए।', text: 'नमस्ते, मदद और पानी चाहिए।' },
      { label: 'मैं तुमसे प्यार करता हूँ', text: 'मैं तुमसे प्यार करता हूँ' },
      { label: 'स्वागत, धन्यवाद', text: 'स्वागत, धन्यवाद' },
      { label: 'कृपया, नहीं', text: 'कृपया, नहीं' },
    ],
  },
};

export default function SpeechToSignStudioPage() {
  const [sourceLanguage, setSourceLanguage] = useState<SpokenLanguage>('EN');
  const [targetSignLanguage, setTargetSignLanguage] = useState<SignLanguage>('ISL');
  const [inputText, setInputText] = useState('Hello, thank you for your help');
  const [sequence, setSequence] = useState<SignSequenceItem[]>([]);
  const [unsupportedTokens, setUnsupportedTokens] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<number>(0);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [adapterId, setAdapterId] = useState<string | null>(null);
  const [adapterMode, setAdapterMode] = useState<string>('RULE_BASED_LEXICON');
  const [verificationStatus, setVerificationStatus] = useState<string>('EXPERIMENTAL');
  const [mappingProvenance, setMappingProvenance] = useState<SignMappingProvenance[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [responseNotes, setResponseNotes] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Playback animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [seekRequest, setSeekRequest] = useState<{ index: number; nonce: number } | null>(null);
  const [resetNonce, setResetNonce] = useState(0);

  const hasPlayableSequence = useMemo(
    () => hasPlayableDuration(buildSequenceTimeline(sequence)),
    [sequence]
  );

  // Microphone ASR integration
  const [isListening, setIsListening] = useState(false);

  // Tracks active target-language generation cycles so stale in-flight results
  // from a previous targetSignLanguage cannot populate state after switching.
  const requestCycleRef = useRef(0);

  const clearGeneratedState = () => {
    setSequence([]);
    setUnsupportedTokens([]);
    setCoverage(0);
    setHasGenerated(false);
    setAdapterId(null);
    setAdapterMode('RULE_BASED_LEXICON');
    setVerificationStatus('EXPERIMENTAL');
    setMappingProvenance([]);
    setWarnings([]);
    setResponseNotes(null);
    setApiError(null);
    setIsPlaying(false);
    setCurrentSignIndex(0);
    setIsCompleted(false);
    setSeekRequest(null);
    setResetNonce((n) => n + 1);
  };

  const handleTargetSignLanguageChange = (nextSignLanguage: SignLanguage) => {
    if (nextSignLanguage === targetSignLanguage) return;
    requestCycleRef.current += 1;
    setIsLoading(false);
    clearGeneratedState();
    setTargetSignLanguage(nextSignLanguage);
  };

  const handlePlayToggle = () => {
    if (sequence.length === 0 || !hasPlayableSequence) {
      setIsPlaying(false);
      if (sequence.length > 0) {
        setIsCompleted(true);
      }
      return;
    }
    if (!isPlaying && isCompleted) {
      setIsCompleted(false);
      setCurrentSignIndex(0);
      setSeekRequest((prev) => ({ index: 0, nonce: (prev?.nonce ?? 0) + 1 }));
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setIsCompleted(false);
    setCurrentSignIndex(0);
    setSeekRequest(null);
    setResetNonce((n) => n + 1);
  };

  const handleSelectSign = (idx: number) => {
    setCurrentSignIndex(idx);
    setIsCompleted(false);
    setSeekRequest((prev) => ({ index: idx, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const handlePlaybackComplete = () => {
    setIsPlaying(false);
    setIsCompleted(true);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    const activeCycle = ++requestCycleRef.current;
    const requestedSignLanguage = targetSignLanguage;
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await apiClient.generateSignSequence({
        text: inputText,
        source_language: sourceLanguage,
        target_sign_language: requestedSignLanguage,
      });
      if (activeCycle !== requestCycleRef.current) return;

      const playable = hasPlayableDuration(buildSequenceTimeline(res.sequence));
      setSequence(res.sequence);
      setUnsupportedTokens(res.unsupported_tokens);
      setCoverage(res.vocabulary_coverage);
      setAdapterId(res.adapter_id || null);
      setAdapterMode(res.adapter_mode || 'RULE_BASED_LEXICON');
      setVerificationStatus(res.verification_status || 'EXPERIMENTAL');
      setMappingProvenance(res.mapping_provenance || []);
      setWarnings(res.warnings || []);
      setResponseNotes(res.notes || null);
      setHasGenerated(true);
      setCurrentSignIndex(0);
      setIsCompleted(res.sequence.length > 0 && !playable);
      setSeekRequest(null);
      setIsPlaying(playable);
    } catch (err: unknown) {
      if (activeCycle !== requestCycleRef.current) return;
      clearGeneratedState();
      setApiError(err instanceof Error ? err.message : 'Unable to generate reverse sign sequence.');
    } finally {
      if (activeCycle === requestCycleRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Browser speech recognition (Web Speech API)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    interface BrowserSpeechRecognitionEvent {
      results: ArrayLike<ArrayLike<{ transcript: string }>>;
    }
    interface BrowserSpeechRecognition {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
      start: () => void;
    }
    type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };

    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = sourceLanguage === 'HI' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const activeSamples = SAMPLE_PHRASES[targetSignLanguage][sourceLanguage];
  const verifiedMappingCount = mappingProvenance.filter(
    (entry) => entry.verification_status === 'VERIFIED'
  ).length;
  const validationRatePct =
    mappingProvenance.length > 0
      ? Math.round((verifiedMappingCount / mappingProvenance.length) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-ink/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-violet/20 text-violet-dark font-mono text-xs font-bold">
              WORKSPACE
            </span>
            <span className="text-xs font-mono text-ink-muted">Spoken &rarr; Sign Pipeline</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Speech-to-Sign Avatar Studio
          </h1>
        </div>

        <LanguageSelector
          signLanguage={targetSignLanguage}
          spokenLanguage={sourceLanguage}
          onSignLanguageChange={handleTargetSignLanguageChange}
          onSpokenLanguageChange={setSourceLanguage}
        />
      </div>

      {/* Main Grid: Avatar Viewport & Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 3D Avatar Viewport (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <AvatarViewport
            sequence={sequence}
            isPlaying={isPlaying}
            onPlayToggle={handlePlayToggle}
            onReset={handleResetPlayback}
            currentSignIndex={currentSignIndex}
            onSignIndexChange={setCurrentSignIndex}
            onPlaybackComplete={handlePlaybackComplete}
            seekRequest={seekRequest}
            resetNonce={resetNonce}
          />

          {/* Sequence Timeline Tray */}
          {sequence.length > 0 && (
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-xs font-mono text-ink-muted uppercase">Animation Sequence Queue:</span>
              <div className="flex flex-wrap gap-2">
                {sequence.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSign(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 ${
                      idx === currentSignIndex
                        ? 'bg-navy text-cyan shadow-sm border border-cyan/50 font-bold'
                        : 'bg-white border border-ink/15 text-ink hover:border-ink/40'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{item.sign_id}</span>
                    <span className="text-[10px] opacity-70">{item.duration_ms}ms</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Sentence Input & Lexicon Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-ink/10">
              <h3 className="font-display font-semibold text-sm text-ink flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet" />
                <span>Input Spoken / Written Phrase</span>
              </h3>
              <StatusBadge status="EXPERIMENTAL" size="sm" />
            </div>

            <p className="text-[11px] text-ink-muted leading-relaxed">
              Rule-based lexical pose lookup for documented core phrases only ({targetSignLanguage}).
              This is not full grammatical or neural sign-language translation.
            </p>

            <Textarea
              label={`Enter ${sourceLanguage === 'HI' ? 'Hindi' : 'English'} Sentence`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
              placeholder={
                sourceLanguage === 'HI'
                  ? 'नमस्ते, पानी और मदद चाहिए।'
                  : 'Hello, thank you for your help...'
              }
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                variant={isListening ? 'danger' : 'outline'}
                size="sm"
                onClick={toggleListening}
                className="flex items-center gap-2"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 animate-pulse" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-navy" />
                    <span>Speak Mic</span>
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!inputText.trim()}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Sign Animation</span>
              </Button>
            </div>
          </Card>

          {apiError && (
            <ErrorState
              title="Sign Generation Request Error"
              message={apiError}
              onRetry={handleGenerate}
            />
          )}

          {/* Lexicon Coverage & Unsupported tokens notice (always shown after generation, even at 0%) */}
          {hasGenerated && (
            <Card className="p-5 flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                <div>
                  <span className="font-semibold text-ink block">Lexicon Coverage</span>
                  <span className="text-[10px] text-ink-subtle font-normal">
                    Rule-lexicon token match only (not linguistic accuracy)
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    coverage > 0 ? 'text-navy' : 'text-coral-dark'
                  }`}
                >
                  {(coverage * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-violet/10 border border-violet/25 text-[11px]">
                <span className="font-semibold text-violet-dark">
                  Status: {verificationStatus} /{' '}
                  {verifiedMappingCount > 0 ? 'PARTIALLY_VALIDATED' : 'UNVERIFIED_EXPERIMENTAL'}
                </span>
                <span className="text-ink-muted">
                  {verifiedMappingCount === 0
                    ? '0% deaf-signer validated'
                    : `${validationRatePct}% deaf-signer validated`}
                </span>
              </div>

              {adapterId && (
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>Adapter: {adapterId}</span>
                  <span>{adapterMode}</span>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-coral/15 border border-coral/40 text-ink text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-coral-dark flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    {warnings.map((w, idx) => (
                      <span key={idx} className="leading-relaxed">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sequence.length === 0 && (
                <UnsupportedFeatureNotice
                  feature={`No Matching ${targetSignLanguage} Core Signs`}
                  rationale={
                    responseNotes ||
                    'None of the input tokens matched documented experimental lexicon entries.'
                  }
                />
              )}

              {mappingProvenance.length > 0 && (
                <div className="p-3 rounded-lg bg-cream/60 border border-ink/10 flex flex-col gap-2 text-[11px]">
                  <span className="font-semibold text-ink">
                    Mapping Provenance ({targetSignLanguage}):
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {mappingProvenance.map((entry) => (
                      <div
                        key={`${entry.sign_language}-${entry.gloss_id}`}
                        className="p-2 rounded bg-white border border-ink/10 flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-ink">
                            {entry.gloss_id} ({entry.sign_language})
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet/15 text-violet-dark">
                            {entry.verification_status}
                          </span>
                        </div>
                        <span className="text-[10px] text-ink-muted">
                          Matched tokens: {entry.source_vocabulary_matched.join(', ')}
                        </span>
                        <span className="text-[10px] text-ink-subtle leading-snug">
                          {entry.provenance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unsupportedTokens.length > 0 && (
                <div className="p-3 rounded-lg bg-ink/5 border border-ink/10 text-ink-muted text-xs">
                  <span className="font-semibold text-ink block mb-1">Unmapped Vocabulary Tokens:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {unsupportedTokens.map((tok, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-white border border-ink/10 text-coral-dark">
                        &quot;{tok}&quot;
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-ink-subtle block mt-2">
                    Unmapped terms are omitted cleanly rather than fabricated.
                  </span>
                </div>
              )}

              {sequence.length > 0 && responseNotes && (
                <p className="text-[11px] text-ink-muted leading-relaxed">{responseNotes}</p>
              )}
            </Card>
          )}

          {/* Language-Specific Sample Phrases Card */}
          <Card className="p-4 bg-cream/50 flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink">
              Sample Phrases ({targetSignLanguage} &bull; {sourceLanguage === 'HI' ? 'Hindi' : 'English'}):
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {activeSamples.map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => {
                    setInputText(sample.text);
                  }}
                  className="px-2 py-0.5 rounded bg-white hover:bg-cream border border-ink/10 text-ink transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
