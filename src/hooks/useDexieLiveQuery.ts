import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';

export function useDexieLiveQuery<T>(
  query: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T>();

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => setData(value),
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}
