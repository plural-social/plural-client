import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { listAdminReports, type ReportStatus } from '@/api/moderation';
import { queryKeys } from '@/api/query-keys';
import { isModerator } from '@/auth/roles';
import { useMe } from '@/auth/session-context';
import { ReportCard } from '@/components/moderation/report-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
import { Spacing } from '@/constants/theme';
import { flattenPages } from '@/hooks/use-post-queries';

const TABS: { status: ReportStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'resolved', label: 'Resolved' },
  { status: 'dismissed', label: 'Dismissed' },
];

export default function ModerationScreen(): React.JSX.Element {
  const me = useMe();
  const [status, setStatus] = useState<ReportStatus>('open');

  // The API enforces this too; the check only avoids showing a broken screen.
  if (!isModerator(me.role)) return <ErrorView message="You don't have access to this page." />;

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const selected = tab.status === status;
          return (
            <Pressable
              key={tab.status}
              onPress={() => setStatus(tab.status)}
              accessibilityRole="tab"
              aria-selected={selected}
              style={styles.tab}>
              <ThemedText type={selected ? 'smallBold' : 'small'} style={selected && styles.tabSelected}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ReportList key={status} status={status} />
    </ThemedView>
  );
}

function ReportList({ status }: { status: ReportStatus }): React.JSX.Element {
  const [now] = useState(() => new Date());
  const reports = useInfiniteQuery({
    queryKey: queryKeys.adminReports(status),
    queryFn: ({ pageParam }) => listAdminReports(status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  if (reports.isPending) return <LoadingView />;
  if (reports.error) return <ErrorView message={reports.error.message} onRetry={() => void reports.refetch()} />;

  return (
    <FlatList
      data={flattenPages(reports.data)}
      keyExtractor={(report) => report.uuid}
      renderItem={({ item }) => <ReportCard report={item} now={now} />}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <ThemedText themeColor="textSecondary" style={styles.empty}>
          No {status} reports.
        </ThemedText>
      }
      onEndReached={() => {
        if (reports.hasNextPage && !reports.isFetchingNextPage) void reports.fetchNextPage();
      }}
      ListFooterComponent={reports.isFetchingNextPage ? <ActivityIndicator /> : undefined}
      refreshControl={<RefreshControl refreshing={reports.isRefetching} onRefresh={() => void reports.refetch()} />}
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  tabSelected: {
    textDecorationLine: 'underline',
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  empty: {
    textAlign: 'center',
    padding: Spacing.four,
  },
});
