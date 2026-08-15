import { FactCheckItem } from '../types';

/**
 * Determines the workflow approvalStatus a NEW fact-check entry should get,
 * based on who's creating it. Admins publish immediately; every other staff
 * member's entry goes into the Pending Approval queue until an admin
 * approves it (see FaqManagerView's "Pending Approval" tab / Approve action).
 *
 * This was originally an inline ternary inside FaqManagerView.tsx. It's
 * pulled out here so the Unified Content Editor's "Fact-Check" kind can call
 * the exact same rule instead of re-implementing it -- see
 * NEXT_SESSION_PLAN.md, Priority 0, "Fact-checks currently live partly in
 * FaqManagerView.tsx..." for why this matters: two independent
 * implementations of an approval-gating rule is exactly the class of bug
 * this project has hit multiple times before (see Priority 2 notes).
 *
 * Note: this is a client-side/UX convenience only. The actual security
 * boundary is the Supabase RLS policy on `fact_checks` -- this function
 * must never be treated as the enforcement layer.
 */
export function determineFactCheckApprovalStatus(isAdmin: boolean): FactCheckItem['approvalStatus'] {
  return isAdmin ? 'Published' : 'Pending Approval';
}
