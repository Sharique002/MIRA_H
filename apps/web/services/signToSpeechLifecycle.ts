import type {
  CandidateSign,
  PredictionStatus,
  RecognitionPredictResponse,
  SessionData,
  SignLanguage,
  SpokenLanguage,
  TranslationResponse,
  VisionFramePayload,
} from '../types';
import { getErrorMessage } from './apiError';

export type SessionMode = 'idle' | 'starting' | 'remote' | 'local';

export interface SignToSpeechLifecycleState {
  sessionId: string;
  sessionMode: SessionMode;
  sessionNotice: string | null;
  predictionStatus: PredictionStatus;
  topPrediction: CandidateSign | null;
  candidates: CandidateSign[];
  modelName: string;
  latencyMs: number;
  translation: TranslationResponse | null;
  translationNotice: string | null;
  isProcessingRequest: boolean;
  frameBufferCount: number;
}

export interface SignToSpeechApiDeps {
  createSession: (params: {
    sign_language: SignLanguage;
    spoken_language: SpokenLanguage;
    mode: string;
  }) => Promise<Pick<SessionData, 'session_id'>>;
  terminateSession: (sessionId: string) => Promise<unknown>;
  predictSign: (params: {
    session_id: string;
    sign_language: SignLanguage;
    frames: VisionFramePayload[];
    min_confidence_threshold?: number;
  }) => Promise<RecognitionPredictResponse>;
  translateGloss: (params: {
    source_sign_language: SignLanguage;
    target_spoken_language: SpokenLanguage;
    gloss_sequence: string[];
    confidence: number;
  }) => Promise<TranslationResponse>;
}

export interface SignToSpeechLifecycleDeps {
  api: SignToSpeechApiDeps;
  onSnapshot: (state: SignToSpeechLifecycleState) => void;
  now?: () => number;
  initialSignLanguage?: SignLanguage;
}

export function isLocalSessionId(sessionId: string): boolean {
  return sessionId.startsWith('local-');
}

export function getDefaultModelIdForLanguage(signLanguage: SignLanguage): string {
  return signLanguage === 'ASL'
    ? 'asl-geometric-heuristic-v1'
    : 'isl-geometric-heuristic-v1';
}

function createInitialState(signLanguage: SignLanguage): SignToSpeechLifecycleState {
  return {
    sessionId: '',
    sessionMode: 'idle',
    sessionNotice: null,
    predictionStatus: 'not_processed',
    topPrediction: null,
    candidates: [],
    modelName: getDefaultModelIdForLanguage(signLanguage),
    latencyMs: 0,
    translation: null,
    translationNotice: null,
    isProcessingRequest: false,
    frameBufferCount: 0,
  };
}

/**
 * Owns asynchronous session, inference, and translation lifecycle guards for Sign-to-Speech
 * so camera stop, session termination, overlapping requests, and unmount never mutate stale state.
 */
