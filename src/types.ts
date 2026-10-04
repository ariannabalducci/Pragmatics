export type MessageRole = "user" | "model";

export interface MessagePart {
  text: string;
}

export interface Message {
  role: MessageRole;
  parts: MessagePart[];
}

export type ChatHistory = Message[];

export interface StoryInteraction {
  parrot_msg?: string;
  character1_msg?: string;
  character2_msg?: string;
  background_img?: string;
  character1_img?: string;
  character2_img?: string;
  object_img?: string;
  options?: string[];
  correct_option?: number;
}

export interface ChildData {
  id: string;
  name: string;
  age: number;
  gender: string;
  sessionsCompleted?: number;
}

export interface Appointment {
  id: string;
  childName: string;
  startTime: string;
  duration: string; // e.g. "45 min"
  type: string;
}

export interface ExerciseOption {
  id: string;
  displayName: string;
  topic: string;
  groupType: string;
  groupTypeLabel: string;
}

export interface PatientListItem {
  id: string;
  name: string;
  surname: string;
  age: number;
  diagnosis: string | null;
  totalSessions: number;
  lastSessionDate: string | null;
  initials: string;
}
