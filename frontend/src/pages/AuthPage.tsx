import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Shield, Bell, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  onBackToLanding?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBackToLanding }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'onboarding'>('auth');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [notificationsEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [voiceConsent, setVoiceConsent] = useState(true);
  const [preferredMode] = useState('hybrid');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        if (step === 'auth') {
          setStep('onboarding');
          setLoading(false);
          return;
        } else {
          await register({
            name, email, password, timezone,
            notifications_enabled: notificationsEnabled,
            quiet_start: quietStart,
            quiet_end: quietEnd,
            voice_analysis_enabled: voiceConsent,
            preferred_mode: preferredMode,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <motion.div
        className="card card-p-lg auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Back to landing */}
        {onBackToLanding && (
          <button onClick={onBackToLanding} className="auth-back-btn">
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {/* Header */}
        <div className="auth-header">
          <motion.img
            src="/logo.png"
            alt="SerenityAI"
            className="auth-logo-img"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          />
          <h1 className="auth-title">SerenityAI</h1>
          <p className="auth-subtitle">Your Emotion-Aware AI Companion</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <AnimatePresence mode="wait">
          {/* Step 1: Auth Form */}
          {step === 'auth' && (
            <motion.form
              key="auth"
              onSubmit={handleSubmit}
              className="auth-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="auth-tab-switcher">
                <button
                  type="button"
                  className={`auth-tab ${isLogin ? 'active' : ''}`}
                  onClick={() => setIsLogin(true)}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab ${!isLogin ? 'active' : ''}`}
                  onClick={() => setIsLogin(false)}
                >
                  Create Account
                </button>
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label className="input-label">Your Preferred Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full"
                style={{ marginTop: 8 }}
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Continue →')}
              </button>
            </motion.form>
          )}

          {/* Step 2: Onboarding */}
          {step === 'onboarding' && (
            <motion.form
              key="onboarding"
              onSubmit={handleSubmit}
              className="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 12, marginBottom: 4 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Customize Your Experience</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Serenity respects your privacy and quiet boundaries.
                </p>
              </div>

              <div className="input-group">
                <label className="input-label">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Bell size={14} color="var(--accent)" />
                  <label className="input-label" style={{ marginBottom: 0 }}>Quiet Hours</label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="input-group">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start</span>
                    <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="input-field" />
                  </div>
                  <div className="input-group">
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>End</span>
                    <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="input-field" />
                  </div>
                </div>
              </div>

              <div className="consent-box">
                <input
                  type="checkbox"
                  id="voiceConsent"
                  checked={voiceConsent}
                  onChange={(e) => setVoiceConsent(e.target.checked)}
                />
                <label htmlFor="voiceConsent" style={{ cursor: 'pointer' }}>
                  <strong style={{ fontSize: 13 }}>Enable emotion analysis</strong>
                  <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    Processes acoustic features transiently. Audio is deleted immediately after processing.
                  </p>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setStep('auth')} className="btn btn-secondary" style={{ flex: 1 }}>
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                  {loading ? 'Creating...' : 'Start Serenity'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="auth-footer">
          <Shield size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span>Serenity is an AI companion for personal reflection, not medical diagnosis.</span>
        </div>
      </motion.div>
    </div>
  );
};
