import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadInsights(); }, []);

  const handleStartIntervention = async (type: string) => {
    try {
      const started = await api.startIntervention(type);
      setActiveInterventionId(started.id);
      setIsBreathingModalOpen(true);
    } catch (e) {
      setIsBreathingModalOpen(true);
    }
  };

  const interventions = [
    {
      type: 'breathing',
      title: 'Box Breathing',
      desc: '4-4-4-4 guided breathing to lower heart rate and soothe anxiety.',
      icon: Wind,
      iconBg: 'rgba(56, 189, 248, 0.1)',
      iconColor: 'var(--accent)',
      primary: true,
    },
    {
      type: 'break',
      title: 'Sensory Reset',
      desc: 'Step away for 5 minutes and ground yourself in physical sensations.',
      icon: Coffee,
      iconBg: 'rgba(167, 139, 250, 0.1)',
      iconColor: 'var(--accent-purple)',
      primary: false,
    },
    {
      type: 'walk',
      title: 'Brisk Walk',
      desc: 'A 10-minute walk outside to get fresh air and shift perspective.',
      icon: Trees,
      iconBg: 'rgba(52, 211, 153, 0.1)',
      iconColor: 'var(--accent-emerald)',
      primary: false,
    },
    {
      type: 'journaling',
      title: 'Thought Dump',
      desc: 'Write everything out to clear mental bandwidth without judgment.',
      icon: BookOpen,
      iconBg: 'rgba(251, 191, 36, 0.1)',
      iconColor: 'var(--accent-amber)',
      primary: false,
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <Activity size={24} color="var(--accent)" />
          Wellbeing Insights
        </h1>
        <p className="page-subtitle">
          Non-clinical longitudinal patterns based on your conversations.
        </p>
      </div>

      {/* Summary Banner */}
      <motion.div
        className="card summary-banner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
          <div className="intervention-icon" style={{ background: 'var(--accent-glow)', flexShrink: 0 }}>
            <Sparkles size={20} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Weekly Reflection</h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {summary?.summary_text || 'Collecting conversation signals...'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <motion.div
          className="card metric-card card-p"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="metric-label">Conversations Logged</span>
          <div className="metric-value">{summary?.total_conversations || 0}</div>
          <span className="metric-sub">Past 7 Days</span>
        </motion.div>

        <motion.div
          className="card metric-card card-p"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="metric-label">Average Stress</span>
          <div className="metric-value">
            {summary?.average_stress ? `${summary.average_stress}/10` : '3/10'}
          </div>
          <span className="metric-sub">Supportive estimate</span>
        </motion.div>

        <motion.div
          className="card metric-card card-p"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="metric-label">Frequent States</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {summary?.most_frequent_emotions && Object.keys(summary.most_frequent_emotions).length > 0 ? (
              Object.entries(summary.most_frequent_emotions).map(([emotion, count]) => (
                <span key={emotion} className="emotion-badge emotion-neutral" style={{ fontSize: 11, padding: '3px 10px' }}>
                  {emotion} ({count})
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calm, Steady</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* 7-Day Trajectory */}
      <motion.div
        className="card card-p-lg"
        style={{ marginBottom: 28 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={18} color="var(--accent)" />
          7-Day Affect Trajectory
        </h2>
        <div className="trajectory-grid">
          {summary?.weekly_trends?.map((item, i) => (
            <motion.div
              key={item.date}
              className="trajectory-day"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <span className="trajectory-day-label">{item.day}</span>
              <div className="trajectory-bar-container">
                <motion.div
                  className={`trajectory-bar ${item.stress_level && item.stress_level > 6 ? 'stressed' : 'normal'}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.stress_level || 3) * 8}px` }}
                  transition={{ delay: 0.5 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="trajectory-emotion">{item.dominant_emotion}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Interventions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Heart size={18} color="var(--accent-rose)" />
          Wellbeing Actions
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
          Grounding exercises to reset your energy.
        </p>

        <div className="interventions-grid">
          {interventions.map((item, i) => (
            <motion.div
              key={item.type}
              className="card card-interactive intervention-card card-p"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <div>
                <div className="intervention-icon" style={{ background: item.iconBg }}>
                  <item.icon size={20} color={item.iconColor} />
                </div>
                <h3 className="intervention-title">{item.title}</h3>
                <p className="intervention-desc">{item.desc}</p>
              </div>
              <button
                onClick={() => handleStartIntervention(item.type)}
                className={`btn btn-full btn-sm ${item.primary ? 'btn-primary' : 'btn-secondary'}`}
              >
                Start {item.title}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <BreathingExerciseModal
        isOpen={isBreathingModalOpen}
        onClose={() => setIsBreathingModalOpen(false)}
        interventionId={activeInterventionId}
        onComplete={loadInsights}
      />
    </div>
  );
};
