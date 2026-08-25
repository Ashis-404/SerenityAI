import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    if (phase !== 'active') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) return prev - 1;

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
      } catch (e) { /* ignore */ }
    }
    setPhase('finished');
    if (onComplete) onComplete();
  };

  if (!isOpen) return null;

  const isExpanded = breathStage === 'Inhale' || breathStage === 'Hold';

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-panel"
        style={{ textAlign: 'center' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <button onClick={onClose} className="modal-close">
          <X size={18} />
        </button>

        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--accent-glow)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Heart size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                4-4-4-4 Box Breathing
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                A grounding technique to lower physiological tension and reset your nervous system.
              </p>

              <div style={{ textAlign: 'left', marginBottom: 24, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <label className="input-label" style={{ marginBottom: 8 }}>
                  Current stress level ({beforeRating}/10)
                </label>
                <input
                  type="range" min="1" max="10"
                  value={beforeRating}
                  onChange={(e) => setBeforeRating(Number(e.target.value))}
                  className="stress-slider"
                />
                <div className="stress-labels">
                  <span>Relaxed</span><span>Highly Stressed</span>
                </div>
              </div>

              <button onClick={handleStart} className="btn btn-primary btn-full">
                Begin 4 Breathing Cycles
              </button>
            </motion.div>
          )}

          {phase === 'active' && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '24px 0' }}
            >
              <div className={`breathing-orb ${isExpanded ? 'expanded' : 'contracted'}`}>
                <span className="breathing-stage">{breathStage}</span>
                <span className="breathing-count">{countdown}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Cycle {cyclesCompleted + 1} of 4
              </p>
            </motion.div>
          )}

          {phase === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                How are you feeling now?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                Take a moment to check in with your body.
              </p>

              <div style={{ textAlign: 'left', marginBottom: 20, background: 'var(--bg-secondary)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                <label className="input-label" style={{ marginBottom: 8 }}>
                  Post-exercise stress ({afterRating}/10)
                </label>
                <input
                  type="range" min="1" max="10"
                  value={afterRating}
                  onChange={(e) => setAfterRating(Number(e.target.value))}
                  className="stress-slider"
                />
                <div className="stress-labels">
                  <span>Relaxed</span><span>Highly Stressed</span>
                </div>
              </div>

              <div style={{ textAlign: 'left', marginBottom: 24 }}>
                <label className="input-label">Reflection Notes (optional)</label>
                <textarea
                  placeholder="Notice any shifts in your breathing or heart rate..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  style={{ resize: 'none' }}
                />
              </div>

              <button onClick={handleFeedbackSubmit} className="btn btn-primary btn-full">
                Save & Finish
              </button>
            </motion.div>
          )}

          {phase === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ padding: '16px 0' }}
            >
              <CheckCircle2 size={48} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
                Well Done
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
                Stress: {beforeRating} → {afterRating}. Logged in your wellbeing history.
              </p>
              <button onClick={onClose} className="btn btn-secondary btn-full">
                Return to App
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
