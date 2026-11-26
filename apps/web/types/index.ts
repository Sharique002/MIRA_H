export type SignLanguage = 'ISL' | 'ASL';
export type SpokenLanguage = 'EN' | 'HI';

export type SessionStatus = 
  | 'CREATED'
  | 'INITIALIZING'
  | 'ACTIVE'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR'
  | 'STOPPED'
  | 'CANCELLED';

export type PredictionStatus = 
  | 'not_processed'
  | 'processing'
  | 'prediction_available'
  | 'no_sign_detected'
  | 'unsupported_input'
  | 'low_confidence'
  | 'model_unavailable'
  | 'processing_failure';

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmarks {
  handedness: 'Left' | 'Right';
  score: number;
  landmarks: LandmarkPoint[];
}

export interface VisionFramePayload {
  session_id: string;
  timestamp_ms: number;
  frame_sequence: number;
  image_width: number;
  image_height: number;
  hands: HandLandmarks[];
  pose_landmarks?: LandmarkPoint[];
}

export interface CandidateSign {
  gloss: string;
  display_text: string;
  confidence: number;
  uncertainty: number;
}

export interface RecognitionPredictResponse {
  request_id: string;
  session_id: string;
  sign_language: SignLanguage;
  status: PredictionStatus;
  top_prediction?: CandidateSign | null;
  candidates: CandidateSign[];
  model_name: string;
  model_version: string;
  processing_duration_ms: number;
  timestamp: string;
}

export interface TranslationResponse {
  source_glosses: string[];
  target_language: SpokenLanguage;
  translated_text: string;
  confidence: number;
  evidence_grounded: boolean;
  correction_notes?: string | null;
  timestamp: string;
}

export interface JointAngleTarget {
  joint: string;
  pitch: number;
  yaw: number;
  roll: number;
}

export interface SignKeyframe {
  time_offset_ms: number;
  joints: JointAngleTarget[];
  hand_shape: string;
  non_manual_marker?: string;
}

export interface SignSequenceItem {
  sign_id: string;
  temporal_order: number;
  duration_ms: number;
  hand_configuration: string;
  movement_type: string;
  body_position: string;
  non_manual_marker?: string;
  spatial_reference: string;
  keyframes: SignKeyframe[];
}

export interface SignMappingProvenance {
  gloss_id: string;
  sign_language: SignLanguage;
  source_vocabulary_matched: string[];
  provenance: string;
  verification_status: string;
  classification: string;
}

export interface SignGenerateResponse {
  source_text: string;
  source_language?: SpokenLanguage;
  target_sign_language: SignLanguage;
  adapter_id?: string;
  adapter_mode?: string;
  verification_status?: string;
  is_supported?: boolean;
  sequence: SignSequenceItem[];
  total_duration_ms: number;
  vocabulary_coverage: number;
  unsupported_tokens: string[];
  warnings?: string[];
  notes?: string | null;
  mapping_provenance?: SignMappingProvenance[];
}

export type ImplementationType =
  | 'RULE_BASED_HEURISTIC'
  | 'TRAINED_NEURAL_MODEL'
  | 'UNTRAINED_ARCHITECTURE'
  | 'INTERFACE_ONLY';

export type TrainingStatus = 'NOT_TRAINED' | 'TRAINED';
export type CheckpointStatus = 'NOT_AVAILABLE' | 'AVAILABLE' | 'INVALID';

export interface ModelMetadataItem {
  model_id: string;
  legacy_model_ids?: string[];
  model_name: string;
  version: string;
  model_type: string;
  implementation_type: ImplementationType;
  training_status: TrainingStatus;
  checkpoint_status: CheckpointStatus;
  checkpoint_path?: string | null;
  supported_sign_language: SignLanguage;
  status: 'loaded' | 'rule_based_ready' | 'standby' | 'not_installed' | 'not_trained' | 'not_available' | 'error';
  device: string;
  dataset_provenance: string;
  license: string;
  parameters_count?: number | null;
  parameter_count_status?: string;
  evaluation: {
    top1_accuracy?: number | null;
    top5_accuracy?: number | null;
    macro_f1?: number | null;
    evaluated_samples?: number | null;
    evaluation_date?: string | null;
    signer_disjoint_verified: boolean;
    per_class_metrics_available: boolean;
  };
  known_limitations: string[];
}

export interface SystemStatusData {
  cpu: {
    usage_percent: number;
    logical_cores: number;
  };
  memory: {
    total_gb: number;
    available_gb: number;
    used_percent: number;
  };
  models: {
    total_registered: number;
    models_loaded: number;
    rule_based_active?: number;
    device: string;
  };
  environment: string;
}

export interface SessionData {
  session_id: string;
  status: SessionStatus;
  sign_language: SignLanguage;
  spoken_language: SpokenLanguage;
  mode: string;
  created_at: string;
  updated_at: string;
  active_connections: number;
  frame_count: number;
  metadata: Record<string, any>;
}

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  correlation_id: string;
  timestamp: string;
}
