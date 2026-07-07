/**
 * Ibis corpus bridge — Layer 1 of the three-layer training corpus.
 *
 * Pulls documents authored by a given user (the character's primary author)
 * from Ibis's local data store and slices them into voice samples suitable
 * for few-shot prompting in the tick LLM.
 *
 * Without this, characters speak in the LLM's house register rather than
 * the actual register of the human author. With this, every prompt carries
 * 5-12 real samples of how the author actually writes.
 *
 * Reads from the filesystem (no Ibis HTTP API required). Same pattern as
 * ibis-slang.ts.
 *
 * Future: when collaborators are wired in (Layer 2) this same shape works
 * with multiple author IDs blended by weight.
 */

import { readFileSync, statSync } from 'fs';

const IBIS_STORE_PATH =
  process.env.IBIS_STORE_PATH ||
  '/home/sphinxy/Ibis/data/vaulted-ink.json';

interface IbisDocument {
  id: string;
  projectId?: string;
  userId: string;
  title: string;
  kind?: string | null;
  content?: string;
  plainText?: string;
  excerpt?: string;
  tagIds?: string[];
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
  source?: string;
  intent?: string;
}

interface IbisStore {
  users?: unknown[];
  documents?: IbisDocument[];
  tags?: { id: string; name?: string; userId?: string }[];
  projects?: { id: string; userId?: string; tags?: string[] }[];
}

interface CacheEntry {
  store: IbisStore;
  loadedAt: number;
  mtime: number;
}

let cache: CacheEntry | null = null;

function loadStore(): IbisStore | null {
  try {
    const stat = statSync(IBIS_STORE_PATH);
    if (cache && cache.mtime === stat.mtimeMs) return cache.store;
    const raw = readFileSync(IBIS_STORE_PATH, 'utf-8');
    const store = JSON.parse(raw) as IbisStore;
    cache = { store, loadedAt: Date.now(), mtime: stat.mtimeMs };
    return store;
  } catch (e) {
    console.warn('[ibis-corpus] Could not load Ibis store:', (e as Error).message);
    return null;
  }
}

export interface CorpusOptions {
  /** Match docs by Ibis user id. If omitted, matches all users (use with caution). */
  authorIbisUserId?: string;
  /** Optional tag filter — only docs with at least one of these tag IDs. */
  tagIds?: string[];
  /** Optional title substring filter (case-insensitive). */
  titleContains?: string;
  /** How many samples to return. Default 8. Range 1-20. */
  maxSamples?: number;
  /** Min word count per doc to be eligible. Default 30. */
  minWordCount?: number;
  /** Max chars per sample (excerpt cropped). Default 800. */
  maxCharsPerSample?: number;
}

export interface CorpusSample {
  ibisDocumentId: string;
  title: string;
  text: string;
  wordCount: number;
  updatedAt?: string;
  kind?: string | null;
}

export interface CorpusRefreshResult {
  source: 'ibis_filesystem';
  storePath: string;
  totalDocsScanned: number;
  matchedDocs: number;
  samplesReturned: CorpusSample[];
  filterSummary: {
    authorIbisUserId?: string;
    tagIds?: string[];
    titleContains?: string;
    minWordCount: number;
    maxSamples: number;
  };
  warnings: string[];
}

/**
 * Pull voice samples from Ibis for a given author. Returns recent
 * eligible documents formatted as few-shot samples.
 */
export function pullCorpusFromIbis(opts: CorpusOptions = {}): CorpusRefreshResult {
  const maxSamples = Math.max(1, Math.min(20, opts.maxSamples ?? 8));
  const minWordCount = Math.max(0, opts.minWordCount ?? 30);
  const maxCharsPerSample = Math.max(120, opts.maxCharsPerSample ?? 800);

  const warnings: string[] = [];
  const store = loadStore();
  if (!store) {
    warnings.push('Ibis store not loadable; returning empty corpus.');
    return {
      source: 'ibis_filesystem',
      storePath: IBIS_STORE_PATH,
      totalDocsScanned: 0,
      matchedDocs: 0,
      samplesReturned: [],
      filterSummary: {
        authorIbisUserId: opts.authorIbisUserId,
        tagIds: opts.tagIds,
        titleContains: opts.titleContains,
        minWordCount,
        maxSamples,
      },
      warnings,
    };
  }

  const docs = store.documents ?? [];
  const titleMatch = opts.titleContains?.toLowerCase();

  const eligible = docs.filter((d) => {
    if (opts.authorIbisUserId && d.userId !== opts.authorIbisUserId) return false;
    if (opts.tagIds && opts.tagIds.length > 0) {
      const hasTag = (d.tagIds ?? []).some((t) => opts.tagIds!.includes(t));
      if (!hasTag) return false;
    }
    if (titleMatch && !d.title.toLowerCase().includes(titleMatch)) return false;
    if ((d.wordCount ?? 0) < minWordCount) return false;
    const text = pickText(d);
    if (!text) return false;
    return true;
  });

  // Sort by updatedAt descending (most recent first).
  eligible.sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt ?? '';
    const bt = b.updatedAt ?? b.createdAt ?? '';
    return bt.localeCompare(at);
  });

  const picked = eligible.slice(0, maxSamples);
  const samples: CorpusSample[] = picked.map((d) => ({
    ibisDocumentId: d.id,
    title: d.title,
    text: cropText(pickText(d)!, maxCharsPerSample),
    wordCount: d.wordCount ?? 0,
    updatedAt: d.updatedAt ?? d.createdAt,
    kind: d.kind ?? null,
  }));

  if (eligible.length === 0) {
    warnings.push(
      `No Ibis documents matched filter (author=${opts.authorIbisUserId ?? 'any'}, tags=${(opts.tagIds ?? []).join(',') || 'none'}, title~="${opts.titleContains ?? ''}").`,
    );
  }

  return {
    source: 'ibis_filesystem',
    storePath: IBIS_STORE_PATH,
    totalDocsScanned: docs.length,
    matchedDocs: eligible.length,
    samplesReturned: samples,
    filterSummary: {
      authorIbisUserId: opts.authorIbisUserId,
      tagIds: opts.tagIds,
      titleContains: opts.titleContains,
      minWordCount,
      maxSamples,
    },
    warnings,
  };
}

function pickText(doc: IbisDocument): string | null {
  const candidate = doc.plainText || doc.content || doc.excerpt || '';
  if (!candidate) return null;
  // Strip basic markdown / html tags for cleaner few-shot text.
  return candidate
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cropText(text: string, max: number): string {
  if (text.length <= max) return text;
  // Crop on a paragraph or sentence boundary if possible.
  const window = text.slice(0, max);
  const lastPara = window.lastIndexOf('\n\n');
  if (lastPara > max * 0.5) return window.slice(0, lastPara).trim();
  const lastSent = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  );
  if (lastSent > max * 0.6) return window.slice(0, lastSent + 1).trim();
  return window.trim() + '…';
}
