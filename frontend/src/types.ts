export interface UserPreference {
  user_id: string;
  notifications_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
  voice_analysis_enabled: boolean;
  preferred_mode: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  created_at: string;
  preferences?: UserPreference;
}

export interface EmotionAnalysis {
  emotion: string;
  probabilities_json: Record<string, number>;
  model_version: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  text: string;
  audio_url?: string;
  created_at: string;
  emotion_analysis?: EmotionAnalysis;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  started_at: string;
  ended_at?: string;
  messages?: Message[];
}

export interface Memory {
  id: string;
  user_id: string;
  type: 'fact' | 'preference' | 'goal' | 'person' | 'milestone';
  content: string;
  importance: number;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AppEvent {
  id: string;
  user_id: string;
  title: string;
  event_time: string;
  follow_up_enabled: boolean;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  event_id?: string;
  message: string;
  scheduled_at: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'dismissed' | 'cancelled';
  created_at: string;
}

export interface WeeklyTrendItem {
  day: string;
  date: string;
  dominant_emotion: string;
  stress_level?: number;
  conversations_count: number;
}

export interface Intervention {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  recommended_at: string;
  completed_at?: string;
  before_rating?: number;
  after_rating?: number;
  feedback_notes?: string;
}

export interface WellbeingSummary {
  total_conversations: number;
  most_frequent_emotions: Record<string, number>;
  average_stress?: number;
  weekly_trends: WeeklyTrendItem[];
  recent_interventions: Intervention[];
  summary_text: string;
}
