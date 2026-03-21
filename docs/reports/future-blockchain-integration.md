# 미래 블록체인 연동 보고서

## 1. 서론

### 1.1 문서 목적

본 보고서는 Skill Finance Score 프로토타입의 현재 오프체인 증명 기록 시스템을 분석하고, 향후 블록체인 기반 무결성 앵커링 및 Soulbound Token(SBT) 발행으로 전환하기 위한 기술적·제도적 로드맵을 제시한다.

### 1.2 현재 프로젝트와의 관계

현 프로젝트는 블록체인을 **구현하지 않는다**. 대신:

- 오프체인 `proof_records` 테이블에 canonical JSON + SHA-256 해시를 저장한다.
- 스마트 컨트랙트 연동을 위한 `blockchain_anchor` JSONB 컬럼을 예약한다 (현재 `null`).
- 본 보고서에서 정의한 Adapter 패턴을 코드에 반영하여 향후 전환 비용을 최소화한다.

---

## 2. 현재 블록체인 미구현 사유

### 2.1 프로토타입 단계의 우선순위

현 단계의 핵심 목표는 "AI 기반 역량 평가의 유효성 검증"이다. 블록체인 연동은 유효성이 증명된 이후의 신뢰성·불변성 강화 단계에 해당하므로, 현 시점에서는 오버엔지니어링이다.

### 2.2 규제·법률 불확실성

- 금융위원회·금감원의 블록체인 기반 금융 데이터 활용 가이드라인이 아직 확정되지 않았다.
- PIPA(개인정보보호법)와 블록체인의 "삭제 불가" 특성 간의 충돌이 미해결 상태다.
- NFT/SBT의 법적 지위(증권 여부 등)가 불명확하다.

### 2.3 기술 성숙도

- ERC-5192(Minimal Soulbound NFT) 표준이 2022년 등장하였으나, 실제 금융 서비스 적용 사례가 극히 드물다.
- Layer 2 솔루션(Polygon, Arbitrum, Base)의 장기 안정성이 아직 충분히 검증되지 않았다.

### 2.4 비용 대비 효과

- 테스트넷 외 메인넷 트랜잭션 비용(가스비)이 발생한다.
- 스마트 컨트랙트 감사(audit) 비용이 높다.
- 현 프로토타입 사용자 규모(100명 이하)에서는 오프체인 해시 방식으로도 충분한 무결성을 보장할 수 있다.

---

## 3. 현재 오프체인 검증 기록 구조

### 3.1 Proof Record 스키마

```python
class ProofRecord(Base):
    public_id: str              # UUID v7 (외부 노출)
    evaluation_result_id: int   # 평가 결과 FK (1:1)
    proof_version: str          # "1.0.0"
    canonical_payload_json: dict # 증명 대상 데이터 (canonical JSON)
    payload_hash_sha256: str     # SHA-256(canonical JSON)
    evidence_combined_hash: str  # input_snapshot.payload_hash_sha256과 동일
    issuer: str                  # "skill-finance-score-prototype-v1"
    verification_status: str     # "issued" | "revoked"
    superseded_by_id: int | None # 재평가 체이닝
    blockchain_anchor: dict | None  # 향후 연동용 예약 컬럼 (현재 null)
```

### 3.2 Canonical JSON 직렬화 규칙

해시 재현성 보장을 위한 결정론적 직렬화:

| 규칙 | 명세 |
|------|------|
| 키 정렬 | 유니코드 코드포인트 순서 (`sort_keys=True`) |
| 인코딩 | UTF-8, `ensure_ascii=False` |
| 날짜 | ISO 8601 RFC 3339 UTC (`2026-03-20T09:30:00Z`) |
| 숫자 | trailing zero 제거 (`4.5` not `4.50`) |
| null | 키 생략 금지 (`{"field": null}`) |
| 배열 | `ORDER BY id ASC` 결정론적 순서 |
| 포맷 | compact (`separators=(",", ":")`) |

### 3.3 SHA-256 해시 체인

```
evaluation_input_snapshot.payload_hash_sha256
             │
             ▼ (동일 값)
proof_record.evidence_combined_hash
             │
             ▼ (SHA-256(canonical_payload_json))
proof_record.payload_hash_sha256  ←── 검증 API가 재계산하여 비교
```

