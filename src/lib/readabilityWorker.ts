import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import createDOMPurify from 'dompurify';

self.onmessage = async (event: MessageEvent<string>) => {
  try {
    const url = event.data;
    const res = await fetch(url);
    const html = await res.text();
    const { document, window } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();

    if (article?.content) {
      const DOMPurify = createDOMPurify(window as unknown as Window);
      const clean = DOMPurify.sanitize(article.content);
      self.postMessage({ html: clean });
    } else {
      self.postMessage({ html: null });
    }
  } catch (err) {
    self.postMessage({ html: null, error: (err as Error).message });
  }
};

export {};
