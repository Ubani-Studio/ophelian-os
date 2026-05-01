'use client';

/**
 * Story Template detail · luxury redesign.
 *
 * Typography:
 *   H1 only Canela, all other headers Söhne (system fallback).
 *   Sentence case throughout. No em dashes.
 *
 * Aesthetic:
 *   Sharp edges, hairline dividers, monospace small caps for
 *   metadata labels, tyrian accent (#66023C) for active / canonical
 *   states. No gradients, no rounded pills, no toy-shaped UI.
 *
 * Behaviour:
 *   When a Cube is provided via cubeContext, the panel surfaces an
 *   "apply to {cube}" action that pins the trajectory on the World
 *   record. When already pinned, surface a "pinned" state with
 *   unpin action.
 */

import { useState } from 'react';
import {
  StoryTemplate,
  getCompatibleTemplates,
  getShadowTemplate,
} from '@/lib/story-templates';
import { updateWorld, type World } from '@/lib/api';

const TYRIAN = '#66023C';

interface CubeContext {
  id: string;
  name: string;
  trajectoryId?: string | null;
  trajectoryVariant?: string | null;
  onChanged?: (next: World) => void;
}

interface StoryTemplateDetailProps {
  template: StoryTemplate;
  onClose?: () => void;
  onApply?: (config: { primary: string; secondary?: string; shadow?: string }) => void;
  onTemplateClick?: (templateId: string) => void;
  cubeContext?: CubeContext;
}

