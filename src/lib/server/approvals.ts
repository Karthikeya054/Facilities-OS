import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

// Approval chain + base URL come from env so no real addresses live in the repo
export function baseUrl(): string {
  return (publicEnv.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export function approvers() {
  return {
    l1Email: env.L1_APPROVER_EMAIL || '',
    l1Name: env.L1_APPROVER_NAME || 'L1 Approver',
    l2Emails: (env.L2_APPROVER_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean),
    l2Name: env.L2_APPROVER_NAME || 'L2 Approver',
    executorEmail: env.EXECUTOR_EMAIL || '',
  };
}

// Signed approve/reject links: HMAC-SHA256 over id:level:action:exp
const LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sign(id: string, level: string, action: string, exp: string): string {
  return createHmac('sha256', env.APPROVAL_LINK_SECRET || '').update(`${id}:${level}:${action}:${exp}`).digest('hex');
}

export function signedApprovalQuery(id: string, level: string, action: 'approve' | 'reject'): string {
  const exp = String(Date.now() + LINK_TTL_MS);
  const params = new URLSearchParams({ id, action, level, exp, sig: sign(id, level, action, exp) });
  return params.toString();
}

export function verifyApprovalToken(id: string, level: string, action: string, exp: string | null, sig: string | null): boolean {
  if (!env.APPROVAL_LINK_SECRET || !exp || !sig) return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = Buffer.from(sign(id, level, action, exp), 'hex');
  const given = Buffer.from(sig, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}
