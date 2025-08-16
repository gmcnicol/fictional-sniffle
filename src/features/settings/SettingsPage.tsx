import { Panel } from '../../components';
import { useTheme, type Theme } from '../../theme/theme';
import { useSettings } from './SettingsContext.tsx';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
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
    </Panel>
  );
}
