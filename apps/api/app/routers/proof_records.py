
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories import evaluation_repo
from app.schemas.evaluation import ProofRecordResponse, ProofVerifyResponse
from app.utils.canonical_json import canonical_json_v1, compute_hash

router = APIRouter(prefix="/api/v1/proof-records", tags=["proof-records"])


@router.get("/{public_id}", response_model=ProofRecordResponse)
async def get_proof_record(
    public_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProofRecordResponse:
    """Retrieve proof record details (public endpoint — no auth required)."""
    proof = await evaluation_repo.get_proof_by_public_id(db, public_id)
    if proof is None:
        raise HTTPException(status_code=404, detail="증명 기록을 찾을 수 없습니다.")
    return ProofRecordResponse(
        id=proof.public_id,
        evaluation_result_id=proof.evaluation_result_id,
        proof_version=proof.proof_version,
        payload_hash_sha256=proof.payload_hash_sha256,
        evidence_combined_hash=proof.evidence_combined_hash,
        issuer=proof.issuer,
        verification_status=proof.verification_status,
        created_at=proof.created_at,
    )


@router.post("/{public_id}/verify", response_model=ProofVerifyResponse)
async def verify_proof_record(
    public_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProofVerifyResponse:
    """Verify proof record integrity by recomputing the hash."""
    proof = await evaluation_repo.get_proof_by_public_id(db, public_id)
    if proof is None:
        raise HTTPException(status_code=404, detail="증명 기록을 찾을 수 없습니다.")

    # Re-serialize canonical payload and compute hash
    canonical = canonical_json_v1(proof.canonical_payload_json)
    computed = compute_hash(canonical)
    valid = computed == proof.payload_hash_sha256

    return ProofVerifyResponse(
        valid=valid,
        proof_id=proof.public_id,
        computed_hash=computed,
        stored_hash=proof.payload_hash_sha256,
        details="무결성 검증 성공" if valid else "해시 불일치 — 데이터가 변조되었을 수 있습니다.",
    )
