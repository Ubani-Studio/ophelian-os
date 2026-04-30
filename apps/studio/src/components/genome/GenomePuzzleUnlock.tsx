'use client';

import { useState } from 'react';
import type { CharacterImprint } from '../../lib/imprint-api';
import styles from './GenomePuzzleUnlock.module.css';

interface Riddle {
  question: string;
  answer: string;
  hint?: string;
}

function generateRiddle(genome: CharacterImprint): Riddle {
  const { orishaConfiguration, kabbalisticPosition, psychologicalState } = genome;

  // Orisha-based riddles
  const orishaRiddles: Record<string, Riddle> = {
    'Èṣù': {
      question: 'I stand at crossroads, opening paths between worlds. What sacred number do I carry?',
      answer: '3',
      hint: 'The messenger speaks in threes...',
    },
    'Ògún': {
      question: 'Iron is my domain, forging destiny with each strike. Count the days sacred to my craft.',
      answer: '7',
      hint: 'The days of labor and rest...',
    },
    'Ọ̀ṣun': {
      question: 'I flow like rivers, sweet as honey. My number is the fingers of love.',
      answer: '5',
      hint: 'One hand reaching out...',
    },
    'Yemọja': {
      question: 'Mother of waters, depth unfathomable. How many waves crash before the shore?',
      answer: '7',
      hint: 'The seven seas remember...',
    },
    'Ṣàngó': {
      question: 'Thunder roars, lightning strikes. The king counts his drums.',
      answer: '6',
      hint: 'The rhythm of royalty...',
    },
    'Ọya': {
      question: 'Nine winds I command, nine colors I wear. What number defines my power?',
      answer: '9',
      hint: 'The colors of transformation...',
    },
    'Obàtálá': {
      question: 'White cloth, pure creation. The octave completes at...',
      answer: '8',
      hint: 'The number of completion...',
    },
    'Ọ̀rúnmìlà': {
      question: 'I witnessed the choosing of fates. How many Odù contain all wisdom?',
      answer: '16',
      hint: 'The paths of divination multiply...',
    },
    'Ọ̀ṣọ́ọ̀sì': {
      question: 'Hunter of the forest, provider of bounty. My arrows count to...',
      answer: '7',
      hint: 'The lucky hunter counts...',
    },
    'Ọ̀sanyìn': {
      question: 'One-legged healer, keeper of secrets. I am alone, I am...',
      answer: '1',
      hint: 'The singular path of medicine...',
    },
  };

  // Sephira-based riddles
  const sephiraRiddles: Record<string, Riddle> = {
    'Kether': {
      question: 'I am the Crown. Above me is only the void. What am I called in Hebrew?',
      answer: 'kether',
      hint: 'The first emanation...',
    },
    'Chokmah': {
      question: 'Wisdom flows from my sphere. I am the Father. My name is...',
      answer: 'chokmah',
      hint: 'The second sephira...',
    },
    'Binah': {
      question: 'Understanding, the Great Mother. Saturn\'s throne. I am called...',
      answer: 'binah',
      hint: 'The third emanation...',
    },
  };

  // Try Orisha riddle first
  const orishaRiddle = orishaRiddles[orishaConfiguration.headOrisha];
  if (orishaRiddle) {
    return orishaRiddle;
  }

  // Fallback to Sephira riddle
  const sephiraRiddle = sephiraRiddles[kabbalisticPosition.primarySephira];
  if (sephiraRiddle) {
    return sephiraRiddle;
  }

  // Ultimate fallback based on trajectory
  const trajectoryRiddles: Record<string, Riddle> = {
    'emergence': {
      question: 'From darkness I rise, breaking through the surface. My path is called...',
      answer: 'emergence',
      hint: 'The journey begins...',
    },
    'transcendence': {
      question: 'Beyond all limits, I ascend. My trajectory is...',
      answer: 'transcendence',
      hint: 'The highest path...',
    },
  };

  return trajectoryRiddles[psychologicalState.trajectory] || {
    question: 'Speak the name of the primary Sephira to unlock.',
    answer: kabbalisticPosition.primarySephira.toLowerCase(),
    hint: 'Look to the Tree of Life...',
  };
}

interface GenomePuzzleUnlockProps {
  genome: CharacterImprint;
  onUnlock: () => void;
  isUnlocked: boolean;
}

export function GenomePuzzleUnlock({ genome, onUnlock, isUnlocked }: GenomePuzzleUnlockProps) {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  const riddle = generateRiddle(genome);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedCorrect = riddle.answer.toLowerCase();

    if (normalizedAnswer === normalizedCorrect) {
      setError('');
      onUnlock();
    } else {
      setAttempts(prev => prev + 1);
      setError('Incorrect. The mysteries remain hidden.');
      setAnswer('');

      // Show hint after 2 failed attempts
      if (attempts >= 1) {
        setShowHint(true);
      }
    }
  };

  if (isUnlocked) {
    return (
      <div
        className={styles.unlockedState}
        style={{
          padding: '1rem',
          backgroundColor: '#000000',
          border: '1px solid var(--border)',
          borderRadius: '0',
          marginBottom: '1rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--muted-foreground)',
        }}
      >
        <span style={{ opacity: 0.7 }}>The mysteries have been unveiled</span>
      </div>
    );
  }

  return (
    <div
      className={styles.puzzleContainer}
      style={{
        padding: '1.5rem',
        backgroundColor: '#000000',
        border: '1px solid var(--border)',
        borderRadius: '0',
        marginBottom: '1rem',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            textTransform: 'none',
            letterSpacing: '0.1em',
            color: 'var(--muted-foreground)',
            marginBottom: '0.5rem',
          }}
        >
          Sacred Knowledge Locked
        </div>
        <div
          className={styles.riddleText}
          style={{
            fontSize: '1rem',
            fontStyle: 'italic',
            lineHeight: '1.6',
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}
        >
          "{riddle.question}"
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Speak your answer..."
            className={styles.inputField}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0',
              border: `1px solid ${error ? 'var(--destructive)' : 'var(--border)'}`,
              backgroundColor: '#000000',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
            autoComplete="off"
          />
        </div>

        {error && (
          <div
            className={styles.errorMessage}
            style={{
              padding: '0.5rem',
              backgroundColor: 'var(--destructive)',
              color: 'white',
              borderRadius: '0',
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
              opacity: 0.9,
            }}
          >
            {error}
          </div>
        )}

        {showHint && riddle.hint && (
          <div
            className={styles.hintBox}
            style={{
              padding: '0.75rem',
              backgroundColor: '#000000',
              borderRadius: '0',
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
              fontStyle: 'italic',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--foreground)',
            }}
          >
            <div style={{ fontSize: '0.65rem', textTransform: 'none', letterSpacing: '0.1em', marginBottom: '0.25rem', opacity: 0.7 }}>
              Hint
            </div>
            <div>{riddle.hint}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            className={styles.submitButton}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              borderRadius: '0',
              border: '1px solid var(--foreground)',
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'none',
              letterSpacing: '0.05em',
            }}
          >
            Unlock Mysteries
          </button>

          {!showHint && attempts > 0 && (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0',
                border: '1px solid var(--border)',
                backgroundColor: '#000000',
                color: 'var(--foreground)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.05em',
              }}
            >
              Seek Hint
            </button>
          )}
        </div>
      </form>

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.7rem',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
          opacity: 0.6,
        }}
      >
        The gateway hints above may guide you to the answer...
      </div>
    </div>
  );
}
