import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';

export const CompanionPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Extraction notification alert
  const [extractionAlert, setExtractionAlert] = useState<{ memories: number; events: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const selectConversation = async (id: string) => {
    setActiveConvId(id);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
    } catch (e) {
      // ignore
    }
  };

  const createNewConversation = async () => {
    try {
      const conv = await api.createConversation('New Chat');
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
    } catch (e) {
      // ignore
    }
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
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Text message send
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId || loading) return;

    const userText = inputText.trim();
    setInputText('');
    setLoading(true);
    setExtractionAlert(null);

    // Optimistic user message
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
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      // error
    } finally {
      setLoading(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
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
      alert('Microphone access is required for voice conversation.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getEmotionBadgeClass = (emotion: string) => {
    const e = emotion.toLowerCase();
    if (e.includes('calm')) return 'badge-calm';
    if (e.includes('happy')) return 'badge-happy';
    if (e.includes('sad')) return 'badge-sad';
    if (e.includes('stress')) return 'badge-stressed';
    if (e.includes('ang')) return 'badge-angry';
    if (e.includes('fear')) return 'badge-fearful';
    return 'badge-neutral';
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px 24px',
      height: 'calc(100vh - 120px)',
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gap: '20px'
    }}>
      {/* Sidebar - Conversations */}
      <div className="glass-panel" style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <button
          onClick={createNewConversation}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginBottom: '16px', fontSize: '13px' }}
        >
          <Plus size={16} /> New Conversation
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              style={{
                background: activeConvId === c.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                border: activeConvId === c.id ? '1px solid var(--border-highlight)' : '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 12px',
                textAlign: 'left',
                color: activeConvId === c.id ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'all 0.15s ease'
              }}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
          <p>💡 Tip: Speak or type about your day, upcoming interviews, or how you feel.</p>
        </div>
      </div>

      {/* Main Conversation Workspace */}
      <div className="glass-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Chat Bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-heading)' }}>
              Serenity Companion
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--accent-teal)' }}>
              ● Attuned to context & vocal affect
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
              title={ttsEnabled ? 'Disable Voice Playback' : 'Enable Voice Playback'}
            >
              {ttsEnabled ? <Volume2 size={15} color="var(--accent-teal)" /> : <VolumeX size={15} />}
              {ttsEnabled ? 'Voice On' : 'Voice Off'}
            </button>
          </div>
        </div>

        {/* Extraction Alert Banner */}
        {extractionAlert && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.25), rgba(20, 184, 166, 0.25))',
            borderBottom: '1px solid var(--border-highlight)',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Sparkles size={16} color="var(--accent-teal)" />
            <span>
              {extractionAlert.memories > 0 && `Saved ${extractionAlert.memories} meaningful memory. `}
              {extractionAlert.events > 0 && `Scheduled follow-up for your upcoming event! `}
            </span>
          </div>
        )}

        {/* Message Stream */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', maxWidth: '420px', padding: '24px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(20, 184, 166, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Sparkles size={30} color="var(--accent-teal)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                Welcome, {user?.name || 'friend'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                How are you feeling today? You can type a message or hold the microphone to talk about your day, an upcoming deadline, or simply reflect.
              </p>
            </div>
          )}

          {messages.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                background: m.sender === 'user'
                  ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                  : 'rgba(30, 41, 66, 0.8)',
                color: '#ffffff',
                padding: '12px 18px',
                borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                fontSize: '14px',
                lineHeight: 1.6,
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                whiteSpace: 'pre-wrap'
              }}>
                {m.text}
              </div>

              {/* Emotion Indicator on User voice messages */}
              {m.emotion_analysis && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span className={`badge ${getEmotionBadgeClass(m.emotion_analysis.emotion)}`} style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    textTransform: 'capitalize'
                  }}>
                    Affect: {m.emotion_analysis.emotion}
                  </span>
                </div>
              )}

              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              background: 'rgba(30, 41, 66, 0.8)',
              padding: '12px 18px',
              borderRadius: '16px 16px 16px 4px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: 'var(--accent-teal)'
            }}>
              <Sparkles size={16} className="recording-pulse" />
              <span>Serenity is thinking and attuning...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {/* Live Waveform when recording */}
          <AcousticWaveform isRecording={isRecording} stream={mediaStream} />

          <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Push to talk button */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              style={{
                background: isRecording ? 'var(--accent-rose)' : 'rgba(20, 184, 166, 0.15)',
                border: isRecording ? '1px solid var(--accent-rose)' : '1px solid rgba(20, 184, 166, 0.3)',
                color: isRecording ? '#ffffff' : 'var(--accent-teal)',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title="Hold to speak (Push to talk)"
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <input
              type="text"
              placeholder={isRecording ? "Listening to your voice..." : "Type a message or hold mic to speak..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isRecording || loading}
              style={{ flex: 1, padding: '12px 16px', fontSize: '14px' }}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading || isRecording}
              className="btn-primary"
              style={{ height: '44px', padding: '0 18px' }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
