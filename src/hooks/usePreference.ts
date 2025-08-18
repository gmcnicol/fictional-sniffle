import { useCallback, useState, useEffect } from 'react';
import { db } from '../lib/db.ts';

export function usePreference(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const pref = await db.getPreference(key);
        setValue(pref?.value ?? defaultValue);
      } catch (error) {
        console.error('Failed to load preference:', key, error);
        setValue(defaultValue);
      }
    };
    
    loadValue();
  }, [key, defaultValue]);

  const set = useCallback(
    async (val: string) => {
      try {
        setValue(val);
        await db.setPreference(key, val);
      } catch (error) {
        console.error('Failed to set preference:', key, error);
        // Revert on error
        const pref = await db.getPreference(key);
        setValue(pref?.value ?? defaultValue);
      }
    },
    [key, defaultValue],
  );

  return [value, set] as const;
}