export function createSignToSpeechLifecycle(deps: SignToSpeechLifecycleDeps) {
  const nowFn = deps.now ?? (() => Date.now());
  let state: SignToSpeechLifecycleState = createInitialState(
    deps.initialSignLanguage ?? 'ISL'
  );
  let mounted = true;
  let streamingActive = false;
  let cycleId = 0;
  let requestSeq = 0;
  let frameBuffer: VisionFramePayload[] = [];
  let lastInferenceTimeMs = 0;

  const emit = () => {
    if (!mounted) return;
    deps.onSnapshot({
      ...state,
      candidates: [...state.candidates],
    });
  };

  const isActiveCycleRequest = (expectedCycle: number, expectedRequest?: number): boolean => {
    if (!mounted || !streamingActive || expectedCycle !== cycleId) {
      return false;
    }
    if (expectedRequest !== undefined && expectedRequest !== requestSeq) {
      return false;
    }
    return true;
  };

  const startSession = async (params: {
    signLanguage: SignLanguage;
    spokenLanguage: SpokenLanguage;
  }): Promise<void> => {
    if (!mounted) return;

    streamingActive = true;
    const activeCycle = ++cycleId;
    requestSeq += 1;
    frameBuffer = [];
    lastInferenceTimeMs = 0;

    state = {
      ...createInitialState(params.signLanguage),
      sessionMode: 'starting',
    };
    emit();

    try {
      const res = await deps.api.createSession({
        sign_language: params.signLanguage,
        spoken_language: params.spokenLanguage,
        mode: 'sign-to-speech',
      });
      if (!isActiveCycleRequest(activeCycle)) {
        return;
      }
      state = {
        ...state,
        sessionId: res.session_id,
        sessionMode: 'remote',
        sessionNotice: null,
      };
      emit();
    } catch {
      if (!isActiveCycleRequest(activeCycle)) {
        return;
      }
      state = {
        ...state,
        sessionId: `local-${nowFn()}`,
        sessionMode: 'local',
        sessionNotice:
          'Backend session tracking unavailable; running local preview session.',
      };
      emit();
    }
  };

  const stopSession = (): void => {
    const previousSessionId = state.sessionId;
    streamingActive = false;
    const stopCycle = ++cycleId;
    requestSeq += 1;
    frameBuffer = [];
    lastInferenceTimeMs = 0;

    state = {
      ...state,
      sessionId: '',
      sessionMode: 'idle',
      sessionNotice: null,
      predictionStatus: 'not_processed',
      topPrediction: null,
      candidates: [],
      latencyMs: 0,
      translation: null,
      translationNotice: null,
      isProcessingRequest: false,
      frameBufferCount: 0,
    };
    emit();

    if (previousSessionId && !isLocalSessionId(previousSessionId)) {
      deps.api.terminateSession(previousSessionId).catch((err: unknown) => {
        if (!mounted || streamingActive || stopCycle !== cycleId) {
          return;
        }
        state = {
          ...state,
          sessionNotice: getErrorMessage(
            err,
            'Remote sign session cleanup failed after stopping the camera.'
          ),
        };
        emit();
      });
    }
  };

  const enqueueAndMaybePredict = async (
    payload: VisionFramePayload,
    params: {
      signLanguage: SignLanguage;
      spokenLanguage: SpokenLanguage;
      nowMs: number;
    }
  ): Promise<void> => {
    if (!mounted || !streamingActive) {
      return;
    }

    frameBuffer.push(payload);
    if (frameBuffer.length > 20) {
      frameBuffer.shift();
    }
    state = {
      ...state,
      frameBufferCount: frameBuffer.length,
    };

    if (params.nowMs - lastInferenceTimeMs < 500 || frameBuffer.length < 5) {
      emit();
      return;
    }

    lastInferenceTimeMs = params.nowMs;
    const activeCycle = cycleId;
    const activeReq = ++requestSeq;
    const bufferCopy = [...frameBuffer];
    const effectiveSessionId = state.sessionId || 'local-session';

    state = {
      ...state,
      isProcessingRequest: true,
    };
    emit();

    try {
      const pred = await deps.api.predictSign({
        session_id: effectiveSessionId,
        sign_language: params.signLanguage,
        frames: bufferCopy,
        min_confidence_threshold: 0.60,
      });
      if (!isActiveCycleRequest(activeCycle, activeReq)) {
        return;
      }

      state = {
        ...state,
        predictionStatus: pred.status,
        topPrediction: pred.top_prediction || null,
        candidates: pred.candidates || [],
        modelName: pred.model_name,
        latencyMs: pred.processing_duration_ms,
      };
      emit();

      if (pred.top_prediction && pred.status === 'prediction_available') {
        try {
          const trans = await deps.api.translateGloss({
            source_sign_language: params.signLanguage,
            target_spoken_language: params.spokenLanguage,
            gloss_sequence: [pred.top_prediction.gloss],
            confidence: pred.top_prediction.confidence,
          });
          if (!isActiveCycleRequest(activeCycle, activeReq)) {
            return;
          }
          // Preserve sessionNotice so local-preview disclosure remains visible across translations.
          state = {
            ...state,
            translation: trans,
            translationNotice: null,
          };
          emit();
        } catch (err: unknown) {
          if (!isActiveCycleRequest(activeCycle, activeReq)) {
            return;
          }
          state = {
            ...state,
            translation: null,
            translationNotice: getErrorMessage(
              err,
              'Unable to translate recognized sign gloss cleanly.'
            ),
          };
          emit();
        }
      }
    } catch (err: unknown) {
      if (!isActiveCycleRequest(activeCycle, activeReq)) {
        return;
      }
      state = {
        ...state,
        predictionStatus: 'processing_failure',
        topPrediction: null,
        candidates: [],
        translation: null,
        translationNotice: getErrorMessage(
          err,
          'Sign recognition request failed while processing frames.'
        ),
      };
      emit();
    } finally {
      if (isActiveCycleRequest(activeCycle, activeReq) && state.isProcessingRequest) {
        state = {
          ...state,
          isProcessingRequest: false,
        };
        emit();
      }
    }
  };

  const resetOnLanguageChange = (params: {
    signLanguage: SignLanguage;
    resetPrediction?: boolean;
    resetTranslation?: boolean;
  }): void => {
    if (!mounted) return;
    state = {
      ...state,
      modelName: getDefaultModelIdForLanguage(params.signLanguage),
      topPrediction: params.resetPrediction ? null : state.topPrediction,
      candidates: params.resetPrediction ? [] : state.candidates,
      translation: params.resetTranslation ? null : state.translation,
      translationNotice: null,
    };
    emit();
  };

  const clearResults = (): void => {
    if (!mounted) return;
    state = {
      ...state,
      topPrediction: null,
      candidates: [],
      translation: null,
      translationNotice: null,
    };
    emit();
  };

  const mount = (): void => {
    mounted = true;
  };

  const unmount = (): void => {
    mounted = false;
    streamingActive = false;
    cycleId += 1;
    requestSeq += 1;
    frameBuffer = [];
  };

  return {
    mount,
    startSession,
    stopSession,
    enqueueAndMaybePredict,
    resetOnLanguageChange,
    clearResults,
    unmount,
    getSnapshot: (): SignToSpeechLifecycleState => ({
      ...state,
      candidates: [...state.candidates],
    }),
  };
}
