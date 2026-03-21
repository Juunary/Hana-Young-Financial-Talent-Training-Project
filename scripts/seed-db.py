"""
seed-db.py — 데모용 시드 데이터 생성 스크립트

실행:
    cd apps/api
    uv run python ../../scripts/seed-db.py

생성되는 계정:
    - 관리자:  admin@example.com   / Admin1234!
    - 심사자:  reviewer@example.com / Reviewer1234!
    - 사용자1: alice@example.com   / User1234!  (완성된 프로파일, 평가 1건)
    - 사용자2: bob@example.com     / User1234!  (부분 프로파일)
"""

import asyncio
import hashlib
import json
import sys
import uuid
from datetime import date, datetime, timezone

# Python 경로 설정 (apps/api 에서 실행 기준)
sys.path.insert(0, ".")

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import settings
from app.models.base import Base
from app.models.user import User, UserProfile, ConsentRecord
from app.models.evidence import (
    AcademicRecord,
    ProjectRecord,
    InternshipRecord,
    CertificationRecord,
    EducationRecord,
    PortfolioLink,
    GitHubProfile,
    GitHubRepoSnapshot,
)
from app.models.evaluation import (
    EvaluationRequest,
    EvaluationInputSnapshot,
    EvaluationResult,
    EvaluationFactorScore,
    LoanRangeEstimate,
    ProofRecord,
    EvaluationAssignment,
)
from app.utils.hashing import hash_password


def uuid7_str() -> str:
    """UUID v7 근사 생성 (시간 정렬 가능)."""
    return str(uuid.uuid4())  # 프로토타입용 UUID v4 대용


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def canonical_json(obj: dict) -> str:
    """Canonical JSON 직렬화 (sort_keys, compact, UTC 날짜)."""
    def default(o):
        if isinstance(o, (datetime, date)):
            return o.isoformat() + "Z" if isinstance(o, datetime) else o.isoformat()
        raise TypeError(f"직렬화 불가 타입: {type(o)}")

    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"), default=default)


def sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


# ──────────────────────────────────────────────
# 시드 데이터 생성
# ──────────────────────────────────────────────

