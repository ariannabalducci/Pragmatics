export type MessageRole = "user" | "model";

export interface MessagePart {
  text: string;
}

export interface Message {
  role: MessageRole;
  parts: MessagePart[];
}

export type ChatHistory = Message[];

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
