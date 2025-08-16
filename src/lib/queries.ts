import { db } from './db.ts';

export async function getUnreadCount(feedId: number): Promise<number> {
  const articleIds = await db.articles
    .where('feedId')
    .equals(feedId)
    .primaryKeys();
  const states = await db.readState.bulkGet(articleIds);
  const readCount = states.filter((s) => s?.read).length;
  return articleIds.length - readCount;
}

let readabilityWorker: Worker | undefined;

export async function fetchReadableHtml(url: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!readabilityWorker) {
      readabilityWorker = new Worker(
        new URL('./readabilityWorker.ts', import.meta.url),
        { type: 'module' },
      );
    }

    const worker = readabilityWorker;

    const onMessage = (
      event: MessageEvent<{ html: string | null; error?: string }>,
    ) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.html);
      }
    };

    const onError = (err: ErrorEvent) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(err);
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage(url);
  });
}
