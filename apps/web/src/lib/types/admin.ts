// Admin API response types — mirrors apps/api/app/schemas/admin.py

export interface AdminDashboardStats {
  total_evaluations: number;
  pending_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
  needs_review_count: number;
  total_users: number;
}

export interface AdminEvaluationListItem {
  id: string; // public_id
  user_id: number;
  user_email: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  total_score: number | null;
  grade: string | null;
  needs_human_review: boolean;
  requested_at: string;
  completed_at: string | null;
}

export interface AdminEvaluationListResponse {
  items: AdminEvaluationListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AdminFactorScore {
  factor_name: string;
  score_value: number;
  max_score: number;
  reason_codes: string[];
  explanation: string;
  confidence: number;
}

export interface AdminLoanEstimate {
  range_min: number;
  range_max: number;
  rationale: string;
  disclaimer_text: string;
}

export interface AdminReviewerNote {
  id: number;
  reviewer_id: number;
  reviewer_email: string | null;
  status_change: string | null;
  comment: string;
  created_at: string;
}

export interface AdminEvaluationDetail {
  id: string; // public_id
  user_id: number;
  user_email: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  current_stage: string | null;
  requested_at: string;
  completed_at: string | null;
  error_message: string | null;
  input_snapshot_hash: string | null;
  total_score: number | null;
  grade: string | null;
  confidence_level: number | null;
  overall_summary: string | null;
  strengths: string[];
  improvement_areas: string[];
  risk_flags: string[];
  needs_human_review: boolean;
  factor_scores: AdminFactorScore[];
  loan_estimate: AdminLoanEstimate | null;
  snapshot_evidence: Record<string, unknown> | null;
  snapshot_scoring_config_version: string | null;
  snapshot_model_version: string | null;
  raw_ai_response: Record<string, unknown> | null;
  reviewer_notes: AdminReviewerNote[];
}

export interface ReviewSubmitRequest {
  comment: string;
  status_change?: string;
}

export interface ReviewSubmitResponse {
  id: number;
  evaluation_request_id: string;
  reviewer_id: number;
  status_change: string | null;
  comment: string;
  created_at: string;
}

export interface AssignRequest {
  reviewer_id: number;
}

export interface AssignResponse {
  id: number;
  evaluation_request_id: string;
  reviewer_id: number;
  assigned_by_id: number;
  review_status: string;
  assigned_at: string;
}

export interface AuditLogItem {
  id: number;
  actor_type: string;
  actor_id: number | null;
  event_name: string;
  event_payload_json: Record<string, unknown> | null;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
