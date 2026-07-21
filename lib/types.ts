// Shared domain types for the TeachAlike frontend.

export type Role = 'parent' | 'teacher' | 'admin';

export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Account {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: string;
  is_banned?: boolean;
  children_count?: number;
}

export interface ChildStats {
  total_sessions?: number;
  total_game_results?: number;
}

export interface Child {
  id: number;
  name: string;
  age: number;
  reading_level: ReadingLevel;
  parent_id?: number;
  stats?: ChildStats;
}

export interface Book {
  id: number;
  title: string;
  age_group: string;
  reading_level: ReadingLevel;
  text_content?: string;
}

export interface MiniGame {
  id: number;
  game_type: string;
  difficulty: string;
  rules?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

export interface GameResult {
  id: number;
  game_id: number;
  score: number;
}

export interface ProgressEntry {
  page?: number;
  accuracy?: number;
  [key: string]: unknown;
}

export interface ReadingSession {
  id: number;
  child_id: number;
  book_id: number;
  started_at: string;
  is_complete: boolean;
  progress_log?: ProgressEntry[];
}

export interface PronunciationCheck {
  correct: boolean;
  accuracy: number;
  points_awarded: number;
  already_awarded: boolean;
  message: string;
}

export type FeedbackType = 'praise' | 'correction' | 'tip';

export interface SessionFeedback {
  id: number;
  feedback_type: FeedbackType;
  feedback_text: string;
  created_at: string;
  audio_url?: string;
}

export type VoiceProfileStatus = 'processing' | 'ready' | 'failed';

export interface VoiceProfile {
  id: number;
  label?: string;
  status: VoiceProfileStatus;
  created_at: string;
  voice_sample_url?: string;
  owner_name?: string;
}

export interface LeaderboardEntry {
  id: number;
  rank: number;
  child_id: number;
  child_name: string;
  points: number;
  streak_count?: number;
}

export interface LeaderboardResponse {
  week_start?: string;
  leaderboard: LeaderboardEntry[];
}

export interface ApiErrorShape {
  message: string;
  fields: string[];
  status?: number;
}
