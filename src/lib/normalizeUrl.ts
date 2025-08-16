export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = '';
    // remove trailing slash
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    // sort query params
    const params = new URLSearchParams(url.search);
    const sorted = new URLSearchParams();
    Array.from(params.keys())
      .sort()
      .forEach((key) => {
        const values = params.getAll(key);
        values.sort();
        values.forEach((v) => sorted.append(key, v));
      });
    url.search = sorted.toString() ? `?${sorted.toString()}` : '';
    return url.toString();
  } catch {
    return input;
  }
}
