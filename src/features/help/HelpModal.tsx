import { Button } from '../../components';
import './HelpModal.css';

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="help-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div className="help-modal">
        <h2 id="help-title">Help</h2>
        <section>
          <h3>Keyboard shortcuts</h3>
          <ul>
            <li>
              <kbd>j</kbd>/<kbd>k</kbd> — next/previous article
            </li>
            <li>
              <kbd>u</kbd> — toggle unread
            </li>
            <li>
              <kbd>o</kbd> — open original
            </li>
            <li>
              <kbd>g</kbd> — go to feed list
            </li>
            <li>
              <kbd>/</kbd> — search
            </li>
          </ul>
        </section>
        <section>
          <h3>Import/Export</h3>
          <p>Use Settings to import or export OPML and app settings.</p>
        </section>
        <section>
          <h3>Proxy note</h3>
          <p>
            Some feeds require a CORS proxy. Configure one in Settings if
            needed.
          </p>
        </section>
        <Button onClick={onClose} style={{ marginTop: '1rem' }}>
          Close
        </Button>
      </div>
    </div>
  );
}
