import { useEffect, useState } from 'react';
import { Panel } from '../../components';
import { settingsRepo } from '../../lib/repositories';
import { useTheme, type Theme } from '../../theme/theme';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [autoThreshold, setAutoThreshold] = useState('60');
  const [syncMinutes, setSyncMinutes] = useState('30');
  const [proxyUrl, setProxyUrl] = useState('');
  const [imageZoom, setImageZoom] = useState('1');

  useEffect(() => {
    const load = async () => {
      const [t, s, p, z] = await Promise.all([
        settingsRepo.get('autoMarkReadThreshold'),
        settingsRepo.get('syncEveryMinutes'),
        settingsRepo.get('proxyUrl'),
        settingsRepo.get('imageZoom'),
      ]);
      if (t) setAutoThreshold(t.value);
      if (s) setSyncMinutes(s.value);
      if (p) setProxyUrl(p.value);
      if (z) setImageZoom(z.value);
    };
    load();
  }, []);

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
  };

  const handleThresholdChange = async (value: string) => {
    setAutoThreshold(value);
    await settingsRepo.set('autoMarkReadThreshold', value);
  };

  const handleSyncChange = async (value: string) => {
    setSyncMinutes(value);
    await settingsRepo.set('syncEveryMinutes', value);
  };

  const handleProxyChange = async (value: string) => {
    setProxyUrl(value);
    if (value) {
      await settingsRepo.set('proxyUrl', value);
    } else {
      await settingsRepo.remove('proxyUrl');
    }
  };

  const handleImageZoomChange = async (value: string) => {
    setImageZoom(value);
    await settingsRepo.set('imageZoom', value);
  };

  return (
    <Panel>
      <h1>Settings</h1>
      <div>
        <label>
          Theme:
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as Theme)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Auto mark-read threshold (%):
          <input
            type="number"
            value={autoThreshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Sync interval (minutes):
          <input
            type="number"
            value={syncMinutes}
            onChange={(e) => handleSyncChange(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Proxy URL:
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => handleProxyChange(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Image zoom (1 = 100%):
          <input
            type="number"
            step="0.1"
            value={imageZoom}
            onChange={(e) => handleImageZoomChange(e.target.value)}
          />
        </label>
      </div>
    </Panel>
  );
}