### 3.4 검증 API 동작

`POST /api/v1/proof-records/:id/verify`:

1. `proof_record.canonical_payload_json`을 canonical JSON 규칙으로 재직렬화
2. SHA-256 계산
3. `proof_record.payload_hash_sha256`과 비교
4. 일치하면 `{ valid: true }`, 불일치하면 `{ valid: false, reason: "..." }`

### 3.5 무결성 보장 범위와 한계

| 보장 항목 | 방식 |
|-----------|------|
| 입력 데이터 불변 | 평가 요청 시점 스냅샷 고정 + 해시 |
| 채점 설정 불변 | `scoring_config_snapshot` 함께 고정 |
| AI 결과 연결 | `evidence_combined_hash` = `input_snapshot.payload_hash_sha256` |

**현재 한계**: 해시는 DB 내부에만 저장되므로, DB 자체가 변조되면 해시도 함께 변조될 수 있다. 이 한계를 극복하는 것이 블록체인 앵커링의 핵심 가치다.

---

## 4. 향후 Chain Anchor 방식

### 4.1 앵커링 전략 비교

#### 4.1.1 단순 해시 앵커링 (TX data에 해시 직접 기록)

```
트랜잭션 data 필드에 SHA-256 해시를 16진수로 기록
proof_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
tx.data = "0x" + proof_hash
```

- **장점**: 구현 단순, 별도 스마트 컨트랙트 불필요
- **단점**: 단건 조회 불편, 검색 인덱스 없음
- **비용**: 트랜잭션당 ~0.001~0.01 USD (L2 기준)

#### 4.1.2 머클 트리 배치 앵커링 (다수 기록 → 1 TX)

```
매일 자정:
1. 당일 발급된 모든 proof_record.payload_hash_sha256 수집
2. 머클 트리 생성
3. 머클 루트만 온체인에 기록
4. 각 proof_record의 머클 경로(Merkle proof)를 DB에 저장
```

- **장점**: 비용 절감 (N개 기록 → 1 TX), 개별 검증 가능 (머클 경로 제출)
- **단점**: 앵커링이 당일 자정까지 지연, 중간 DB 머클 경로 저장 필요
- **권장 규모**: 일일 100건 이상 평가 시

#### 4.1.3 전용 스마트 컨트랙트 기반 앵커링

```solidity
contract SkillFinanceAnchor {
    event ProofAnchored(bytes32 indexed proofHash, uint256 timestamp);

    mapping(bytes32 => uint256) public anchoredAt;

    function anchor(bytes32 proofHash) external onlyIssuer {
        require(anchoredAt[proofHash] == 0, "Already anchored");
        anchoredAt[proofHash] = block.timestamp;
        emit ProofAnchored(proofHash, block.timestamp);
    }

    function verify(bytes32 proofHash) external view returns (bool, uint256) {
        uint256 ts = anchoredAt[proofHash];
        return (ts > 0, ts);
    }
}
```

- **장점**: 온체인 조회 가능, 이벤트 인덱싱 용이, 제3자 독립 검증 가능
- **단점**: 컨트랙트 감사 비용, 배포·관리 복잡도
- **권장 규모**: 프로덕션 단계, 외부 기관 연계 시

### 4.2 권장 방식 및 근거

**단기(6개월~1년)**: 방식 2 (배치 머클 앵커링)
- 비용 최소화
- 구현 복잡도 낮음
- 검증 가능성 유지

**중·장기**: 방식 3 (전용 스마트 컨트랙트)
- 외부 기관(금융사, 취업 플랫폼) 독립 검증 지원
- SBT 발행 기반으로 확장 가능

### 4.3 트랜잭션 비용 추정

| 체인 | 방식 | 건당 가스비 (예상) |
|------|------|-----------------|
| Ethereum L1 | 단순 앵커링 | 0.5~5 USD |
| Polygon PoS | 단순 앵커링 | 0.001~0.01 USD |
| Arbitrum One | 단순 앵커링 | 0.01~0.1 USD |
| Base (Coinbase L2) | 단순 앵커링 | 0.005~0.05 USD |

