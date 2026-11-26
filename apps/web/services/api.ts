import {
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ResponseEnvelope<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await response.json();
      if (!response.ok) {
        const detailMsg =
          typeof json.detail === 'string'
            ? json.detail
            : Array.isArray(json.detail)
            ? json.detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ')
            : undefined;
        throw new Error(
          json.error?.message || detailMsg || `API Error: ${response.status} ${response.statusText}`
        );
      }
      return json as ResponseEnvelope<T>;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('API Request timed out after 10000ms');
      }
      throw err;
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
    metadata?: Record<string, any>;
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
