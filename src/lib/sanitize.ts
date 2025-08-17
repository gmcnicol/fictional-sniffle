import DOMPurify from 'dompurify';

export function sanitize(html: string): string {
  const doc = DOMPurify.sanitize(html, { RETURN_DOM: true }) as Document;
  doc.querySelectorAll('img').forEach((img) => {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
  });
  return doc.body.innerHTML;
}