---

## 5. NFT/SBT 확장 시나리오

### 5.1 SBT vs VC 비교

| 항목 | SBT (Soulbound Token) | VC (Verifiable Credential) |
|------|----------------------|---------------------------|
| 표준 | ERC-5192 | W3C VC Data Model |
| 저장소 | 블록체인 | 오프체인 (발급자 서명) |
| 양도 | 불가 (Soulbound) | 불가 (서명 기반) |
| 검증 방식 | 온체인 조회 | 발급자 DID 조회 |
| 프라이버시 | 낮음 (공개 체인) | 높음 (ZKP 결합 가능) |
| 규제 친화성 | 불명확 | W3C 표준, DIF 지원 |

**권장**: 단기에는 VC 방식을 검토하되, 생태계 성숙도와 규제 방향에 따라 SBT로 전환.

### 5.2 SBT 발행 컨트랙트 책임 범위

```solidity
// ERC-5192 기반 Soulbound Token
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract SkillFinanceSBT is ERC721, IERC5192 {
    // 토큰 ID → 메타데이터 URI (IPFS/Arweave)
    // 발급: 금융 기관 역할의 주소만 mint 가능
    // 양도: 항상 revert (Soulbound)
    // 폐기: revoke() → 토큰 burn 또는 status 변경
}
```

### 5.3 토큰 메타데이터 설계

```json
{
  "name": "Skill Finance Score #001",
  "description": "청년 역량 기반 보완 신용평가 증명 (프로토타입)",
  "image": "ipfs://Qm.../badge.svg",
  "attributes": [
    { "trait_type": "Grade", "value": "A" },
    { "trait_type": "Total Score", "value": 81 },
    { "trait_type": "Issued At", "value": "2026-03-20T09:30:45Z" },
    { "trait_type": "Scoring Config Version", "value": "1.0.0" },
    { "trait_type": "Model Version", "value": "anthropic:claude-sonnet-4-6" }
  ],
  "external_url": "https://skill-finance.example.com/proof-record/01920000-...",
  "proof": {
    "payload_hash_sha256": "e3b0c44298fc...",
    "issuer": "skill-finance-score-prototype-v1"
  }
}
```

**PII 원칙**: 메타데이터에 이름, 이메일, 생년월일 등 PII를 절대 포함하지 않는다.

### 5.4 SBT 라이프사이클

```
발행(Mint):
  평가 완료 → proof_record 생성 → SBT 발행 요청
  → 컨트랙트에서 mint(recipient, tokenId, metadataURI)

조회:
  tokenId → ownerOf() → 지갑 주소
  tokenId → tokenURI() → 메타데이터 IPFS URI

폐기(Revoke):
  재평가 시 이전 SBT revoke()
  → 새 평가 완료 → 새 SBT 발행 (이전 tokenId의 superseded_by 기록)
```

### 5.5 ERC-5192 준수

- `locked(tokenId)` → 항상 `true` 반환 (양도 불가)
- `transferFrom` / `safeTransferFrom` → `revert("Soulbound: non-transferable")`

---

## 6. 메타데이터 설계

### 6.1 온체인 vs 오프체인 분리 원칙

| 데이터 | 저장소 | 이유 |
|--------|--------|------|
| 소유권, 발급 시점 | 온체인 | 불변성, 즉시 조회 |
| 메타데이터(등급, 점수) | IPFS/Arweave | 비용, 용량 |
| canonical JSON | DB (오프체인) | PII 포함 가능, 접근 제어 필요 |

### 6.2 메타데이터 저장소 전략

| 옵션 | 영속성 | 비용 | 권장 용도 |
|------|--------|------|----------|
| IPFS (Pinata/nft.storage) | 핀 유지 필요 | 저렴 | 개발/스테이징 |
| Arweave | 영구 저장 | 일회성 고비용 | 프로덕션 |
| IPFS + Filecoin | 영구 저장 | 중간 | 권장 |

---

## 7. Wallet 연계 전략

### 7.1 지갑 연결 흐름

