import { Model } from 'mongoose';

/**
 * Human-friendly sequential reference like SR-1001 / JOB-1001. Based on the
 * current document count — fine for a demo dataset; the unique index on
 * `code` is the real guard against the rare concurrent collision.
 */
export async function nextCode(prefix: string, model: Model<any>): Promise<string> {
  const n = await model.estimatedDocumentCount();
  return `${prefix}-${1001 + n}`;
}
