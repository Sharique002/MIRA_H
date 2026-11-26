import type { SpokenLanguage } from '../types';

export interface BrowserSpeechRecognitionEvent {
  results?: ArrayLike<ArrayLike<{ transcript?: string } | undefined> | undefined>;
}

export interface BrowserSpeechRecognitionErrorEvent {
  error?: string;
  message?: string;
}

export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop?: () => void;
  abort?: () => void;
}

export type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export interface SpeechRecognitionWindowLike {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

/** Map MIRA-H spoken source language to BCP-47 speech recognition locale. */
export function resolveSpeechRecognitionLocale(language: SpokenLanguage): 'en-US' | 'hi-IN' {
  return language === 'HI' ? 'hi-IN' : 'en-US';
}

/** Resolve browser SpeechRecognition or webkitSpeechRecognition constructor safely. */
export function getSpeechRecognitionConstructor(
  win: SpeechRecognitionWindowLike | undefined
): SpeechRecognitionConstructor | null {
  if (!win) return null;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

/** Translate Web Speech API error codes and DOMExceptions without exposing internal details. */
export function formatSpeechRecognitionError(
  eventOrError: BrowserSpeechRecognitionErrorEvent | unknown
): string {
  const code =
    typeof eventOrError === 'object' &&
    eventOrError !== null &&
    'error' in eventOrError &&
    typeof (eventOrError as { error?: unknown }).error === 'string'
      ? (eventOrError as { error: string }).error
      : '';

  const errName =
    eventOrError instanceof Error
      ? eventOrError.name
      : typeof eventOrError === 'object' &&
        eventOrError !== null &&
        'name' in eventOrError &&
        typeof (eventOrError as { name?: unknown }).name === 'string'
      ? (eventOrError as { name: string }).name
      : '';

  if (code === 'not-allowed' || code === 'service-not-allowed' || errName === 'NotAllowedError') {
    return 'Microphone permission was denied. Allow microphone access or type your phrase manually.';
  }
  if (errName === 'SecurityError') {
    return 'Microphone dictation requires a secure browser context (HTTPS or localhost).';
  }
  if (code === 'audio-capture' || errName === 'NotFoundError') {
    return 'No working microphone was detected for voice input.';
  }
  if (code === 'no-speech') {
    return 'No speech was detected. Try speaking clearly into the microphone or type your phrase.';
  }
  if (code === 'network') {
    return 'Browser speech recognition service is unavailable offline. Type your phrase instead.';
  }
  if (code === 'aborted' || errName === 'AbortError') {
    return 'Speech recognition was stopped before capturing input.';
  }
  if (errName === 'InvalidStateError') {
    return 'Speech recognition session is already running. Wait a moment and try again.';
  }

  return 'Speech recognition could not complete. Check microphone permissions or type your phrase manually.';
}
