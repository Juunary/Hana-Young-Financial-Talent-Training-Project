// Shared TypeScript types
// Will include API-generated types and manual type definitions

export type ScoreGrade = "S" | "A+" | "A" | "B+" | "B" | "C+" | "C" | "D";

export type EvaluationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type EvaluationStage =
  | "normalizing"
  | "scoring"
  | "explaining"
  | "saving";

export type UserRole = "user" | "admin" | "reviewer";

export type ReviewStatus =
  | "assigned"
  | "in_review"
  | "reviewed"
  | "needs_more_info"
  | "approved_for_demo"
  | "reassigned";
