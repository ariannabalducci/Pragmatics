// src/types.ts

export type MessageRole = "user" | "parrot";

export interface MessagePart {
  text: string;
}

export interface Message {
  role: MessageRole;
  parts: MessagePart[];
}

export interface ChatHistory extends Array<Message> {}

export interface GenerationConfig {
  temperature: number;
  topP: number;
  responseMimeType: string;
}

export interface ChatSettings {
  temperature: number;
  model: string;
  systemInstruction: string;
}

// Raggruppiamo i tipi relativi ai pazienti
export interface PatientListItem {
  id: string; // userId nel tuo schema
  name: string;
  surname: string;
  age: number;
  diagnosis: string | null; // mappato su child.description
  totalSessions: number;    // calcolato dal numero di ExerciseAttempt o Appointments
  lastSessionDate: string | null; // preso dall'ultimo Appointment
  initials: string;         // es: "MR"
}

// Mantieni questo se ti serve per il dettaglio del bambino
export interface ChildData {
  id: string;
  name: string;
  age: number;
  gender: string;
  sessionsCompleted?: number;
}

export interface Appointment {
  id: string;
  childName: string; // Questo nel DB è child.user.name
  startTime: string;
  time?: string;
  duration: number; // In minuti o stringa "45 min" a seconda di come lo salvi
  type: string;
}

// Aggiungi queste al tuo src/types.ts

export interface PatientDetail extends PatientListItem {
  objectives: string[];
  notes: string;
  appointments: ScheduledAppointment[];
}

export interface ScheduledAppointment {
  id: string;
  date: string; // es: "2026-04-18"
  time: string; // es: "10:00"
  duration: string; // es: "45 min"
  tags: string[]; // es: ["Training"]
  exercises: ProgrammedExercise[];
}

export interface ProgrammedExercise {
  id: string;
  title: string;
  description: string;
  type: string; // es: "Narrazione"
  duration: string; // es: "15 min"
}