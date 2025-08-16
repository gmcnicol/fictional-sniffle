import { useCallback } from 'react';
import { db } from '../lib/db';
import { useDexieLiveQuery } from './useDexieLiveQuery.ts';

export function usePreference(key: string, defaultValue: string) {
  const value = useDexieLiveQuery(async () => {
    const pref = await db.preferences.get(key);
    return pref?.value ?? defaultValue;
  }, [key, defaultValue]);

  const set = useCallback(
    (val: string) => {
      if (val) {
        return db.preferences.put({ key, value: val });
      }
      return db.preferences.delete(key);
    },
    [key],
  );

  return [value ?? defaultValue, set] as const;
}
