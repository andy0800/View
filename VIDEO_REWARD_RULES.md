# Video Reward Rules (Single Source of Truth)

1. A reward can only be granted after a video view is fully completed and verified by the backend.
2. Each reward must be tied to exactly one unique video view attempt.
3. The same video view attempt must never be rewarded more than once.
4. Frontend events must never grant, calculate, or finalize rewards.
5. Reward logic must be idempotent and safe against retries, autoplay, refreshes, and duplicate requests.
6. Each video view attempt must be uniquely identifiable and verifiable by the backend.
7. Invalid, expired, replayed, or mismatched view attempts must be rejected.
8. Reward eligibility must enforce a backend-defined completion threshold.
9. An ad must be eligible for viewing and have sufficient budget at the moment of reward processing.
10. Reward processing must be atomic: view completion, budget deduction, wallet credit, and ledger recording succeed or fail together.
11. Database-level constraints must prevent duplicate rewards even if backend logic fails.
12. Backend must actively detect and block abnormal, repeated, or suspicious completion attempts.
