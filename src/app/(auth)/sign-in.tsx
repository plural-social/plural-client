import { useQuery } from '@tanstack/react-query';

import { getInstance } from '@/api/instance';
import { queryKeys } from '@/api/query-keys';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ErrorView } from '@/components/ui/error-view';
import { LoadingView } from '@/components/ui/loading-view';
import { Spacing } from '@/constants/theme';

export default function SignInScreen(): React.JSX.Element {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: queryKeys.instance,
    queryFn: getInstance,
  });

  if (isPending && !error) return <LoadingView />;
  if (error) return <ErrorView message={error.message} onRetry={() => void refetch()} />;

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four }}>
      <ThemedText>
        Connected to {data.name} ({data.domain})
      </ThemedText>
    </ThemedView>
  );
}
