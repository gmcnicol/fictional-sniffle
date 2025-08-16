import { useRef } from 'react';
import { Button, Panel } from '../../components';
import { db } from '../../lib/db.ts';
import { useTheme, type Theme } from '../../theme/theme';
import { useSettings } from './SettingsContext.tsx';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    autoMarkReadThreshold: autoThreshold,
    setAutoMarkReadThreshold: setAutoThreshold,
    syncEveryMinutes: syncMinutes,
    setSyncEveryMinutes: setSyncMinutes,
    proxyUrl,
    setProxyUrl,
    imageZoom,
    setImageZoom,
  } = useSettings();

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
  };

  const handleExport = async () => {
    const prefs = await db.preferences.toArray();
    const data = Object.fromEntries(prefs.map((p) => [p.key, p.value]));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, string>;
      const entries = Object.entries(data).map(([key, value]) => ({
        key,
        value,
      }));
      await db.preferences.clear();
      await db.preferences.bulkPut(entries);
      if (data.theme) {
        setTheme(data.theme as Theme);
      }
    } catch (err) {
      console.error('Failed to import settings', err);
    } finally {
      e.target.value = '';
    }
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
            onChange={(e) => setAutoThreshold(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Sync interval (minutes):
          <input
            type="number"
            value={syncMinutes}
            onChange={(e) => setSyncMinutes(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Proxy URL:
          <input
            type="url"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
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
            onChange={(e) => setImageZoom(e.target.value)}
          />
        </label>
      </div>
      <div>
        <Button onClick={handleExport}>Download settings</Button>
        <Button onClick={() => fileInputRef.current?.click()}>
          Upload settings
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>
    </Panel>
  );
}
