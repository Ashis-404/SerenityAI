import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Mic, 
  Trash2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updatePreferences, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.preferences?.notifications_enabled ?? true);
  const [quietStart, setQuietStart] = useState(user?.preferences?.quiet_start ?? '22:00');
  const [quietEnd, setQuietEnd] = useState(user?.preferences?.quiet_end ?? '07:00');
  const [voiceAnalysisEnabled, setVoiceAnalysisEnabled] = useState(user?.preferences?.voice_analysis_enabled ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePreferences({
        notifications_enabled: notificationsEnabled,
        quiet_start: quietStart,
        quiet_end: quietEnd,
        voice_analysis_enabled: voiceAnalysisEnabled,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save settings');
    }
  };

  const handlePurgeAllData = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete all data') return;
    try {
      await api.deleteAllData();
      logout();
    } catch (e) {
      alert('Error deleting data');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 48px' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={26} color="var(--accent-cyan)" />
          Settings & Privacy Controls
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Full control over your notifications, quiet hours, voice analysis consent, and data retention.
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <Check size={16} />
          Preferences updated successfully!
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Notification & Follow-up Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="var(--accent-indigo)" />
            Proactive Follow-ups & Quiet Hours
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Enable Follow-up Notifications
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Allows Serenity to follow up on important deadlines or placement interviews you mention.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                style={{ transform: 'scale(1.3)', accentColor: 'var(--accent-indigo)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Quiet Hours Window (No notifications will be delivered)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quiet Start</span>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quiet End</span>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voice & Emotion Analysis Controls */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mic size={18} color="var(--accent-teal)" />
            Voice & Affect Privacy
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Acoustic Emotion Analysis
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '520px', marginTop: '2px' }}>
                When enabled, extracts non-clinical pitch/energy/MFCC features transiently during voice input. Audio files are purged immediately from disk after transcription.
              </p>
            </div>
            <input
              type="checkbox"
              checked={voiceAnalysisEnabled}
              onChange={(e) => setVoiceAnalysisEnabled(e.target.checked)}
              style={{ transform: 'scale(1.3)', accentColor: 'var(--accent-teal)', cursor: 'pointer' }}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
          Save Preferences
        </button>
      </form>

      {/* Danger Zone / Data Deletion */}
      <div className="glass-panel" style={{
        marginTop: '32px',
        padding: '24px',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        background: 'rgba(244, 63, 94, 0.05)'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fb7185', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={18} color="#fb7185" />
          Data Ownership & Account Purge
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          Permanently delete all your chat history, extracted long-term memories, scheduled events, wellbeing entries, and account information from Serenity.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="btn-danger"
        >
          Delete All Data & Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <AlertTriangle size={42} color="#fb7185" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Confirm Complete Data Purge
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
              This action is permanent and cannot be undone. All messages, memories, and events will be irrevocably deleted.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Type <strong style={{ color: '#ffffff' }}>delete all data</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete all data"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeAllData}
                disabled={deleteConfirmText.toLowerCase() !== 'delete all data'}
                className="btn-danger"
                style={{ flex: 2, justifyContent: 'center', opacity: deleteConfirmText.toLowerCase() === 'delete all data' ? 1 : 0.5 }}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
