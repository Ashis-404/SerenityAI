import React, { useState, useEffect } from 'react';
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
    const interval = setInterval(fetchNotifs, 15000); // Check every 15s
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

  return (
    <nav className="glass-panel" style={{
      margin: '16px 24px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '16px',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div 
        onClick={() => setActiveTab('companion')}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #14b8a6, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(20, 184, 166, 0.4)'
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>
            Serenity <span style={{ fontSize: '12px', color: 'var(--accent-teal)', background: 'rgba(20, 184, 166, 0.15)', padding: '2px 6px', borderRadius: '6px' }}>2.0</span>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Emotion-Aware AI Companion</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('companion')}
          style={{
            background: activeTab === 'companion' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'companion' ? '1px solid var(--border-highlight)' : '1px solid transparent',
            color: activeTab === 'companion' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageSquareHeart size={16} color={activeTab === 'companion' ? 'var(--accent-indigo)' : 'currentColor'} />
          Companion
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          style={{
            background: activeTab === 'memory' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'memory' ? '1px solid var(--border-highlight)' : '1px solid transparent',
            color: activeTab === 'memory' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <Brain size={16} color={activeTab === 'memory' ? 'var(--accent-purple)' : 'currentColor'} />
          Memory & Events
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          style={{
            background: activeTab === 'insights' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'insights' ? '1px solid var(--border-highlight)' : '1px solid transparent',
            color: activeTab === 'insights' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <Activity size={16} color={activeTab === 'insights' ? 'var(--accent-teal)' : 'currentColor'} />
          Wellbeing Insights
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'settings' ? '1px solid var(--border-highlight)' : '1px solid transparent',
            color: activeTab === 'settings' ? '#ffffff' : 'var(--text-secondary)',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <SettingsIcon size={16} color={activeTab === 'settings' ? 'var(--accent-cyan)' : 'currentColor'} />
          Settings
        </button>
      </div>

      {/* User Actions & Notification dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--accent-rose)',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '320px',
              padding: '16px',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 200,
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Follow-ups & Notifications
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notifications.length} total</span>
              </h3>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  No scheduled follow-ups yet
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      background: n.status === 'sent' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: n.status === 'sent' ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{n.message}</p>
                        {n.status !== 'dismissed' && (
                          <button
                            onClick={() => handleDismiss(n.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Dismiss"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: 'var(--text-muted)', fontSize: '10px' }}>
                        <span>Status: <strong style={{ color: n.status === 'sent' ? 'var(--accent-teal)' : 'var(--text-muted)' }}>{n.status}</strong></span>
                        <span>{new Date(n.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500
          }}>
            {user?.name || 'Friend'}
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};
