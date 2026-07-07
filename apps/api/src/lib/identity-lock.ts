/**
 * Identity-lock helpers. Reads Character.identity envelope and
 * exposes whether a given field is locked from automated overwrites.
 *
 * Manual user-driven PATCH always wins (bypasses lock). Locks only
 * apply to automated paths: sync-oripheon-all, bulk-import-ikenga
 * stub-rewrite, reconcile-bio-names, single-character oripheon
 * sync. Each of those calls isFieldLocked() before overwriting.
 *
 * Schema: Character.identity is JSON; envelope shape matches
 * docs/identity-lock-and-starforge.md and docs/sovereignty.md.
 */

export type LockableField =
  | 'name'
  | 'bio'
  | 'systemPrompt'
  | 'avatarUrl'
  | 'personaTags'
  | 'aliases'
  | 'subtasteCode'
  | 'goals'
  | 'currentArc';

export interface CharacterIdentityEnvelope {
  locked?: LockableField[];
  pinned?: Record<string, string | undefined>;
  source?: 'sandbox' | 'starforge_nommo' | 'tizita_persona' | 'authored';
  realIdentityRef?: { starforgeUserId?: string; email?: string };
  sovereignty?: {
    level?: 0 | 1 | 2;
    base_model?: string;
    inference_path?: string;
    refuses?: string[];
  };
}

export function readIdentity(raw: unknown): CharacterIdentityEnvelope {
  if (!raw || typeof raw !== 'object') return {};
  return raw as CharacterIdentityEnvelope;
}

export function isFieldLocked(identity: unknown, field: LockableField): boolean {
  const envelope = readIdentity(identity);
  if (!envelope.locked || !Array.isArray(envelope.locked)) return false;
  return envelope.locked.includes(field);
}

/**
 * Filter an update payload so locked fields are dropped before the
 * automated sync writes them. Logs which fields were skipped via the
 * second return value so callers can tell the user "we left X alone
 * because it's locked."
 */
export function filterLockedUpdates<T extends Partial<Record<LockableField, unknown>>>(
  identity: unknown,
  updates: T
): { updates: T; skipped: LockableField[] } {
  const envelope = readIdentity(identity);
  const locked = new Set(envelope.locked ?? []);
  if (locked.size === 0) return { updates, skipped: [] };

  const skipped: LockableField[] = [];
  const filtered = { ...updates };
  for (const key of Object.keys(updates) as LockableField[]) {
    if (locked.has(key)) {
      delete filtered[key];
      skipped.push(key);
    }
  }
  return { updates: filtered, skipped };
}
