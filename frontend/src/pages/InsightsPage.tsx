import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { WellbeingSummary } from '../types';
import { BreathingExerciseModal } from '../components/BreathingExerciseModal';
import { 
  Activity, 
  Heart, 
  Wind, 
  Coffee, 
  BookOpen, 
  Trees, 
  Sparkles, 
  TrendingUp 
} from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const [summary, setSummary] = useState<WellbeingSummary | null>(null);
  const [isBreathingModalOpen, setIsBreathingModalOpen] = useState(false);
  const [activeInterventionId, setActiveInterventionId] = useState<string | undefined>();

  const loadInsights = async () => {
    try {
      const data = await api.getWeeklyInsights();
      setSummary(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleStartIntervention = async (type: string) => {
    try {
      const started = await api.startIntervention(type);
      setActiveInterventionId(started.id);
      setIsBreathingModalOpen(true);
    } catch (e) {
      setIsBreathingModalOpen(true);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 36px' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={26} color="var(--accent-teal)" />
          Wellbeing Insights & Trends
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Non-clinical longitudinal patterns based on your acoustic conversations and daily check-ins.
        </p>
      </div>

      {/* Summary Narrative Banner */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(99, 102, 241, 0.15))',
        border: '1px solid var(--border-highlight)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(20, 184, 166, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={22} color="var(--accent-teal)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
              Weekly Reflection Summary
            </h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.6 }}>
              {summary?.summary_text || 'Collecting conversation signals...'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Conversations Logged</span>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#ffffff', marginTop: '8px' }}>
            {summary?.total_conversations || 0}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-teal)' }}>Past 7 Days</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Average Stress Level</span>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#ffffff', marginTop: '8px' }}>
            {summary?.average_stress ? `${summary.average_stress}/10` : 'Normal (3/10)'}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--accent-indigo)' }}>Supportive estimate</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Frequent Emotional States</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {summary?.most_frequent_emotions && Object.keys(summary.most_frequent_emotions).length > 0 ? (
              Object.entries(summary.most_frequent_emotions).map(([emotion, count]) => (
                <span key={emotion} style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: 'var(--accent-indigo)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  textTransform: 'capitalize'
                }}>
                  {emotion} ({count})
                </span>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calm, Steady</span>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Emotion & Stress Bar Breakdown */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--accent-indigo)" />
          7-Day Affect Trajectory
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center' }}>
          {summary?.weekly_trends?.map((item) => (
            <div key={item.date} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '12px 6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.day}</span>
              <div style={{
                height: '80px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                margin: '10px 0'
              }}>
                <div style={{
                  width: '20px',
                  height: `${(item.stress_level || 3) * 8}px`,
                  background: item.stress_level && item.stress_level > 6
                    ? 'linear-gradient(to top, #fb7185, #f43f5e)'
                    : 'linear-gradient(to top, #14b8a6, #6366f1)',
                  borderRadius: '6px'
                }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize', display: 'block' }}>
                {item.dominant_emotion}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lightweight Interventions Library */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={20} color="var(--accent-rose)" />
          Lightweight Wellbeing Actions
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px' }}>
          Grounding exercises to reset your energy during stressful moments.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {/* Card 1 */}
          <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Wind size={20} color="var(--accent-teal)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Box Breathing</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                4-4-4-4 guided breathing cycle to physically lower heart rate and soothe anxiety.
              </p>
            </div>
            <button onClick={() => handleStartIntervention('breathing')} className="btn-primary" style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}>
              Start Breathing Exercise
            </button>
          </div>

          {/* Card 2 */}
          <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Coffee size={20} color="var(--accent-indigo)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Sensory Reset</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Step away from screens for 5 minutes and ground yourself in physical sensations.
              </p>
            </div>
            <button onClick={() => handleStartIntervention('break')} className="btn-secondary" style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}>
              Begin 5-Min Reset
            </button>
          </div>

          {/* Card 3 */}
          <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Trees size={20} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Brisk Walk</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                A quick 10-minute walk outside to get fresh air and shift cognitive framing.
              </p>
            </div>
            <button onClick={() => handleStartIntervention('walk')} className="btn-secondary" style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}>
              Log Walk
            </button>
          </div>

          {/* Card 4 */}
          <div className="glass-panel glass-panel-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <BookOpen size={20} color="var(--accent-amber)" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Thought Dump</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                Write everything out to clear mental bandwidth without any judgment.
              </p>
            </div>
            <button onClick={() => handleStartIntervention('journaling')} className="btn-secondary" style={{ fontSize: '12px', width: '100%', justifyContent: 'center' }}>
              Start Journaling
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modal */}
      <BreathingExerciseModal
        isOpen={isBreathingModalOpen}
        onClose={() => setIsBreathingModalOpen(false)}
        interventionId={activeInterventionId}
        onComplete={loadInsights}
      />
    </div>
  );
};
