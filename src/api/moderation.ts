import { apiFetch } from '@/api/client';
import type { Page, Report, ReportReason, ReportTargetType, UserSummary } from '@/api/types';

export type ReportStatus = Report['status'];
export type ModerationAction = 'dismiss' | 'removeContent' | 'suspendAccount';

export async function blockUser(username: string): Promise<void> {
  await apiFetch<void>(`/users/${encodeURIComponent(username)}/block`, { method: 'PUT' });
}

export async function unblockUser(username: string): Promise<void> {
  await apiFetch<void>(`/users/${encodeURIComponent(username)}/block`, { method: 'DELETE' });
}

export async function listBlocks(cursor: string | null): Promise<Page<UserSummary>> {
  return apiFetch<Page<UserSummary>>('/me/blocks', { query: { cursor: cursor ?? undefined } });
}

export async function createReport(input: {
  targetType: ReportTargetType;
  targetUuid: string;
  reason: ReportReason;
  details: string;
}): Promise<Report> {
  return apiFetch<Report>('/reports', { method: 'POST', json: input });
}

export async function listAdminReports(status: ReportStatus, cursor: string | null): Promise<Page<Report>> {
  return apiFetch<Page<Report>>('/admin/reports', { query: { status, cursor: cursor ?? undefined } });
}

export async function resolveReport(
  uuid: string,
  input: { action: ModerationAction; note: string },
): Promise<Report> {
  return apiFetch<Report>(`/admin/reports/${encodeURIComponent(uuid)}/resolve`, { method: 'POST', json: input });
}

export async function unsuspendAccount(uuid: string): Promise<void> {
  await apiFetch<void>(`/admin/accounts/${encodeURIComponent(uuid)}/unsuspend`, { method: 'POST' });
}
