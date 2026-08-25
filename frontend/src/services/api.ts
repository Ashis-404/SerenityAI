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

const API_BASE = 'http://localhost:8000/api';

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
    const res = await fetch(`${API_BASE}/auth/register`, {
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
    const res = await fetch(`${API_BASE}/auth/login`, {
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
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  // Preferences & User
  async updatePreferences(data: Partial<UserPreference>): Promise<UserPreference> {
    const res = await fetch(`${API_BASE}/users/preferences`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  async deleteAllData(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/users/data`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete account data');
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title: title || 'New Conversation' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
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
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
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

    const res = await fetch(`${API_BASE}/conversations/${conversationId}/voice`, {
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
    const res = await fetch(`${API_BASE}/memories`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createMemory(data: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`${API_BASE}/memories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create memory');
    return res.json();
  },

  async updateMemory(id: string, data: Partial<Memory>): Promise<Memory> {
    const res = await fetch(`${API_BASE}/memories/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update memory');
    return res.json();
  },

  async deleteMemory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/memories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete memory');
  },

  // Events & Notifications
  async getEvents(): Promise<AppEvent[]> {
    const res = await fetch(`${API_BASE}/events`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async dismissNotification(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/dismiss`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  // Wellbeing & Interventions
  async getWeeklyInsights(): Promise<WellbeingSummary> {
    const res = await fetch(`${API_BASE}/insights/weekly`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch insights');
    return res.json();
  },

  async getPresetInterventions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/insights/interventions/presets`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async startIntervention(typeName: string): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/insights/interventions/start?type_name=${encodeURIComponent(typeName)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start intervention');
    return res.json();
  },

  async submitInterventionFeedback(id: string, feedback: any): Promise<Intervention> {
    const res = await fetch(`${API_BASE}/insights/interventions/${id}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedback),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return res.json();
  },
};
