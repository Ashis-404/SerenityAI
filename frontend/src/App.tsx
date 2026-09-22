import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { CompanionPage } from './pages/CompanionPage';
import { MemoryPage } from './pages/MemoryPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'companion' | 'memory' | 'insights' | 'settings'>('companion');
  const [showLanding, setShowLanding] = useState(true);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-orb">
          <img src="/logo.png" alt="SerenityAI" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        </div>
        <p className="loading-text">Loading Serenity...</p>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <AuthPage onBackToLanding={() => setShowLanding(true)} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'companion': return <CompanionPage />;
      case 'memory': return <MemoryPage />;
      case 'insights': return <InsightsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="app-shell">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
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