```
사용자 프로필 페이지
  → "지갑 연결" 버튼
  → WalletConnect / MetaMask 팝업
  → 서명 요청: sign("Skill Finance Score 지갑 연결 동의 - {nonce}")
  → 서명 검증 (서버에서 ecrecover)
  → users.wallet_address 저장
  → SBT 발행 시 해당 주소로 mint
```

### 7.2 기존 계정-지갑 바인딩

- `users` 테이블에 `wallet_address VARCHAR(42)` 컬럼 추가
- 지갑 연결은 선택 사항 (없으면 SBT 발행 안 됨)
- 여러 평가 결과 중 발행할 SBT 사용자가 선택

### 7.3 지갑 미보유 사용자 대응

- 오프체인 proof_record만 제공 (현행 방식 유지)
- "지갑 생성 가이드" 링크 제공
- 나중에 지갑 연결 후 소급 발행 가능하도록 설계

---

## 8. 체인 선택 분석

### 8.1 후보 체인 비교

| 체인 | TPS | 가스비 | 보안 | 생태계 | 규제 친화성 |
|------|-----|--------|------|--------|------------|
| Ethereum L1 | 15 | 높음 | 최고 | 최대 | 보통 |
| Polygon PoS | 7,000 | 매우 낮음 | 보통 | 큼 | 보통 |
| Arbitrum One | 40,000 | 낮음 | Ethereum 상속 | 큼 | 보통 |
| Base (Coinbase) | 높음 | 낮음 | Ethereum 상속 | 성장 중 | Coinbase 지원 |
| Hyperledger Besu | - | 없음 | 컨소시엄 | 작음 | 높음 (금융권) |

### 8.2 권장 체인

**프로토타입/테스트**: Polygon Mumbai Testnet (무료, 빠름)

**파일럿**: Base (낮은 가스비, Coinbase 브랜드, Ethereum 보안 상속)

**금융기관 컨소시엄 참여 시**: Hyperledger Besu (프라이빗 네트워크, 규제 친화)

---

## 9. 보안 · 개인정보 · 규제 고려사항

### 9.1 GDPR/PIPA와 블록체인의 충돌

블록체인의 핵심 속성인 "데이터 불변성"은 PIPA의 "개인정보 삭제 권리"와 정면 충돌한다.

**해결 방안**:
1. **온체인에 PII 저장 금지**: 해시값만 온체인 기록
2. **오프체인 데이터 삭제 시 "유효한 검증 불가" 처리**: 원본 없이 해시만 남음
3. **ZKP 결합**: 원본 데이터 노출 없이 특정 조건 충족 여부만 증명

### 9.2 PII의 온체인 저장 금지 원칙

- 이름, 이메일, 생년월일 → **온체인 절대 금지**
- 점수, 등급 → 메타데이터(IPFS, 선택적 공개)
- 해시값 → 온체인 (역산 불가)

### 9.3 ZKP 활용 가능성

ZKP(Zero-Knowledge Proof)를 활용하면 "80점 이상"임을 원본 데이터 노출 없이 증명 가능:

```
사용자: "나는 Skill Finance Score 80점 이상입니다"
검증자: "증명해보세요 (원본 공개 없이)"
ZKP: ZK-SNARK/STARK으로 공개키만 공개
```

현재 구현 범위 밖이지만, 향후 VC + ZKP 조합이 금융 프라이버시 최적 해법으로 부상 중.

### 9.4 금융 규제 기관 가이드라인

| 기관 | 관련 문서 | 핵심 방향 |
|------|----------|----------|
| 금융위원회 | 디지털자산 기본법 추진 | STO 규제 방향 논의 중 |
| 금감원 | 블록체인 활용 금융서비스 가이드 | 사전 협의 권고 |
| BIS | Project Guardian | 토큰화 금융 자산 실험 |

**권고**: 메인넷 배포 전 금융위/금감원 사전 협의 필수.

---

## 10. Migration Path (현재 → 블록체인)

### 10.1 현재 시스템에서 변경이 필요한 컴포넌트

