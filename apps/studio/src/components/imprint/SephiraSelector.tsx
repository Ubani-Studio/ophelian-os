'use client';

import { TreeOfLifeVisualization } from './TreeOfLifeVisualization';

// Sephira data for display
const SEPHIRA_DATA = [
  { name: 'Kether', meaning: 'Crown', pillar: 'Balance', qliphoth: 'Thaumiel' },
  { name: 'Chokmah', meaning: 'Wisdom', pillar: 'Mercy', qliphoth: 'Ghagiel' },
  { name: 'Binah', meaning: 'Understanding', pillar: 'Severity', qliphoth: 'Satariel' },
  { name: 'Chesed', meaning: 'Mercy', pillar: 'Mercy', qliphoth: 'Gamchicoth' },
  { name: 'Geburah', meaning: 'Strength', pillar: 'Severity', qliphoth: 'Golachab' },
  { name: 'Tiphareth', meaning: 'Beauty', pillar: 'Balance', qliphoth: 'Thagirion' },
  { name: 'Netzach', meaning: 'Victory', pillar: 'Mercy', qliphoth: "A'arab Zaraq" },
  { name: 'Hod', meaning: 'Splendor', pillar: 'Severity', qliphoth: 'Samael' },
  { name: 'Yesod', meaning: 'Foundation', pillar: 'Balance', qliphoth: 'Gamaliel' },
  { name: 'Malkuth', meaning: 'Kingdom', pillar: 'Balance', qliphoth: 'Lilith' },
];

const DAATH_RELATIONSHIPS = ['seeking', 'touched', 'integrated', 'avoiding'] as const;

// Pillar abbreviation for compact display
const PILLAR_LABEL: Record<string, string> = {
  Mercy: 'MCY',
  Severity: 'SVR',
  Balance: 'BAL',
};

interface SephiraSelectorProps {
  selectedSephira?: string | null;
  daathRelationship?: (typeof DAATH_RELATIONSHIPS)[number];
  suggestedSephira?: string | null;
  onSephiraChange?: (sephira: string) => void;
  onDaathRelationshipChange?: (relationship: (typeof DAATH_RELATIONSHIPS)[number]) => void;
  showQliphoth?: boolean;
  disabled?: boolean;
}

export function SephiraSelector({
  selectedSephira,
  daathRelationship = 'seeking',
  suggestedSephira,
  onSephiraChange,
  onDaathRelationshipChange,
  showQliphoth = false,
  disabled,
}: SephiraSelectorProps) {
  const selectedData = SEPHIRA_DATA.find((s) => s.name === selectedSephira);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label
        style={{
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          letterSpacing: '2px',
          textTransform: 'none',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        Kabbalistic Position
      </label>

      {suggestedSephira && suggestedSephira !== selectedSephira && (
        <div
          style={{
            padding: '0.625rem 1rem',
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>//</span>
          <span>suggested:</span>
          <strong style={{ color: '#ffffff' }}>{suggestedSephira}</strong>
          <button
            type="button"
            onClick={() => onSephiraChange?.(suggestedSephira)}
            disabled={disabled}
            style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.75rem',
              borderRadius: '2px',
              border: '1px solid rgba(255,255,255,0.3)',
              backgroundColor: 'transparent',
              color: '#ffffff',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              letterSpacing: '1px',
              textTransform: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            Apply
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        {/* Tree of Life visualization */}
        <div
          style={{
            flex: '0 0 auto',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <TreeOfLifeVisualization
            selectedSephira={selectedSephira}
            onSephiraSelect={disabled ? undefined : onSephiraChange}
            showDaath={true}
            showQliphoth={showQliphoth}
            width={300}
            height={450}
          />
        </div>

        {/* Sephira details and list */}
        <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
          {/* Selected Sephira details */}
          {selectedData && (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1rem',
              }}
            >
              <h4
                style={{
                  margin: '0 0 0.5rem',
                  fontSize: '1rem',
                  fontFamily: 'monospace',
                  color: '#ffffff',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}
              >
                {selectedData.name}
                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 8px' }}>//</span>
                <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>
                  {selectedData.meaning}
                </span>
              </h4>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '2px',
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                    letterSpacing: '1.5px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {PILLAR_LABEL[selectedData.pillar] || selectedData.pillar}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>shadow:</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{selectedData.qliphoth}</span>
              </p>
            </div>
          )}

          {/* Daath relationship */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '1rem',
            }}
          >
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: 400,
                fontFamily: 'monospace',
                letterSpacing: '1px',
                textTransform: 'none',
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Da'ath Relationship
            </label>
            <select
              value={daathRelationship}
              onChange={(e) =>
                onDaathRelationshipChange?.(e.target.value as (typeof DAATH_RELATIONSHIPS)[number])
              }
              disabled={disabled}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '2px',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='1.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '28px',
              }}
            >
              <option value="seeking">seeking // actively pursuing hidden knowledge</option>
              <option value="touched">touched // has glimpsed the abyss</option>
              <option value="integrated">integrated // has crossed and returned</option>
              <option value="avoiding">avoiding // shuns forbidden knowledge</option>
            </select>
          </div>

          {/* Quick select grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
            }}
          >
            {SEPHIRA_DATA.map((sephira) => {
              const isSelected = selectedSephira === sephira.name;
              const isSuggested = suggestedSephira === sephira.name;

              return (
                <button
                  key={sephira.name}
                  type="button"
                  onClick={() => onSephiraChange?.(sephira.name)}
                  disabled={disabled}
                  style={{
                    padding: '0.5rem 0.625rem',
                    borderRadius: '2px',
                    border: `1px solid ${
                      isSelected
                        ? 'rgba(255,255,255,0.5)'
                        : isSuggested
                          ? 'rgba(255,255,255,0.25)'
                          : 'rgba(255,255,255,0.08)'
                    }`,
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.02)',
                    color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    textAlign: 'left',
                    opacity: disabled ? 0.4 : 1,
                    borderStyle: isSuggested && !isSelected ? 'dashed' : 'solid',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <strong style={{ letterSpacing: '0.3px' }}>{sephira.name}</strong>
                  <br />
                  <span
                    style={{
                      opacity: 0.5,
                      fontSize: '0.65rem',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {sephira.meaning}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
