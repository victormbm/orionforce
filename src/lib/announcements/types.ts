/** Mural de avisos da liderança. */

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  authorId: string;
}

export interface AnnouncementsRepository {
  list(): Promise<Announcement[]>;
  create(input: CreateAnnouncementInput): Promise<Announcement>;
  remove(id: string): Promise<void>;
}
