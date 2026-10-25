import type { ReportReason } from '@/api/types';

/** Reasons in the order the report sheet lists them, with user-facing labels. */
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'illegal', label: 'Illegal content' },
  { value: 'other', label: 'Something else' },
];

export function reasonLabel(reason: ReportReason): string {
  return REPORT_REASONS.find((r) => r.value === reason)?.label ?? reason;
}
