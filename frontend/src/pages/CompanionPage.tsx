import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Conversation, Message } from '../types';
import { AcousticWaveform } from '../components/AcousticWaveform';
import {
  Send,
  Mic,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  User as UserIcon,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const CompanionPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Recording State & Refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  const [extractionAlert, setExtractionAlert] = useState<{ memories: number; events: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    };
  }, [mediaStream]);

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
    } catch (e) { /* ignore */ }
  };

  const createNewConversation = async () => {
    try {
      const conv = await api.createConversation('New Chat');
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
    } catch (e) { /* ignore */ }
  };

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0) {
        selectConversation(list[0].id);
      } else {
        createNewConversation();
      }
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { loadConversations(); }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId || loading) return;

    const userText = inputText.trim();
    setInputText('');
    setLoading(true);
    setExtractionAlert(null);
    setErrorMessage(null);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId,
      sender: 'user',
      text: userText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendTextMessage(activeConvId, userText);
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), res.user_message, res.assistant_message]);

      if (res.extracted_memories_count > 0 || res.extracted_events_count > 0) {
        setExtractionAlert({ memories: res.extracted_memories_count, events: res.extracted_events_count });
        setTimeout(() => setExtractionAlert(null), 6000);
      }

      if (ttsEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(res.assistant_message.text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
    finally { setLoading(false); }
  };

  const processVoiceAudio = async (audioBlob: Blob) => {
    if (!activeConvId) return;
    setLoading(true);
    setExtractionAlert(null);
    setErrorMessage(null);

    try {
      const res = await api.sendVoiceMessage(activeConvId, audioBlob);
      setMessages(prev => [...prev, res.user_message, res.assistant_message]);

      if (res.extracted_memories_count > 0 || res.extracted_events_count > 0) {
        setExtractionAlert({ memories: res.extracted_memories_count, events: res.extracted_events_count });
        setTimeout(() => setExtractionAlert(null), 6000);
      }

      if (ttsEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(res.assistant_message.text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Voice processing failed. Please try again.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
    finally { setLoading(false); }
  };

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      audioChunksRef.current = [];
      isCancelledRef.current = false;
      recordingStartTimeRef.current = Date.now();

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        setIsRecording(false);
        setRecordingSeconds(0);

        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const duration = Date.now() - recordingStartTimeRef.current;
        if (duration < 800) {
          setErrorMessage('Voice note was too short (under 1 second). Please speak and try again.');
          setTimeout(() => setErrorMessage(null), 4000);
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm'
        });
        audioChunksRef.current = [];
        await processVoiceAudio(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage('Microphone access is required for voice input.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getEmotionClass = (emotion: string) => {
    const e = emotion.toLowerCase();
    if (e.includes('calm')) return 'emotion-calm';
    if (e.includes('happy')) return 'emotion-happy';
    if (e.includes('sad')) return 'emotion-sad';
    if (e.includes('stress')) return 'emotion-stressed';
    if (e.includes('ang')) return 'emotion-angry';
    if (e.includes('fear')) return 'emotion-fearful';
    return 'emotion-neutral';
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button onClick={createNewConversation} className="btn btn-primary btn-full btn-sm">
            <Plus size={14} /> New Chat
          </button>
        </div>

        <div className="chat-conv-list">
          {conversations.map(c => (
            <button
              key={c.id}
              className={`chat-conv-item ${activeConvId === c.id ? 'active' : ''}`}
              onClick={() => selectConversation(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div className="chat-sidebar-tip">
          💡 Talk about your day, upcoming events, or how you're feeling.
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {/* Top bar */}
        <div className="chat-topbar">
          <div>
            <h2 className="chat-topbar-title">Serenity</h2>
            <span className="chat-topbar-status">Online & attuned</span>
          </div>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="btn btn-secondary btn-sm"
          >
            {ttsEnabled ? <Volume2 size={14} color="var(--accent)" /> : <VolumeX size={14} />}
            {ttsEnabled ? 'Voice On' : 'Voice Off'}
          </button>
        </div>

        {/* Extraction alert */}
        <AnimatePresence>
          {extractionAlert && (
            <motion.div
              className="chat-extraction-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Sparkles size={14} color="var(--accent)" />
              <span>
                {extractionAlert.memories > 0 && `Saved ${extractionAlert.memories} memory. `}
                {extractionAlert.events > 0 && `Follow-up scheduled! `}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              className="chat-error-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <AlertCircle size={14} color="#f87171" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-orb">
                <img src="/logo.png" alt="SerenityAI" style={{ width: 52, height: 52, objectFit: 'contain' }} />
              </div>
              <h3 className="chat-empty-title">Hello, {user?.name || 'friend'}</h3>
              <p className="chat-empty-text">
                How are you feeling today? Type a message or click the microphone to talk.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              className={`msg-row ${m.sender === 'user' ? 'user' : 'ai'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <div className={`msg-avatar ${m.sender === 'user' ? 'user' : 'ai'}`}>
                {m.sender === 'user'
                  ? <UserIcon size={14} color="var(--text-secondary)" />
                  : <img src="/logo.png" alt="Serenity" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                }
              </div>

              <div className="msg-content">
                <div className={`msg-bubble ${m.sender === 'user' ? 'user' : 'ai'}`}>
                  {m.text}
                </div>

                <div className={`msg-meta ${m.sender === 'user' ? 'user' : ''}`}>
                  {m.emotion_analysis && (
                    <span className={`emotion-badge ${getEmotionClass(m.emotion_analysis.emotion)}`}>
                      {m.emotion_analysis.emotion}
                    </span>
                  )}
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="chat-thinking">
              <div className="msg-avatar ai">
                <img src="/logo.png" alt="Serenity" style={{ width: 18, height: 18, objectFit: 'contain' }} />
              </div>
              <div className="thinking-dots">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <AcousticWaveform isRecording={isRecording} stream={mediaStream} />

          {isRecording ? (
            <div className="chat-input-form">
              <div className="recording-bar">
                <div className="recording-dot" />
                <span className="recording-time">{formatTime(recordingSeconds)}</span>
                <span className="recording-label">Listening to your voice...</span>
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="discard-btn"
                  title="Discard recording"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="send-btn"
                title="Finish & Send voice note"
              >
                <Send size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <button
                type="button"
                onClick={startRecording}
                className="mic-btn idle"
                title="Click to record voice note"
                disabled={loading}
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                placeholder="Type a message or click mic to talk..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                className="chat-input"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="send-btn"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
