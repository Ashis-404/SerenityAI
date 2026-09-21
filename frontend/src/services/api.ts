import type { 
  User, 
  UserPreference, 
  Conversation, 
  Message, 
  Memory, 
  AppEvent, 
  NotificationItem, 
  WellbeingSummary, 
  Intervention 
} from '../types';

function getApiBase(): string {
  // 1. If VITE_API_URL was injected during build
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`;
  }
  // 2. If running locally
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8000/api';
  }
  // 3. Render automatic domain fallback (e.g. serenity-frontend.onrender.com -> serenity-backend.onrender.com)
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    const backendHost = window.location.hostname.replace('-frontend', '-backend');
    return `https://${backendHost}/api`;
  }
  return '/api';
}

const API_BASE = getApiBase();

async function fetchWithHandler(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err: any) {
    if (err.name === 'TypeError' && String(err.message).toLowerCase().includes('fetch')) {
      throw new Error(
        'Unable to connect to Serenity backend server. ' +
        'If using Render free tier, the server may take 30-50 seconds to wake up from cold sleep. ' +
        'Please wait 30 seconds and click again.'
      );
    }
    throw err;
  }
}

function getAuthHeaders(isMultipart: boolean = false): Record<string, string> {
  const token = localStorage.getItem('serenity_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: any): Promise<{ access_token: string; user: User }> {
    const res = await fetchWithHandler(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(data: any): Promise<{ access_token: string; user: User }> {
    const res = await fetchWithHandler(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetchWithHandler(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Preferences & User
  async updatePreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    const res = await fetchWithHandler(`${API_BASE}/users/preferences`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  async deleteAllData(): Promise<{ message: string }> {
    const res = await fetchWithHandler(`${API_BASE}/users/data`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete account data');
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetchWithHandler(`${API_BASE}/conversations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createConversation(title?: string): Promise<Conversation> {
    const res = await fetchWithHandler(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: title || 'New Conversation' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetchWithHandler(`${API_BASE}/conversations/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async sendTextMessage(conversationId: string, text: string): Promise<{
    user_message: Message;
    assistant_message: Message;
    detected_emotion?: string;
    extracted_memories_count: number;
    extracted_events_count: number;
  }> {
    const res = await fetchWithHandler(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  async sendVoiceMessage(conversationId: string, audioBlob: Blob): Promise<{
    user_message: Message;
    assistant_message: Message;
    detected_emotion?: string;
    extracted_memories_count: number;
    extracted_events_count: number;
  }> {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.wav');

    const res = await fetchWithHandler(`${API_BASE}/conversations/${conversationId}/voice`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Voice processing failed' }));
      throw new Error(err.detail || 'Voice processing failed');
    }
    return res.json();
  },

  // Memories
  async getMemories(): Promise<Memory[]> {
    const res = await fetchWithHandler(`${API_BASE}/memories`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createMemory(data: Partial<Memory>): Promise<Memory> {
    const res = await fetchWithHandler(`${API_BASE}/memories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create memory');
    return res.json();
  },

  async updateMemory(id: string, data: Partial<Memory>): Promise<Memory> {
    const res = await fetchWithHandler(`${API_BASE}/memories/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetchWithHandler(`${API_BASE}/memories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  },

  // Events & Notifications
  async getEvents(): Promise<AppEvent[]> {
    const res = await fetchWithHandler(`${API_BASE}/events`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetchWithHandler(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async dismissNotification(id: string): Promise<void> {
    await fetchWithHandler(`${API_BASE}/notifications/${id}/dismiss`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  // Wellbeing & Interventions
  async getWeeklyInsights(): Promise<WellbeingSummary> {
    const res = await fetchWithHandler(`${API_BASE}/insights/weekly`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  },

  async getPresetInterventions(): Promise<any[]> {
    const res = await fetchWithHandler(`${API_BASE}/insights/interventions/presets`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async startIntervention(typeName: string): Promise<Intervention> {
    const res = await fetchWithHandler(`${API_BASE}/insights/interventions/start?type_name=${encodeURIComponent(typeName)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start intervention');
    return res.json();
  },

  async submitInterventionFeedback(id: string, feedback: any): Promise<Intervention> {
    const res = await fetchWithHandler(`${API_BASE}/insights/interventions/${id}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedback),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },
};
