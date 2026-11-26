import type {
  ResponseEnvelope,
  SessionData,
  RecognitionPredictResponse,
  TranslationResponse,
  SignGenerateResponse,
  ModelMetadataItem,
  SystemStatusData,
  VisionFramePayload,
  SignLanguage,
  SpokenLanguage
} from '../types';
import {
  extractApiErrorMessage,
  formatHttpStatusTag,
  isAbortError,
  sanitizeNetworkErrorMessage,
  validateResponseEnvelope,
} from './apiError';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function readResponseTextWithAbort(
  response: Response,
  signal: AbortSignal,
  httpTag: string
): Promise<string> {
  if (signal.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }

  return await new Promise<string>((resolveText, rejectText) => {
    const onAbort = () => {
      rejectText(new DOMException('The operation was aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    response.text().then(
      (text) => {
        signal.removeEventListener('abort', onAbort);
        resolveText(text);
      },
      (err: unknown) => {
        signal.removeEventListener('abort', onAbort);
        if (signal.aborted || isAbortError(err)) {
          rejectText(new DOMException('The operation was aborted', 'AbortError'));
          return;
        }
        rejectText(new ApiClientError(`Failed to read API response body (${httpTag}).`));
      }
    );
  });
}

export class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options?: { baseUrl?: string; timeoutMs?: number }) {
    this.baseUrl = (options?.baseUrl ?? API_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options?.timeoutMs ?? 10000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ResponseEnvelope<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      const httpTag = formatHttpStatusTag(response.status, response.statusText);
      const rawText = await readResponseTextWithAbort(response, controller.signal, httpTag);

      let json: unknown = null;
      if (rawText.trim().length > 0) {
        try {
          json = JSON.parse(rawText);
        } catch {
          if (!response.ok) {
            throw new ApiClientError(`API Error (${httpTag}).`);
          }
          throw new ApiClientError(`Received malformed JSON response from backend API (${httpTag}).`);
        }
      }

      if (!response.ok) {
        throw new ApiClientError(extractApiErrorMessage(json, response.status, response.statusText));
      }

      const validated = validateResponseEnvelope(json, response.status, response.statusText);
      if (!validated.valid) {
        throw new ApiClientError(validated.errorMessage);
      }

      return json as ResponseEnvelope<T>;
    } catch (err: unknown) {
      if (isAbortError(err)) {
        throw new Error(`API Request timed out after ${this.timeoutMs}ms`);
      }
      if (err instanceof ApiClientError) {
        throw err;
      }
      throw new Error(sanitizeNetworkErrorMessage(err));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Health & System
  async getHealth(): Promise<{ status: string; service: string; version: string }> {
    const res = await this.request<{ status: string; service: string; version: string }>('/api/v1/health');
    return res.data;
  }

  async getSystemStatus(): Promise<SystemStatusData> {
    const res = await this.request<SystemStatusData>('/api/v1/system/status');
    return res.data;
  }

  // Sessions
  async createSession(params: {
    sign_language: SignLanguage;
    spoken_language: SpokenLanguage;
    mode: string;
    metadata?: Record<string, unknown>;
  }): Promise<SessionData> {
    const res = await this.request<SessionData>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.data;
  }

  async getSession(sessionId: string): Promise<SessionData> {
    const res = await this.request<SessionData>(`/api/v1/sessions/${sessionId}`);
    return res.data;
  }

  async terminateSession(sessionId: string): Promise<SessionData> {
    const res = await this.request<SessionData>(`/api/v1/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  // Vision
  async ingestLandmarks(payload: VisionFramePayload) {
    const res = await this.request('/api/v1/vision/landmarks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  // Recognition
  async predictSign(params: {
    session_id: string;
    sign_language: SignLanguage;
    frames: VisionFramePayload[];
    min_confidence_threshold?: number;
  }): Promise<RecognitionPredictResponse> {
    const res = await this.request<RecognitionPredictResponse>('/api/v1/recognition/predict', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.data;
  }

  // Translation
  async translateGloss(params: {
    source_sign_language: SignLanguage;
    target_spoken_language: SpokenLanguage;
    gloss_sequence: string[];
    semantic_intent?: string;
    confidence: number;
  }): Promise<TranslationResponse> {
    const res = await this.request<TranslationResponse>('/api/v1/translation/translate', {
      method: 'POST',
      body: JSON.stringify({
        semantic_representation: {
          source_sign_language: params.source_sign_language,
          target_spoken_language: params.target_spoken_language,
          gloss_sequence: params.gloss_sequence,
          semantic_intent: params.semantic_intent,
          confidence: params.confidence,
        },
      }),
    });
    return res.data;
  }

  // Reverse Sign Generation
  async generateSignSequence(params: {
    text: string;
    source_language: SpokenLanguage;
    target_sign_language: SignLanguage;
    adapter_id?: string;
  }): Promise<SignGenerateResponse> {
    const bodyPayload: Record<string, string> = {
      text: params.text,
      source_language: params.source_language,
      target_sign_language: params.target_sign_language,
    };
    if (params.adapter_id !== undefined) {
      bodyPayload.adapter_id = params.adapter_id;
    }
    const res = await this.request<SignGenerateResponse>('/api/v1/sign/generate', {
      method: 'POST',
      body: JSON.stringify(bodyPayload),
    });
    return res.data;
  }

  // Models Registry
  async getModels(): Promise<{ models: ModelMetadataItem[]; total_models_registered: number }> {
    const res = await this.request<{ models: ModelMetadataItem[]; total_models_registered: number }>('/api/v1/models');
    return res.data;
  }
}

export const apiClient = new ApiClient();