async def seed(db: AsyncSession) -> None:
    print("🌱 기존 데이터 확인 중...")

    # 이미 시드된 경우 스킵
    result = await db.execute(text("SELECT COUNT(*) FROM users"))
    count = result.scalar()
    if count and count > 0:
        print(f"  ⚠️  이미 {count}명의 사용자가 존재합니다. 시드를 건너뜁니다.")
        print("  데이터를 초기화하려면 DB를 직접 정리하거나 'docker compose down -v' 후 재실행하세요.")
        return

    now = utcnow()

    # ── 1. 관리자 계정 ──
    print("👤 관리자 계정 생성 중...")
    admin = User(
        public_id=uuid7_str(),
        email="admin@example.com",
        password_hash=hash_password("Admin1234!"),
        role="admin",
        is_active=True,
        is_email_verified=True,
    )
    db.add(admin)
    await db.flush()

    db.add(UserProfile(
        user_id=admin.id,
        name="관리자",
        employment_status="employed",
    ))

    # ── 2. 심사자 계정 ──
    print("👤 심사자 계정 생성 중...")
    reviewer = User(
        public_id=uuid7_str(),
        email="reviewer@example.com",
        password_hash=hash_password("Reviewer1234!"),
        role="reviewer",
        is_active=True,
        is_email_verified=True,
    )
    db.add(reviewer)
    await db.flush()

    db.add(UserProfile(
        user_id=reviewer.id,
        name="심사자1",
        employment_status="employed",
    ))

    # ── 3. 데모 사용자 Alice (완성된 프로파일) ──
    print("👤 사용자 Alice 생성 중...")
    alice = User(
        public_id=uuid7_str(),
        email="alice@example.com",
        password_hash=hash_password("User1234!"),
        role="user",
        is_active=True,
        is_email_verified=True,
    )
    db.add(alice)
    await db.flush()

    db.add(UserProfile(
        user_id=alice.id,
        name="이지은",
        birth_year=2001,
        university="연세대학교",
        major="컴퓨터공학",
        graduation_status="enrolled",
        employment_status="student",
    ))

    # 동의 기록
    for consent_type in ["privacy", "evaluation", "data_usage"]:
        db.add(ConsentRecord(
            user_id=alice.id,
            consent_type=consent_type,
            consent_version="1.0",
            accepted=True,
            accepted_at=now,
            ip_address="127.0.0.1",
            user_agent="seed-script/1.0",
        ))

    # 학업 기록
    db.add(AcademicRecord(
        user_id=alice.id,
        university="연세대학교",
        major="컴퓨터공학",
        degree_type="bachelor",
        gpa=4.1,
        gpa_scale=4.5,
        gpa_normalized=round(4.1 / 4.5, 4),
        admission_year=2020,
        graduation_year=None,
        is_draft=False,
    ))

    # 프로젝트 기록
    project1 = ProjectRecord(
        user_id=alice.id,
        title="실시간 주가 분석 대시보드",
        role="풀스택 개발",
        duration_months=4,
        start_date=date(2025, 9, 1),
        end_date=date(2025, 12, 31),
        description=(
            "Python FastAPI와 Next.js를 활용한 실시간 주가 분석 및 시각화 시스템. "
            "WebSocket 기반 실시간 데이터 피드와 기술적 지표 자동 계산 기능을 구현."
        ),
        tech_stack=["Python", "FastAPI", "Next.js", "PostgreSQL", "Redis", "WebSocket"],
        outcome_summary="일간 활성 사용자 200명, API 응답 시간 평균 150ms 달성",
        project_url="https://github.com/alice-dev/stock-dashboard",
        is_draft=False,
    )
    db.add(project1)

    project2 = ProjectRecord(
        user_id=alice.id,
        title="AI 기반 학점 예측 시스템",
        role="ML 엔지니어 / 백엔드 개발",
        duration_months=3,
        start_date=date(2025, 3, 1),
        end_date=date(2025, 5, 31),
        description=(
            "학생의 수강 이력과 행동 패턴을 기반으로 학점을 예측하는 ML 모델 개발. "
            "랜덤 포레스트와 그라디언트 부스팅 앙상블 기법을 적용."
        ),
        tech_stack=["Python", "scikit-learn", "pandas", "FastAPI", "Docker"],
        outcome_summary="예측 정확도 87%, 캡스톤 디자인 최우수상 수상",
        project_url="https://github.com/alice-dev/gpa-predictor",
        is_draft=False,
    )
    db.add(project2)

    # 인턴십
    db.add(InternshipRecord(
        user_id=alice.id,
        company="카카오뱅크",
        position="백엔드 인턴",
        department="플랫폼 개발팀",
        duration_months=3,
        start_date=date(2025, 6, 1),
        end_date=date(2025, 8, 31),
        description=(
            "핀테크 플랫폼의 결제 API 성능 개선 업무를 담당. "
            "Redis 캐싱 도입으로 API 응답 시간 40% 단축."
        ),
        is_draft=False,
    ))

    # 자격증
    db.add(CertificationRecord(
        user_id=alice.id,
        name="정보처리기사",
        issuer="한국산업인력공단",
        issue_date=date(2024, 11, 15),
        expiry_date=None,
        credential_id="2024-정처기-12345",
        is_draft=False,
    ))
    db.add(CertificationRecord(
        user_id=alice.id,
        name="AWS Solutions Architect Associate",
        issuer="Amazon Web Services",
        issue_date=date(2025, 2, 20),
        expiry_date=date(2028, 2, 20),
        credential_id="AWS-SAA-2025-XXXX",
        is_draft=False,
    ))

    # 교육 이수
    db.add(EducationRecord(
        user_id=alice.id,
        institution="패스트캠퍼스",
        course_name="한 번에 끝내는 파이썬 웹 개발: Django & FastAPI",
        category="online",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 3, 31),
        is_draft=False,
    ))

    # 포트폴리오 링크
    db.add(PortfolioLink(
        user_id=alice.id,
        title="개인 기술 블로그",
        url="https://velog.io/@alice-dev",
        description="개발 경험과 기술 학습 기록을 공유하는 블로그",
        link_type="blog",
        is_draft=False,
    ))
    db.add(PortfolioLink(
        user_id=alice.id,
        title="GitHub 포트폴리오",
        url="https://github.com/alice-dev",
        description="주요 프로젝트 소스 코드",
        link_type="website",
        is_draft=False,
    ))

    # GitHub 프로파일
    github = GitHubProfile(
        user_id=alice.id,
        username="alice-dev",
        profile_url="https://github.com/alice-dev",
        bio="컴퓨터공학 전공 | Backend & ML Engineer",
        public_repos=23,
        followers=87,
        following=34,
        total_contributions_last_year=1247,
        longest_streak_days=42,
        snapshot_at=now,
    )
    db.add(github)
    await db.flush()

    db.add(GitHubRepoSnapshot(
        github_profile_id=github.id,
        repo_name="stock-dashboard",
        repo_url="https://github.com/alice-dev/stock-dashboard",
        stars=87,
        forks=12,
        primary_language="Python",
        commit_count_snapshot=245,
        last_activity_at=datetime(2026, 1, 15, 10, 30, 0),
    ))
    db.add(GitHubRepoSnapshot(
        github_profile_id=github.id,
        repo_name="gpa-predictor",
        repo_url="https://github.com/alice-dev/gpa-predictor",
        stars=34,
        forks=5,
        primary_language="Python",
        commit_count_snapshot=189,
        last_activity_at=datetime(2025, 6, 1, 9, 0, 0),
    ))

    await db.flush()

    # ── 4. 평가 요청 및 결과 (Alice) ──
    print("📊 평가 데이터 생성 중...")

    scoring_config_snapshot = {
        "version": "1.0.0",
        "factors": {
            "academic": {"display_name": "학업 역량", "max_score": 15},
            "project": {"display_name": "프로젝트 깊이", "max_score": 25},
            "internship": {"display_name": "실무 경험", "max_score": 20},
            "certification": {"display_name": "자격/인증", "max_score": 10},
            "portfolio": {"display_name": "포트폴리오", "max_score": 15},
            "github": {"display_name": "GitHub 활동", "max_score": 10},
            "consistency": {"display_name": "일관성/완성도", "max_score": 5},
        },
    }

    snapshot_payload = {
        "academic": {
            "university": "연세대학교",
            "major": "컴퓨터공학",
            "gpa": 4.1,
            "gpa_scale": 4.5,
            "gpa_normalized": 0.9111,
        },
        "certifications": [
            {"name": "정보처리기사", "issuer": "한국산업인력공단"},
            {"name": "AWS Solutions Architect Associate", "issuer": "Amazon Web Services"},
        ],
        "education": [{"institution": "패스트캠퍼스", "course_name": "파이썬 웹 개발"}],
        "github": {
            "username": "alice-dev",
            "public_repos": 23,
            "followers": 87,
            "total_contributions_last_year": 1247,
            "longest_streak_days": 42,
        },
        "internships": [
            {"company": "카카오뱅크", "position": "백엔드 인턴", "duration_months": 3}
        ],
        "portfolio": [
            {"title": "개인 기술 블로그", "url": "https://velog.io/@alice-dev"},
            {"title": "GitHub 포트폴리오", "url": "https://github.com/alice-dev"},
        ],
        "projects": [
            {
                "title": "실시간 주가 분석 대시보드",
                "duration_months": 4,
                "tech_stack": ["Python", "FastAPI", "Next.js", "PostgreSQL", "Redis"],
                "outcome_summary": "일간 활성 사용자 200명, API 응답 시간 150ms",
            },
            {
                "title": "AI 기반 학점 예측 시스템",
                "duration_months": 3,
                "tech_stack": ["Python", "scikit-learn", "pandas", "FastAPI"],
                "outcome_summary": "예측 정확도 87%, 캡스톤 최우수상",
            },
        ],
        "uploaded_files": [],
    }

    payload_json = canonical_json(snapshot_payload)
    payload_hash = sha256(payload_json)

    eval_request = EvaluationRequest(
        public_id=uuid7_str(),
        user_id=alice.id,
        status="completed",
        requested_at=datetime(2026, 3, 20, 9, 30, 0),
        started_at=datetime(2026, 3, 20, 9, 30, 5),
        completed_at=datetime(2026, 3, 20, 9, 30, 47),
        celery_task_id="demo-task-001",
        input_snapshot_hash=payload_hash,
    )
    db.add(eval_request)
    await db.flush()

    snapshot = EvaluationInputSnapshot(
        evaluation_request_id=eval_request.id,
        snapshot_payload=snapshot_payload,
        payload_hash_sha256=payload_hash,
        evidence_record_ids={
            "academic": [1],
            "projects": [1, 2],
            "internships": [1],
            "certifications": [1, 2],
            "education": [1],
            "portfolio": [1, 2],
            "github": [1],
            "uploads": [],
        },
        scoring_config_snapshot=scoring_config_snapshot,
        scoring_config_version="1.0.0",
        model_version="anthropic:claude-sonnet-4-6",
        prompt_version="1.0.0",
    )
    db.add(snapshot)
    await db.flush()

    eval_result = EvaluationResult(
        evaluation_request_id=eval_request.id,
        total_score=81.5,
        grade="A",
        confidence_level=0.89,
        overall_summary=(
            "이지은 학생은 컴퓨터공학 전공의 탄탄한 학업 기반 위에 "
            "실질적인 프로젝트 경험과 인턴십을 보유한 우수한 역량 프로파일을 보여줍니다. "
            "특히 AI/ML 분야의 깊이 있는 프로젝트 경험과 카카오뱅크 인턴십의 핀테크 관련성이 "
            "높게 평가되었습니다. GitHub 활동의 지속성도 긍정적인 요소입니다."
        ),
        strengths=[
            "핀테크 관련 인턴십 경험 (카카오뱅크, 3개월)",
            "다수의 실전 프로젝트 경험과 구체적인 성과 지표",
            "GitHub 활동의 지속성 (연간 1,247 contributions, 최장 42일 연속)",
            "AWS 자격증 취득으로 클라우드 역량 공식화",
        ],
        improvement_areas=[
            "포트폴리오 외부 노출 강화 (블로그 방문자, 스타 수 등)",
            "오픈소스 기여 경험 추가",
            "대외 활동 (해커톤, 공모전) 참여 이력 부재",
        ],
        risk_flags=[],
        needs_human_review=False,
        model_version="anthropic:claude-sonnet-4-6",
        scoring_config_version="1.0.0",
        raw_ai_response={
            "normalizer_output": {"completeness_score": 0.91, "data_quality_flags": []},
            "scorer_output": {"total_score": 81.5, "grade": "A"},
            "explainer_output": {"overall_summary": "..."},
        },
        processing_time_ms=42350,
    )
    db.add(eval_result)
    await db.flush()

    factor_data = [
        ("academic", 12.5, 15.0, ["GPA_HIGH", "MAJOR_RELEVANCE_STRONG"],
         "4.1/4.5(91.1%) 학점으로 상위 수준이며, 컴퓨터공학 전공은 금융 IT 분야와 높은 관련성이 있습니다.", 0.94),
        ("project", 22.0, 25.0, ["PROJECT_COUNT_MULTIPLE", "TECH_DIVERSITY_HIGH", "OUTCOME_MEASURABLE"],
         "2개의 실전 프로젝트에서 다양한 기술 스택(Python, FastAPI, ML, Redis)을 활용하였으며, "
         "구체적인 성과 지표(DAU 200명, 응답 시간 150ms)가 명확합니다.", 0.91),
        ("internship", 16.0, 20.0, ["FINTECH_RELEVANCE_HIGH", "DURATION_ADEQUATE"],
         "카카오뱅크 백엔드 인턴십은 금융 IT와 직접적인 관련성이 높으며, Redis 캐싱 도입으로 "
         "성과를 수치화한 점이 긍정적입니다.", 0.88),
        ("certification", 8.5, 10.0, ["CERT_OFFICIAL_HIGH", "CLOUD_CERT"],
         "정보처리기사(국가공인)와 AWS SAA(국제 인증)의 두 가지 공인 자격증을 보유하고 있습니다.", 0.95),
        ("portfolio", 9.5, 15.0, ["PORTFOLIO_PRESENT", "GITHUB_ACTIVE"],
         "기술 블로그와 GitHub 포트폴리오가 있으나, 외부 노출 지표(방문자 수, 스타 수 등)를 "
         "확인하기 어렵습니다.", 0.75),
        ("github", 8.5, 10.0, ["CONTRIBUTION_HIGH", "STREAK_LONG", "REPO_QUALITY_GOOD"],
         "연간 1,247 contributions와 최장 42일 연속 활동으로 높은 지속성을 보입니다. "
         "주요 저장소의 별점(87, 34)도 활발한 오픈 활동을 나타냅니다.", 0.90),
        ("consistency", 4.5, 5.0, ["DATA_COMPLETE", "NARRATIVE_COHERENT"],
         "전반적인 데이터 완성도가 91%로 높으며, 학업→인턴십→프로젝트로 이어지는 "
         "역량 성장 스토리가 일관성 있게 구성되어 있습니다.", 0.93),
    ]

    for fname, score, max_score, reason_codes, explanation, confidence in factor_data:
        db.add(EvaluationFactorScore(
            evaluation_result_id=eval_result.id,
            factor_name=fname,
            score_value=score,
            max_score=max_score,
            reason_codes=reason_codes,
            explanation=explanation,
            confidence=confidence,
        ))

    db.add(LoanRangeEstimate(
        evaluation_result_id=eval_result.id,
        range_min=30_000_000,
        range_max=50_000_000,
        rationale=(
            "총점 81.5점으로 80점 이상 구간에 해당하여 최상위 시뮬레이션 범위를 적용합니다. "
            "핀테크 인턴십 경험과 높은 학업 역량이 긍정적으로 반영되었습니다."
        ),
        disclaimer_text=(
            "본 결과는 프로토타입 시뮬레이션이며, 실제 금융기관의 대출 심사와 무관합니다. "
            "실제 대출 가능 금액은 금융기관의 심사 기준에 따라 다를 수 있습니다."
        ),
    ))

    # 증명 기록
    proof_payload = {
        "evaluation_id": eval_request.public_id,
        "issuer": "skill-finance-score-prototype-v1",
        "score": {
            "total_score": 81.5,
            "grade": "A",
            "model_version": "anthropic:claude-sonnet-4-6",
            "scoring_config_version": "1.0.0",
        },
        "evidence_hash": payload_hash,
        "issued_at": "2026-03-20T09:30:47Z",
    }
    proof_canonical = canonical_json(proof_payload)
    proof_hash = sha256(proof_canonical)

    db.add(ProofRecord(
        public_id=uuid7_str(),
        evaluation_result_id=eval_result.id,
        proof_version="1.0.0",
        canonical_payload_json=proof_payload,
        payload_hash_sha256=proof_hash,
        evidence_combined_hash=payload_hash,
        issuer="skill-finance-score-prototype-v1",
        verification_status="issued",
        blockchain_anchor=None,
    ))

    # Reviewer 배정 (데모용)
    db.add(EvaluationAssignment(
        evaluation_request_id=eval_request.id,
        reviewer_id=reviewer.id,
        assigned_by_id=admin.id,
        review_status="reviewed",
        assigned_at=datetime(2026, 3, 20, 10, 0, 0),
        completed_at=datetime(2026, 3, 20, 11, 30, 0),
    ))

    # ── 5. 사용자 Bob (부분 프로파일, 평가 대기 중) ──
    print("👤 사용자 Bob 생성 중...")
    bob = User(
        public_id=uuid7_str(),
        email="bob@example.com",
        password_hash=hash_password("User1234!"),
        role="user",
        is_active=True,
        is_email_verified=False,
    )
    db.add(bob)
    await db.flush()

    db.add(UserProfile(
        user_id=bob.id,
        name="김민준",
        birth_year=2002,
        university="고려대학교",
        major="경영정보학",
        graduation_status="enrolled",
        employment_status="student",
    ))

    for consent_type in ["privacy", "evaluation"]:
        db.add(ConsentRecord(
            user_id=bob.id,
            consent_type=consent_type,
            consent_version="1.0",
            accepted=True,
            accepted_at=now,
            ip_address="127.0.0.1",
            user_agent="seed-script/1.0",
        ))

    db.add(AcademicRecord(
        user_id=bob.id,
        university="고려대학교",
        major="경영정보학",
        degree_type="bachelor",
        gpa=3.5,
        gpa_scale=4.5,
        gpa_normalized=round(3.5 / 4.5, 4),
        admission_year=2021,
        is_draft=False,
    ))

    db.add(ProjectRecord(
        user_id=bob.id,
        title="쇼핑몰 웹 서비스 개발",
        role="프론트엔드 개발",
        duration_months=2,
        start_date=date(2025, 7, 1),
        end_date=date(2025, 8, 31),
        description="React와 Node.js를 활용한 소규모 쇼핑몰 웹 서비스 개발",
        tech_stack=["React", "Node.js", "MongoDB"],
        outcome_summary=None,
        is_draft=False,
    ))

    await db.commit()

    print()
    print("✅ 시드 데이터 생성 완료!")
    print()
    print("═" * 50)
    print("  계정 정보")
    print("═" * 50)
    print(f"  관리자:  admin@example.com / Admin1234!")
    print(f"  심사자:  reviewer@example.com / Reviewer1234!")
    print(f"  사용자1: alice@example.com / User1234!  (완성된 프로파일, 평가 완료)")
    print(f"  사용자2: bob@example.com / User1234!   (부분 프로파일)")
    print("═" * 50)
    print()
    print("  접속 주소:")
    print("  - 사용자: http://localhost:3000")
    print("  - 관리자: http://localhost:3000/admin")
    print("  - API 문서: http://localhost:8000/docs")


async def main() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        await seed(db)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