export function StoryTemplateDetail({
  template,
  onApply,
  onTemplateClick,
  cubeContext,
}: StoryTemplateDetailProps) {
  const [pinning, setPinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compatibleTemplates = getCompatibleTemplates(template.id);
  const shadowTemplate = getShadowTemplate(template.id);
  const isPinnedToCube = cubeContext?.trajectoryId === template.id;

  const handlePin = async () => {
    if (!cubeContext) {
      onApply?.({ primary: template.id, shadow: template.shadowType });
      return;
    }
    setPinning(true);
    setError(null);
    try {
      const updated = await updateWorld(cubeContext.id, {
        trajectoryId: template.id,
        trajectoryVariant: null,
      });
      cubeContext.onChanged?.(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pin trajectory');
    } finally {
      setPinning(false);
    }
  };

  const handleUnpin = async () => {
    if (!cubeContext) return;
    setPinning(true);
    setError(null);
    try {
      const updated = await updateWorld(cubeContext.id, {
        trajectoryId: null,
        trajectoryVariant: null,
      });
      cubeContext.onChanged?.(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unpin');
    } finally {
      setPinning(false);
    }
  };

  return (
    <div
      style={{
        background: 'transparent',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-ui), system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header · H1 Canela, sub Söhne metadata */}
      <header style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <h1
          style={{
            fontFamily: '"Canela", serif',
            fontWeight: 300,
            fontSize: '2.4rem',
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {template.name}
        </h1>

        <div
          style={{
            marginTop: '0.6rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.85rem',
            alignItems: 'baseline',
          }}
        >
          <Meta label="Temperature" value={template.temperature} />
          <Meta label="Energy" value={template.primaryEnergy} />
          <Meta label="Motion" value={template.motion.toLowerCase()} />
        </div>

        <p
          style={{
            marginTop: '1rem',
            fontFamily: '"Canela", serif',
            fontStyle: 'italic',
            fontSize: '1rem',
            lineHeight: 1.55,
            color: 'var(--muted-foreground)',
            maxWidth: '60ch',
          }}
        >
          {template.question}
        </p>
      </header>

      {/* Description · body Söhne */}
      <section style={sectionStyle}>
        <SubHeader>The arc</SubHeader>
        <p style={bodyStyle}>{template.description}</p>
      </section>

      {/* Phases · the five-phase progression */}
      <section style={sectionStyle}>
        <SubHeader>Phases</SubHeader>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {template.phases.map((phase) => (
            <li
              key={phase.order}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr',
                gap: '0.85rem',
                padding: '0.7rem 0',
                borderBottom: '1px solid var(--border)',
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  color: TYRIAN,
                  paddingTop: '0.2rem',
                }}
              >
                0{phase.order}
              </span>
              <div>
                <div style={{ fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '0.2rem' }}>
                  {phase.name}
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.55, color: 'var(--muted-foreground)' }}>
                  {phase.description}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Compatible secondaries */}
      {compatibleTemplates.length > 0 && (
        <section style={sectionStyle}>
          <SubHeader>Stacks well with</SubHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {compatibleTemplates.map((c) => (
              <RelationLink key={c.id} label={c.name} onClick={() => onTemplateClick?.(c.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Shadow */}
      {shadowTemplate && (
        <section style={sectionStyle}>
          <SubHeader>Shadow</SubHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.6rem',
              flexWrap: 'wrap',
            }}
          >
            <RelationLink
              label={shadowTemplate.name}
              onClick={() => onTemplateClick?.(shadowTemplate.id)}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', lineHeight: 1.55 }}>
              The structural opposite. Stacking these creates dramatic friction.
            </span>
          </div>
        </section>
      )}

      {/* Ancient sources */}
      {template.ancientSources.length > 0 && (
        <section style={sectionStyle}>
          <SubHeader>Ancient sources</SubHeader>
          <ul style={listStyle}>
            {template.ancientSources.map((s) => (
              <li key={s} style={listItemStyle}>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Modern examples */}
      {template.modernExamples.length > 0 && (
        <section style={sectionStyle}>
          <SubHeader>Modern examples</SubHeader>
          <ul style={listStyle}>
            {template.modernExamples.map((s) => (
              <li key={s} style={listItemStyle}>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Apply to cube */}
      {cubeContext && (
        <section style={{ ...sectionStyle, paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          {error && (
            <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginBottom: '0.5rem' }}>
              {error}
            </div>
          )}
          {isPinnedToCube ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.22em',
                  color: TYRIAN,
                  textTransform: 'lowercase',
                }}
              >
                pinned to {cubeContext.name}
              </span>
              <button
                type="button"
                onClick={handleUnpin}
                disabled={pinning}
                style={ghostButtonStyle(pinning)}
              >
                {pinning ? 'unpinning.' : 'unpin'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handlePin}
                disabled={pinning}
                style={primaryButtonStyle(pinning)}
              >
                {pinning ? 'pinning.' : `pin to ${cubeContext.name.toLowerCase()}`}
              </button>
              {cubeContext.trajectoryId && (
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                  Currently pinned to{' '}
                  <em style={{ color: 'var(--foreground)' }}>{cubeContext.trajectoryId}</em>.
                  Pinning replaces.
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* When no cube context, fall back to onApply hook (legacy
          callers, e.g. /story-templates standalone page). */}
      {!cubeContext && onApply && (
        <section style={{ ...sectionStyle, paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => onApply({ primary: template.id, shadow: template.shadowType })}
            style={primaryButtonStyle(false)}
          >
            apply this trajectory
          </button>
        </section>
      )}
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  paddingTop: '1.1rem',
  paddingBottom: '0.4rem',
};

const bodyStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  lineHeight: 1.65,
  color: 'var(--foreground)',
  margin: 0,
  maxWidth: '64ch',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const listItemStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  lineHeight: 1.55,
  color: 'var(--muted-foreground)',
  paddingLeft: '1rem',
  position: 'relative',
};

function SubHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-ui), system-ui, sans-serif',
        fontWeight: 600,
        fontSize: '0.55rem',
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: 'var(--muted-foreground)',
        margin: '0 0 0.5rem 0',
      }}
    >
      {children}
    </h2>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.35rem',
        fontSize: '0.65rem',
        fontFamily: 'monospace',
        letterSpacing: '0.16em',
        textTransform: 'lowercase',
        color: 'var(--muted-foreground)',
      }}
    >
      <span style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>{label.toLowerCase()}</span>
      <span style={{ color: 'var(--foreground)' }}>{value}</span>
    </span>
  );
}

function RelationLink({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.3rem 0.75rem',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--foreground)',
        fontSize: '0.78rem',
        fontFamily: 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 0,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = TYRIAN)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {label}
    </button>
  );
}

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '0.5rem 1.1rem',
    border: `1px solid ${TYRIAN}`,
    background: TYRIAN,
    color: '#fff',
    fontSize: '0.65rem',
    fontFamily: 'monospace',
    letterSpacing: '0.22em',
    textTransform: 'lowercase',
    cursor: disabled ? 'wait' : 'pointer',
    borderRadius: 0,
    opacity: disabled ? 0.6 : 1,
  };
}

function ghostButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '0.4rem 0.85rem',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--muted-foreground)',
    fontSize: '0.6rem',
    fontFamily: 'monospace',
    letterSpacing: '0.2em',
    textTransform: 'lowercase',
    cursor: disabled ? 'wait' : 'pointer',
    borderRadius: 0,
  };
}