| 컴포넌트 | 현재 | 변경 방향 |
|---------|------|----------|
| `proof_records.blockchain_anchor` | `null` | 앵커링 후 `{tx_hash, chain_id, block_number, anchored_at}` 기록 |
| `proof_service.py` | 해시만 생성 | Adapter 패턴으로 앵커링 호출 추가 |
| `users` 테이블 | wallet_address 없음 | `wallet_address VARCHAR(42)` 추가 |
| 프론트엔드 | 증명 기록 페이지 | 온체인 조회 링크 추가 |

### 10.2 Adapter 패턴 기반 통합 설계

```python
# apps/ai-worker/app/blockchain/anchor_adapter.py
from abc import ABC, abstractmethod

class BlockchainAnchorAdapter(ABC):
    @abstractmethod
    async def anchor(self, proof_hash: str) -> dict:
        """해시를 블록체인에 앵커링하고 트랜잭션 정보를 반환."""
        ...

    @abstractmethod
    async def verify(self, proof_hash: str) -> dict:
        """온체인에서 앵커링 여부를 확인."""
        ...

class NoOpAnchorAdapter(BlockchainAnchorAdapter):
    """현재 구현 (블록체인 연동 없음)."""
    async def anchor(self, proof_hash: str) -> dict:
        return {}  # blockchain_anchor = null

    async def verify(self, proof_hash: str) -> dict:
        return {"anchored": False, "reason": "blockchain_not_enabled"}

class PolygonAnchorAdapter(BlockchainAnchorAdapter):
    """향후 Polygon 연동."""
    async def anchor(self, proof_hash: str) -> dict:
        # web3.py로 컨트랙트 호출
        tx_hash = await self._send_anchor_tx(proof_hash)
        return {
            "chain": "polygon",
            "chain_id": 137,
            "tx_hash": tx_hash,
            "anchored_at": datetime.utcnow().isoformat() + "Z"
        }
```

현재는 `NoOpAnchorAdapter`를 DI로 주입. 향후 `PolygonAnchorAdapter`로 교체만 하면 됨.

### 10.3 기존 Proof Record → 온체인 이관 전략

```python
# scripts/backfill_blockchain_anchor.py
async def backfill():
    """기존 issued 상태의 proof_record를 일괄 앵커링."""
    records = await get_all_issued_proof_records()
    for record in records:
        tx_info = await polygon_adapter.anchor(record.payload_hash_sha256)
        await update_blockchain_anchor(record.id, tx_info)
        await asyncio.sleep(0.5)  # rate limit
```

### 10.4 점진적 전환 vs 빅뱅 전환

**권장: 점진적 전환**

1. 신규 평가에만 앵커링 적용 (기존 데이터는 유지)
2. 안정화 후 기존 데이터 배치 앵커링
3. 사용자 UI에 "온체인 검증" 기능 추가

---

## 11. 단계별 도입 로드맵

### Stage 0: 현재 (오프체인 Proof Record)

- 오프체인 SHA-256 해시 체인
- `/proof-records/:id/verify` API
- `blockchain_anchor = null`

### Stage 1: 해시 앵커링 PoC (테스트넷, 예상 3~6개월)

- Polygon Mumbai 테스트넷에 proof_hash 단순 앵커링
- `NoOpAnchorAdapter` → `PolygonAnchorAdapter` 교체
- UI에 "테스트넷 트랜잭션 보기" 링크

### Stage 2: SBT 발행 PoC (테스트넷, 예상 6~12개월)

- ERC-5192 기반 SBT 컨트랙트 배포 (테스트넷)
- 지갑 연결 UI 구현 (WalletConnect)
- 메타데이터 IPFS 업로드 파이프라인
- 컨트랙트 감사(audit) 의뢰

### Stage 3: 메인넷 파일럿 (예상 12~18개월)

- 소규모 실사용자 대상 메인넷 SBT 발행
- 법무/컴플라이언스 검토 완료
- 금융당국 사전 협의

### Stage 4: 프로덕션 + 외부 기관 연계 (예상 18개월 이후)

- 취업 플랫폼, 금융기관 파트너십
- VC + ZKP 통합 검토
- 컨소시엄 블록체인 전환 검토

### 각 단계 소요 자원 추정

