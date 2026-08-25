import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { NotificationItem } from '../types';
import {
  MessageSquareHeart,
  Brain,
  Activity,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  Check,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'companion' | 'memory' | 'insights' | 'settings';
  setActiveTab: (tab: 'companion' | 'memory' | 'insights' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'sent').length;

  const handleDismiss = async (id: string) => {
    try {
      await api.dismissNotification(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'dismissed' } : n));
    } catch (e) {
      // ignore
    }
  };

  const tabs = [
    { key: 'companion' as const, label: 'Companion', icon: MessageSquareHeart },
    { key: 'memory' as const, label: 'Memory', icon: Brain },
    { key: 'insights' as const, label: 'Insights', icon: Activity },
    { key: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Desktop / Tablet Nav */}
      <nav className="nav">
        <div className="nav-inner">
          {/* Brand */}
          <div className="nav-brand" onClick={() => setActiveTab('companion')}>
            <div className="nav-logo">
              <Sparkles size={18} color="#fff" />
            </div>
            <span className="nav-title">
              Serenity<span className="nav-badge">2.0</span>
            </span>
          </div>

          {/* Tabs */}
          <div className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="nav-actions">
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button className="notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <motion.span
                    className="notif-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    className="notif-dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600 }}>Notifications</h3>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{notifications.length} total</span>
                    </div>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                        No follow-ups yet
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {notifications.map(n => (
                          <div key={n.id} className={`notif-item ${n.status === 'sent' ? 'unread' : ''}`}>
                            <div className="flex-between" style={{ gap: 8, alignItems: 'flex-start' }}>
                              <p style={{ fontWeight: 500, fontSize: 13 }}>{n.message}</p>
                              {n.status !== 'dismissed' && (
                                <button className="btn-ghost" onClick={() => handleDismiss(n.id)} title="Dismiss">
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                            <div className="flex-between" style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                              <span>
                                Status: <strong style={{ color: n.status === 'sent' ? 'var(--accent)' : 'var(--text-muted)' }}>{n.status}</strong>
                              </span>
                              <span>{new Date(n.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="nav-user-name">{user?.name || 'Friend'}</span>

            <button className="btn-ghost" onClick={logout} title="Log Out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`mobile-nav-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
