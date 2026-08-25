import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Bell } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'auth' | 'onboarding'>('auth');

  // Form states
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
          // Move to onboarding preferences step
          setStep('onboarding');
          setLoading(false);
          return;
        } else {
          // Finalize registration
          await register({
            name,
            email,
            password,
            timezone,
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '36px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #14b8a6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 25px rgba(20, 184, 166, 0.5)'
          }}>
            <Sparkles size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
            Serenity <span style={{ color: 'var(--accent-teal)' }}>2.0</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Emotion-Aware AI Friend & Personal Wellbeing Companion
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#fb7185',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Step 1: Base Auth Form */}
        {step === 'auth' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tab switch */}
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '8px'
            }}>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: isLogin ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: isLogin ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: !isLogin ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: !isLogin ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Create Account
              </button>
            </div>

            {!isLogin && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Your Preferred Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In to Serenity' : 'Continue to Preferences →')}
            </button>
          </form>
        )}

        {/* Step 2: Onboarding Preferences for Registration */}
        {step === 'onboarding' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Customize Your Experience
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Serenity respects your privacy and quiet boundaries.
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Quiet Hours */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Bell size={14} color="var(--accent-indigo)" />
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Quiet Hours (No follow-up notifications)
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Start</span>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>End</span>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Voice & Emotion Consent */}
            <div style={{
              background: 'rgba(20, 184, 166, 0.08)',
              border: '1px solid rgba(20, 184, 166, 0.25)',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <input
                type="checkbox"
                id="voiceConsent"
                checked={voiceConsent}
                onChange={(e) => setVoiceConsent(e.target.checked)}
                style={{ marginTop: '3px', accentColor: 'var(--accent-teal)' }}
              />
              <label htmlFor="voiceConsent" style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <strong>Enable non-clinical emotion analysis</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                  Processes acoustic features (pitch, energy) transiently to attune responses. Audio files are deleted immediately after processing.
                </p>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setStep('auth')}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
              >
                {loading ? 'Creating...' : 'Finish & Start Serenity'}
              </button>
            </div>
          </form>
        )}

        {/* Non-clinical trust note */}
        <div style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontSize: '11px'
        }}>
          <Shield size={16} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
          <span>Serenity is an AI companion designed for personal reflection, not medical diagnosis or clinical therapy.</span>
        </div>
      </div>
    </div>
  );
};
