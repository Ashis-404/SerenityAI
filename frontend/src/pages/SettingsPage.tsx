import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Bell,
  Mic,
  Trash2,
  Check,
  AlertTriangle,
  X
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
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">
          <SettingsIcon size={24} color="var(--accent)" />
          Settings & Privacy
        </h1>
        <p className="page-subtitle">
          Control notifications, quiet hours, voice analysis, and data retention.
        </p>
      </div>

      {savedSuccess && (
        <motion.div
          className="success-toast"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Check size={16} />
          Preferences saved successfully!
        </motion.div>
      )}

      <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Notifications Section */}
        <motion.div
          className="card settings-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="settings-section-title">
            <Bell size={18} color="var(--accent)" />
            Follow-ups & Quiet Hours
          </h2>

          <div className="settings-row">
            <div className="settings-row-info">
              <h3>Follow-up Notifications</h3>
              <p>Allow Serenity to follow up on important events you mention.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <hr className="settings-divider" />

          <div>
            <label className="input-label" style={{ marginBottom: 10 }}>Quiet Hours Window</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
        </motion.div>

        {/* Voice Section */}
        <motion.div
          className="card settings-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="settings-section-title">
            <Mic size={18} color="var(--accent)" />
            Voice & Affect Privacy
          </h2>

          <div className="settings-row">
            <div className="settings-row-info">
              <h3>Acoustic Emotion Analysis</h3>
              <p>Extracts non-clinical pitch/energy features transiently. Audio is purged immediately after processing.</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={voiceAnalysisEnabled}
                onChange={(e) => setVoiceAnalysisEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </motion.div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          Save Preferences
        </button>
      </form>

      {/* Danger Zone */}
      <motion.div
        className="card settings-section danger-zone"
        style={{ marginTop: 32 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="settings-section-title danger-title">
          <Trash2 size={18} />
          Data Ownership & Account Purge
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
          Permanently delete all chat history, memories, events, and account data.
        </p>
        <button type="button" onClick={() => setShowDeleteModal(true)} className="btn btn-danger">
          Delete All Data & Account
        </button>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="modal-panel"
            style={{ textAlign: 'center' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} className="modal-close">
              <X size={18} />
            </button>

            <AlertTriangle size={40} color="var(--accent-rose)" style={{ margin: '0 auto 14px' }} />
            <h3 className="modal-title" style={{ marginBottom: 8 }}>Confirm Data Purge</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              This is permanent. All data will be irrevocably deleted.
            </p>

            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <label className="input-label">
                Type <strong style={{ color: 'var(--text-primary)' }}>delete all data</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete all data"
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeAllData}
                disabled={deleteConfirmText.toLowerCase() !== 'delete all data'}
                className="btn btn-danger"
                style={{ flex: 2 }}
              >
                Permanently Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
