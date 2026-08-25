import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { CompanionPage } from './pages/CompanionPage';
import { MemoryPage } from './pages/MemoryPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Sparkles } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'companion' | 'memory' | 'insights' | 'settings'>('companion');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.5), transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} className="recording-pulse">
          <Sparkles size={24} color="var(--accent-teal)" />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Attuning Serenity...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ flex: 1 }}>
        {activeTab === 'companion' && <CompanionPage />}
        {activeTab === 'memory' && <MemoryPage />}
        {activeTab === 'insights' && <InsightsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
