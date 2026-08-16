import { describe, it, expect } from 'vitest';
import { determineFactCheckApprovalStatus } from './factCheckStatus';

describe('determineFactCheckApprovalStatus', () => {
  it('publishes immediately for an admin', () => {
    expect(determineFactCheckApprovalStatus(true)).toBe('Published');
  });

  it('sends a non-admin submission to the pending-approval queue, never published', () => {
    // This is the rule that both FaqManagerView and UnifiedContentEditor's
    // 'faq' kind must share -- see the comment in factCheckStatus.ts on why
    // this was pulled out into one function instead of two independent
    // ternaries drifting apart.
    expect(determineFactCheckApprovalStatus(false)).toBe('Pending Approval');
  });
});
