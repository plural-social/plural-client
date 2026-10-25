import { useState } from 'react';

import { ReportSheet, type ReportTarget } from '@/components/moderation/report-sheet';

/** Report sheet state for one screen or component. Render `sheet` somewhere in the tree. */
export function useReportSheet(): { open: (target: ReportTarget) => void; sheet: React.JSX.Element } {
  const [target, setTarget] = useState<ReportTarget | null>(null);
  return { open: setTarget, sheet: <ReportSheet target={target} onClose={() => setTarget(null)} /> };
}
