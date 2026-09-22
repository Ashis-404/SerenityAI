import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Brain,
  Activity,
  ArrowRight,
  Shield,
  ChevronDown,
  MessageCircle,
  Heart,
  TrendingUp
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing">
      {/* ── Navigation ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <img src="/logo.png" alt="SerenityAI" className="landing-nav-logo" />
            <span className="landing-nav-wordmark">SerenityAI</span>
          </div>
          <button onClick={onGetStarted} className="landing-nav-cta">
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />

        <motion.div
          className="landing-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src="/logo.png"
            alt="SerenityAI"
            className="landing-hero-logo"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />

          <h1 className="landing-hero-title">
            A Friend Who <span className="landing-gradient-text">Listens</span>
          </h1>

          <p className="landing-hero-subtitle">
            SerenityAI is your emotion-aware AI companion that understands how you
            feel, remembers what matters to you, and helps you grow — one
            conversation at a time.
          </p>

          <div className="landing-hero-actions">
            <button onClick={onGetStarted} className="landing-btn-primary">
              Get Started
              <ArrowRight size={18} />
            </button>
            <a href="#features" className="landing-btn-ghost">
              Learn more
              <ChevronDown size={16} />
            </a>
          </div>
        </motion.div>

        <div className="landing-hero-fade" />
      </section>

      {/* ── Features ── */}
      <section className="landing-features" id="features">
        <div className="landing-section-header">
          <span className="landing-section-tag">Core Capabilities</span>
          <h2 className="landing-section-title">
            More than a chatbot.
            <br />
            A companion that truly <em>gets</em> you.
          </h2>
        </div>

        <div className="landing-features-grid">
          {[
            {
              icon: Mic,
              title: 'Voice & Emotion Aware',
              description:
                'Speak naturally. Serenity analyzes acoustic patterns in your voice to understand your emotional state — no questionnaires, no surveys.',
              accent: 'var(--accent)',
            },
            {
              icon: Brain,
              title: 'Remembers You',
              description:
                'Serenity remembers your preferences, goals, life events, and the things you care about. Every conversation builds on the last.',
              accent: 'var(--accent-purple)',
            },
            {
              icon: Activity,
              title: 'Wellbeing Insights',
              description:
                'Track your emotional patterns over time with longitudinal mood analytics. See how you\'re really doing — not just how you think you\'re doing.',
              accent: 'var(--accent-teal)',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              className="landing-feature-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="landing-feature-icon"
                style={{
                  background: `linear-gradient(135deg, ${feature.accent}22, ${feature.accent}08)`,
                  borderColor: `${feature.accent}30`,
                }}
              >
                <feature.icon size={22} color={feature.accent} />
              </div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-how">
        <div className="landing-section-header">
          <span className="landing-section-tag">How It Works</span>
          <h2 className="landing-section-title">
            Three steps. <br />
            No setup, no friction.
          </h2>
        </div>

        <div className="landing-steps">
          {[
            {
              num: '01',
              icon: MessageCircle,
              title: 'Share how you feel',
              desc: 'Type a message or tap the mic. Talk about your day, your worries, or what made you smile.',
            },
            {
              num: '02',
              icon: Heart,
              title: 'Serenity responds with empathy',
              desc: 'Your companion replies with warmth and emotional awareness — acknowledging your feelings, not just your words.',
            },
            {
              num: '03',
              icon: TrendingUp,
              title: 'Grow over time',
              desc: 'Track your mood trends, rediscover memories, and build a meaningful long-term relationship with your AI friend.',
            },
          ].map((step, i) => (
            <motion.div
              key={step.num}
              className="landing-step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="landing-step-num">{step.num}</span>
              <div className="landing-step-icon">
                <step.icon size={20} />
              </div>
              <div>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-section">
        <motion.div
          className="landing-cta-card"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src="/logo.png" alt="SerenityAI" className="landing-cta-logo" />
          <h2 className="landing-cta-title">Ready to feel heard?</h2>
          <p className="landing-cta-subtitle">
            Start your first conversation with Serenity. It's free, private, and
            takes under a minute.
          </p>
          <button onClick={onGetStarted} className="landing-btn-primary landing-btn-lg">
            Start My Journey
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/logo.png" alt="SerenityAI" className="landing-footer-logo" />
            <span>SerenityAI</span>
          </div>
          <div className="landing-footer-note">
            <Shield size={14} />
            <span>
              Serenity is an AI companion for personal reflection, not a medical
              service. If you're in crisis, please contact the{' '}
              <a
                href="https://988lifeline.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                988 Suicide & Crisis Lifeline
              </a>
              .
            </span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} SerenityAI — Built with care.
          </p>
        </div>
      </footer>
    </div>
  );
};
