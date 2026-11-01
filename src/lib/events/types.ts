/** Eventos da guild (WoE/GvG/MVP) + confirmação de presença. */

export type EventType = "WoE" | "GvG" | "MVP" | "Outro";
export type Attendance = "vou" | "talvez" | "nao";

export interface GuildEvent {
  id: string;
  title: string;
  type: EventType;
  /** Data/hora de início em ISO. */
  startsAt: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateEventInput {
  title: string;
  type: EventType;
  startsAt: string;
  notes?: string;
  createdBy: string;
}

/** Contagem de presenças de um evento. */
export interface AttendanceCounts {
  vou: number;
  talvez: number;
  nao: number;
}

export interface EventsRepository {
  list(): Promise<GuildEvent[]>;
  create(input: CreateEventInput): Promise<GuildEvent>;
  remove(id: string): Promise<void>;
  /** Presenças de um evento: memberId -> status. */
  getAttendance(eventId: string): Promise<Record<string, Attendance>>;
  setAttendance(
    eventId: string,
    memberId: string,
    status: Attendance
  ): Promise<void>;
}
