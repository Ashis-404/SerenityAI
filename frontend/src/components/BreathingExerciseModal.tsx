import React, { useState, useEffect } from 'react';
import { X, Heart, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  interventionId?: string;
  onComplete?: () => void;
}

export const BreathingExerciseModal: React.FC<BreathingModalProps> = ({
  isOpen,
  onClose,
  interventionId,
  onComplete
}) => {
  const [phase, setPhase] = useState<'intro' | 'active' | 'feedback' | 'finished'>('intro');
  const [breathStage, setBreathStage] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [countdown, setCountdown] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [beforeRating, setBeforeRating] = useState<number>(7);
  const [afterRating, setAfterRating] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [activeInterventionId, setActiveInterventionId] = useState<string | undefined>(interventionId);

  // Breathing 4-4-4-4 timer
  useEffect(() => {
    if (phase !== 'active') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

        // Advance stage
        if (breathStage === 'Inhale') {
          setBreathStage('Hold');
        } else if (breathStage === 'Hold') {
          setBreathStage('Exhale');
        } else if (breathStage === 'Exhale') {
          setBreathStage('Rest');
        } else if (breathStage === 'Rest') {
          setBreathStage('Inhale');
          setCyclesCompleted((c) => {
            const next = c + 1;
            if (next >= 4) {
              setPhase('feedback');
            }
            return next;
          });
        }
        return 4;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, breathStage]);

  const handleStart = async () => {
    try {
      if (!activeInterventionId) {
        const started = await api.startIntervention('breathing');
        setActiveInterventionId(started.id);
      }
      setPhase('active');
      setBreathStage('Inhale');
      setCountdown(4);
      setCyclesCompleted(0);
    } catch (e) {
      setPhase('active');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (activeInterventionId) {
      try {
        await api.submitInterventionFeedback(activeInterventionId, {
          completed: true,
          before_rating: beforeRating,
          after_rating: afterRating,
          feedback_notes: notes
        });
      } catch (e) {
        // ignore
      }
    }
    setPhase('finished');
    if (onComplete) onComplete();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        position: 'relative',
        textAlign: 'center'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {phase === 'intro' && (
          <div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(20, 184, 166, 0.15)',
              color: 'var(--accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Heart size={28} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              4-4-4-4 Box Breathing
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              A clinically-grounded, non-medical grounding technique to lower physiological tension and reset your nervous system.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                How is your stress level right now? ({beforeRating}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={beforeRating}
                onChange={(e) => setBeforeRating(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>1 - Completely Relaxed</span>
                <span>10 - Highly Stressed</span>
              </div>
            </div>

            <button onClick={handleStart} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Begin 4 Breathing Cycles
            </button>
          </div>
        )}

        {phase === 'active' && (
          <div style={{ padding: '24px 0' }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, rgba(99,102,241,0.2) 70%, transparent 100%)',
              margin: '0 auto 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(20, 184, 166, 0.4)',
              boxShadow: '0 0 40px rgba(20, 184, 166, 0.3)',
              transition: 'all 1s ease-in-out',
              transform: breathStage === 'Inhale' || breathStage === 'Hold' ? 'scale(1.25)' : 'scale(0.95)'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {breathStage}
              </span>
              <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-teal)', fontFamily: 'var(--font-heading)' }}>
                {countdown}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Cycle {cyclesCompleted + 1} of 4 • Follow the expansion and rhythm
            </p>
          </div>
        )}

        {phase === 'feedback' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Great job! How are you feeling now?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Take a moment to check in with your mind and body.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                Post-exercise Stress Level ({afterRating}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={afterRating}
                onChange={(e) => setAfterRating(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>1 - Completely Relaxed</span>
                <span>10 - Highly Stressed</span>
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Optional Reflection Notes:
              </label>
              <textarea
                placeholder="Notice any shifts in your heart rate, shoulders, or breathing..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            <button onClick={handleFeedbackSubmit} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Save Reflection & Finish
            </button>
          </div>
        )}

        {phase === 'finished' && (
          <div style={{ padding: '16px 0' }}>
            <CheckCircle2 size={48} color="var(--accent-teal)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
              Well Done
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Your before rating ({beforeRating}) to after rating ({afterRating}) has been recorded in your wellbeing log.
            </p>
            <button onClick={onClose} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Return to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
