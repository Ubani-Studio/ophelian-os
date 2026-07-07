'use client';

/**
 * VaultedBridgePanel · the licensing bridge tile.
 *
 * Shows whether this character is registered as a Vaulted LoraArtifact
 * (the canonical rights / inference / billing engine underneath
 * Boveda + Sembla). Lets you register, sync status, see last error.
 *
 * Without registration the character is a creative artifact; with
 * registration it is a licensable asset that brand pilots can rent
 * via Vaulted's LicenseRequest engine. This panel is the bridge.
 */

import { useEffect, useState } from 'react';
import {
  getVaultedStatus,
  registerVaultedArtifact,
  syncVaultedStatus,
  type Character,
  type VaultedStatusRow,
} from '@/lib/api';

const TYRIAN = '#66023C';
const INK = '#0E0E0F';

const STATUS_COLOR: Record<string, string> = {
  not_registered: '#888',
  pending_registration: '#ddaa44',
  registered: '#7ab97a',
  listed: '#5fb1c5',
  licensed: '#c5a35f',
  error: '#aa4444',
};

const STATUS_LABEL: Record<string, string> = {
  not_registered: 'Not registered',
  pending_registration: 'Pending (Vaulted offline)',
  registered: 'Registered',
  listed: 'Listed in marketplace',
  licensed: 'Licensed (active deal)',
  error: 'Error',
};

export function VaultedBridgePanel({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<VaultedStatusRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // registration form
  const [weightsUri, setWeightsUri] = useState('');
  const [weightsHash, setWeightsHash] = useState('');
  const [triggerWord, setTriggerWord] = useState(character.name?.toLowerCase() ?? '');
  const [trainingSteps, setTrainingSteps] = useState(0);
  const [artifactKind, setArtifactKind] = useState<'character' | 'persona' | 'style'>('character');

  useEffect(() => {
    if (!open || status) return;
    void load();
  }, [open]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStatus(await getVaultedStatus(character.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    if (!weightsUri || !weightsHash) {
      setError('weightsStorageUri + weightsSha256 are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerVaultedArtifact(character.id, {
        weightsStorageUri: weightsUri,
        weightsSha256: weightsHash,
        artifactKind,
        triggerWord,
        trainingSteps: Number(trainingSteps) || 0,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function sync() {
    setLoading(true);
    setError(null);
    try {
      await syncVaultedStatus(character.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  const s = status?.vaultedStatus ?? 'not_registered';
  const dot = STATUS_COLOR[s] ?? '#888';
  const label = STATUS_LABEL[s] ?? s;

  return (
    <div
      style={{
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 0,
        marginTop: 12,
        background: '#0a0a0a',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'transparent',
          color: 'var(--foreground)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 12,
          letterSpacing: 0.3,
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 0,
            background: dot,
            display: 'inline-block',
          }}
        />
        <span style={{ flex: 1 }}>Licensing rail</span>
        <span style={{ color: TYRIAN, fontSize: 11, opacity: 0.7 }}>
          {label} {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', color: '#d8d8d8', fontSize: 13, lineHeight: 1.5 }}>
          <p style={{ opacity: 0.55, fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
            Registers this character as a licensable LoRA artifact in Vaulted,
            the rights infrastructure underneath Sembla. Without registration,
            no brand pilot can license the character.
          </p>

          {error && (
            <div
              style={{
                padding: 8,
                marginBottom: 12,
                background: '#33000088',
                border: '1px solid #aa0000',
                borderRadius: 0,
                color: '#ffaaaa',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {status && (
            <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.85 }}>
              <div>
                <strong style={{ color: dot }}>{label}</strong>
                {status.vaultedArtifactId && (
                  <span style={{ opacity: 0.6 }}> · artifact id {status.vaultedArtifactId}</span>
                )}
              </div>
              {status.vaultedRegisteredAt && (
                <div style={{ opacity: 0.55, fontSize: 11 }}>
                  registered {new Date(status.vaultedRegisteredAt).toLocaleString()}
                </div>
              )}
              {status.vaultedLastSyncedAt && (
                <div style={{ opacity: 0.55, fontSize: 11 }}>
                  last sync {new Date(status.vaultedLastSyncedAt).toLocaleString()}
                </div>
              )}
              {status.vaultedLastError && (
                <div
                  style={{
                    marginTop: 6,
                    padding: 6,
                    background: '#1a0606',
                    border: '1px solid #552222',
                    borderRadius: 0,
                    color: '#dd9999',
                    fontSize: 11,
                  }}
                >
                  last error: {status.vaultedLastError}
                </div>
              )}
            </div>
          )}

          {/* Registration form */}
          {(s === 'not_registered' || s === 'pending_registration' || s === 'error') && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
              <label style={{ fontSize: 11 }}>
                <div style={{ opacity: 0.7, marginBottom: 4 }}>
                  Weights storage URI (vault-internal, never exposed)
                </div>
                <input
                  type="text"
                  value={weightsUri}
                  onChange={(e) => setWeightsUri(e.target.value)}
                  placeholder="s3://rightslayer-vault/loras/ubani-v2.safetensors"
                  style={inputStyle}
                />
              </label>
              <label style={{ fontSize: 11 }}>
                <div style={{ opacity: 0.7, marginBottom: 4 }}>SHA-256 of the .safetensors</div>
                <input
                  type="text"
                  value={weightsHash}
                  onChange={(e) => setWeightsHash(e.target.value)}
                  placeholder="abc123def456..."
                  style={inputStyle}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <label style={{ fontSize: 11 }}>
                  <div style={{ opacity: 0.7, marginBottom: 4 }}>Kind</div>
                  <select
                    value={artifactKind}
                    onChange={(e) => setArtifactKind(e.target.value as 'character' | 'persona' | 'style')}
                    style={inputStyle}
                  >
                    <option value="character">character</option>
                    <option value="persona">persona</option>
                    <option value="style">style</option>
                  </select>
                </label>
                <label style={{ fontSize: 11 }}>
                  <div style={{ opacity: 0.7, marginBottom: 4 }}>Trigger word</div>
                  <input
                    type="text"
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    style={inputStyle}
                  />
                </label>
                <label style={{ fontSize: 11 }}>
                  <div style={{ opacity: 0.7, marginBottom: 4 }}>Training steps</div>
                  <input
                    type="number"
                    value={trainingSteps}
                    onChange={(e) => setTrainingSteps(Number(e.target.value))}
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {(s === 'not_registered' || s === 'error') && (
              <button onClick={register} disabled={loading} style={btnPrimary}>
                Register as licensable artifact
              </button>
            )}
            {s === 'pending_registration' && (
              <button onClick={register} disabled={loading} style={btnPrimary}>
                Retry registration
              </button>
            )}
            {(s === 'registered' || s === 'listed' || s === 'licensed') && (
              <button onClick={sync} disabled={loading} style={btnPrimary}>
                Sync status from Vaulted
              </button>
            )}
            <button onClick={load} disabled={loading} style={btnGhost}>
              Refresh
            </button>
          </div>

          {s === 'pending_registration' && (
            <div style={{ marginTop: 12, fontSize: 11, opacity: 0.55, lineHeight: 1.5 }}>
              Vaulted is offline. The registration is queued. When Vaulted comes back,
              click Retry. The character page keeps working in the meantime.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: INK,
  color: '#e8e8e8',
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 0,
  fontSize: 12,
  fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 12px',
  background: TYRIAN,
  color: '#fff',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: 0.3,
};

const btnGhost: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent',
  color: TYRIAN,
  border: `1px solid rgba(255,255,255,0.08)`,
};