| 단계 | 개발 | 인프라 | 감사/법무 | 총계(월) |
|------|------|--------|----------|---------|
| Stage 1 | 1~2인·월 | $50/월 | - | ~$1,500 |
| Stage 2 | 2~3인·월 | $200/월 | $10,000 | ~$25,000 |
| Stage 3 | 3~4인·월 | $500/월 | $30,000 | ~$60,000 |
| Stage 4 | 5+인·월 | $2,000+/월 | $50,000+ | ~$150,000+ |

---

## 12. 결론 및 권고사항

### 12.1 단기 권고 (6개월 내)

1. **현행 유지**: 오프체인 해시 기반 proof_record 운영
2. **코드 준비**: `NoOpAnchorAdapter` DI 구조 유지, 향후 교체만 하면 되도록 설계
3. **규제 모니터링**: 금융위/금감원 가이드라인 추적
4. **PoC 준비**: Polygon Mumbai 테스트넷 앵커링 스크립트 작성

### 12.2 중기 권고 (1년 내)

1. Stage 1 + Stage 2 테스트넷 PoC 완료
2. 컨트랙트 감사 의뢰 및 법무 검토
3. IPFS 메타데이터 파이프라인 구축
4. ZKP 기반 프라이버시 보호 방안 연구

### 12.3 장기 비전

Skill Finance Score가 청년의 역량을 증명하는 표준 인프라로 자리잡으면서:

- 취업 플랫폼, 정부 지원사업에서 SBT로 자격 검증
- 여러 금융기관이 동일한 SBT를 참조하여 대출 심사
- ZKP로 프라이버시 보호하면서 "최소 역량 조건 충족" 증명
- VC + DID 표준으로 글로벌 상호운용성 확보

---

## 부록

### A. 참고 문헌

- Ethereum ERC-5192: Minimal Soulbound NFT (2022)
- Buterin, Weyl, Ohlhaver: "Decentralized Society: Finding Web3's Soul" (2022)
- W3C Verifiable Credentials Data Model v2.0
- BIS Project Guardian: Tokenisation of Financial Assets
- 금융위원회: 디지털자산 기본법 추진 현황

### B. 스마트 컨트랙트 인터페이스 초안

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISkillFinanceAnchor {
    event ProofAnchored(bytes32 indexed proofHash, address indexed issuer, uint256 timestamp);
    event ProofRevoked(bytes32 indexed proofHash, uint256 timestamp);

    function anchor(bytes32 proofHash) external;
    function revoke(bytes32 proofHash) external;
    function isAnchored(bytes32 proofHash) external view returns (bool);
    function getAnchorInfo(bytes32 proofHash) external view returns (address issuer, uint256 timestamp, bool revoked);
}
```

### C. 메타데이터 JSON 스키마

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SkillFinanceScoreMetadata",
  "type": "object",
  "required": ["name", "description", "attributes", "proof"],
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "image": { "type": "string", "format": "uri" },
    "attributes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["trait_type", "value"],
        "properties": {
          "trait_type": { "type": "string" },
          "value": { "type": ["string", "number"] }
        }
      }
    },
    "proof": {
      "type": "object",
      "required": ["payload_hash_sha256", "issuer"],
      "properties": {
        "payload_hash_sha256": { "type": "string", "pattern": "^[0-9a-f]{64}$" },
        "issuer": { "type": "string" }
      }
    }
  }
}
```

### D. 용어 정의

| 용어 | 정의 |
|------|------|
| SBT | Soulbound Token. 양도 불가능한 NFT. 자격·자격증·신원 증명에 활용 |
| VC | Verifiable Credential. W3C 표준의 검증 가능한 디지털 자격증 |
| ZKP | Zero-Knowledge Proof. 원본 데이터 비공개 상태에서 특정 사실 증명 |
| 앵커링 | 오프체인 데이터의 해시를 블록체인 트랜잭션에 기록하여 존재 증명 |
| 머클 트리 | 여러 데이터를 해시로 압축하는 트리 구조. 단일 루트 해시로 전체 검증 가능 |
| Canonical JSON | 동일 데이터가 항상 동일한 JSON 문자열로 직렬화되도록 보장하는 규칙 |
