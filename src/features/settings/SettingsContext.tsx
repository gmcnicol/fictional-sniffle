/* eslint react-refresh/only-export-components: off */
import { createContext, useContext, type ReactNode } from 'react';
import { usePreference } from '../../hooks/usePreference.ts';
import { DEFAULT_PROXY } from '../../lib/fetcher.ts';

interface SettingsContextValue {
  autoMarkReadThreshold: string;
  setAutoMarkReadThreshold: (v: string) => Promise<unknown>;
  syncEveryMinutes: string;
  setSyncEveryMinutes: (v: string) => Promise<unknown>;
  proxyUrl: string;
  setProxyUrl: (v: string) => Promise<unknown>;
  imageZoom: string;
  setImageZoom: (v: string) => Promise<unknown>;
}

const SettingsContext = createContext<SettingsContextValue>({
  autoMarkReadThreshold: '60',
  setAutoMarkReadThreshold: async () => {},
  syncEveryMinutes: '30',
  setSyncEveryMinutes: async () => {},
  proxyUrl: DEFAULT_PROXY,
  setProxyUrl: async () => {},
  imageZoom: '1',
  setImageZoom: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [autoMarkReadThreshold, setAutoMarkReadThreshold] = usePreference(
    'autoMarkReadThreshold',
    '60',
  );
  const [syncEveryMinutes, setSyncEveryMinutes] = usePreference(
    'syncEveryMinutes',
    '30',
  );
  const [proxyUrl, setProxyUrl] = usePreference('proxyUrl', DEFAULT_PROXY);
  const [imageZoom, setImageZoom] = usePreference('imageZoom', '1');

  return (
    <SettingsContext.Provider
      value={{
        autoMarkReadThreshold,
        setAutoMarkReadThreshold,
        syncEveryMinutes,
        setSyncEveryMinutes,
        proxyUrl,
        setProxyUrl,
        imageZoom,
        setImageZoom,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
