export type EvaluationStatus = "pending" | "processing" | "completed" | "failed";
export type EvaluationStage = "normalizing" | "scoring" | "explaining" | "saving";

// POST /api/v1/evaluations response
export interface EvaluationRequest {
  id: string; // public_id
  status: EvaluationStatus;
  requested_at: string;
}

// GET /api/v1/evaluations/{id} and /api/v1/evaluations/{id}/status
export interface EvaluationStatusResponse {
  id: string;
  status: EvaluationStatus;
  current_stage: EvaluationStage | null;
  stage_progress: {
    stages: string[];
    current_index: number;
    total: number;
  } | null;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface FactorScoreResponse {
  factor_name: string;
  score_value: number;
  max_score: number;
  reason_codes: string[];
  explanation: string;
  confidence: number;
}

export interface LoanRangeEstimateResponse {
  range_min: number;
  range_max: number;
  rationale: string;
  disclaimer_text: string;
}

export interface ProofRecordSummary {
  id: string; // public_id
  proof_version: string;
  payload_hash_sha256: string;
  issuer: string;
  verification_status: "issued" | "revoked";
  created_at: string;
}

// GET /api/v1/evaluations/{id}/result
export interface EvaluationResultResponse {
  id: string;
  status: EvaluationStatus;
  total_score: number;
  grade: string;
  confidence_level: number;
  overall_summary: string;
  strengths: string[];
  improvement_areas: string[];
  risk_flags: string[];
  needs_human_review: boolean;
  factor_scores: FactorScoreResponse[];
  loan_estimate: LoanRangeEstimateResponse | null;
  proof_record: ProofRecordSummary | null;
  model_version: string;
  scoring_config_version: string;
  processing_time_ms: number;
  completed_at: string | null;
}

// GET /api/v1/evaluations/history — flat array
export interface EvaluationHistoryItem {
  id: string;
  status: EvaluationStatus;
  total_score: number | null;
  grade: string | null;
  requested_at: string;
  completed_at: string | null;
}

// GET /api/v1/proof-records/{id}
export interface ProofRecordResponse {
  id: string; // public_id
  evaluation_result_id: number;
  proof_version: string;
  payload_hash_sha256: string;
  evidence_combined_hash: string;
  issuer: string;
  verification_status: "issued" | "revoked";
  created_at: string;
}

// POST /api/v1/proof-records/{id}/verify
export interface ProofVerifyResponse {
  valid: boolean;
  proof_id: string;
  computed_hash: string;
  stored_hash: string;
  details: string;
}
