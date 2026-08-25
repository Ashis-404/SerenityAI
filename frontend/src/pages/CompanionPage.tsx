import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Conversation, Message } from '../types';
import { AcousticWaveform } from '../components/AcousticWaveform';
import {
  Send,
  Mic,
  MicOff,
  Plus,
  Volume2,
  VolumeX,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

export const CompanionPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [extractionAlert, setExtractionAlert] = useState<{ memories: number; events: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

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
    } catch (err) { /* ignore */ }
    finally { setLoading(false); }
  };

  const processVoiceAudio = async (audioBlob: Blob) => {
    if (!activeConvId) return;
    setLoading(true);
    setExtractionAlert(null);

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
    } catch (err) { /* ignore */ }
    finally { setLoading(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
        await processVoiceAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access is required for voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-orb">
                <Sparkles size={36} color="#fff" />
              </div>
              <h3 className="chat-empty-title">Hello, {user?.name || 'friend'}</h3>
              <p className="chat-empty-text">
                How are you feeling today? Type a message or hold the microphone to talk.
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
                  : <Sparkles size={14} color="#fff" />
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
                <Sparkles size={14} color="#fff" />
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

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`mic-btn ${isRecording ? 'recording' : 'idle'}`}
              title="Hold to speak"
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              placeholder={isRecording ? 'Listening...' : 'Type a message...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isRecording || loading}
              className="chat-input"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading || isRecording}
              className="send-btn"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
