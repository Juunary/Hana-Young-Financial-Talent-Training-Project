# Data Model

## ERD 요약

```
users ──┬── (1:1) user_profiles
        ├── (1:N) consent_records
        ├── (1:N) academic_records
        ├── (1:N) project_records
        ├── (1:N) internship_records
        ├── (1:N) certification_records
        ├── (1:N) education_records
        ├── (1:N) portfolio_links
        ├── (1:1) github_profiles
        ├── (1:N) uploaded_files
        └── (1:N) evaluation_requests
                    ├── (1:1) evaluation_input_snapshots
                    ├── (1:1) evaluation_results
                    │            ├── (1:N) evaluation_factor_scores
                    │            └── (1:1) loan_range_estimates
                    ├── (1:1) proof_records
                    ├── (1:N) evaluation_assignments
                    └── (1:N) reviewer_notes
```

## ID 전략

| 테이블 | 내부 PK | 외부 노출 ID |
|--------|---------|-------------|
| users | int (auto) | public_id (UUID v7) |
| evaluation_requests | int (auto) | public_id (UUID v7) |
| proof_records | int (auto) | public_id (UUID v7) |
| 나머지 | int (auto) | 외부 노출 없음 |

- 외부 노출 ID = UUID v7 (시간 정렬 가능, 예측 불가)
- API 응답에 내부 int PK 절대 미포함

## 주요 테이블

### users

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | int PK | auto-increment |
| public_id | varchar(36) unique | UUID v7 |
| email | varchar(255) unique | 인덱스 |
| password_hash | varchar(255) | argon2id |
| role | varchar(20) | user / admin / reviewer |
| is_active | bool | 기본 true |
| is_email_verified | bool | 기본 false |

### evaluation_input_snapshots

요청 시점의 입력 데이터와 채점 레시피를 모두 고정.

| 컬럼 | 타입 | 비고 |
|------|------|------|
| snapshot_payload | JSONB | canonical JSON 직렬화된 전체 증거 |
| payload_hash_sha256 | varchar(64) | SHA-256(canonical JSON) |
| evidence_record_ids | JSONB | 원본 레코드 PK 목록 (감사용) |
| scoring_config_snapshot | JSONB | 요청 시점 채점 설정 전체 |
| scoring_config_version | varchar(20) | e.g. "1.0.0" |
| model_version | varchar(100) | e.g. "anthropic:claude-sonnet-4-6" |
| prompt_version | varchar(20) | 프롬프트 파일 버전 |

### proof_records

오프체인 무결성 증명 기록.

| 컬럼 | 타입 | 비고 |
|------|------|------|
| public_id | varchar(36) unique | UUID v7 |
| canonical_payload_json | JSONB | 증명 대상 데이터 |
| payload_hash_sha256 | varchar(64) unique | 증명 해시 |
| evidence_combined_hash | varchar(64) | input_snapshot.payload_hash_sha256과 동일 |
| verification_status | varchar(20) | issued / revoked |
| superseded_by_id | int FK | 재평가 시 체이닝 |
| blockchain_anchor | JSONB | 향후 체인 앵커링용 (현재 null) |

## Canonical JSON 직렬화 규칙

해시 재현성 보장을 위한 결정론적 직렬화:

1. 키 정렬: `sort_keys=True` (유니코드 코드포인트 순)
2. 인코딩: UTF-8, `ensure_ascii=False`
3. 날짜: ISO 8601 RFC 3339 UTC (`2026-03-20T09:30:00Z`)
4. 숫자: trailing zero 제거 (`4.5` not `4.50`)
5. null 포함: 키 생략 금지
6. 배열 순서: `ORDER BY id ASC` 보장
7. 포맷: compact (`separators=(",", ":")`)

## 마이그레이션 전략

- Alembic 순차 버전 관리 (001 → 004)
- `down_revision` 체인으로 롤백 가능
- app 계정 / migration 계정 분리 (app은 DDL 권한 없음)
- CI에서 migration 자동 적용 (staging) 또는 수동 승인 (production)
