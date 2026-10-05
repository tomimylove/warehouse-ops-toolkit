export interface Team {
  id: string;
  name: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  authorId: string;
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  visibleToAll: boolean;
  teams: Team[];
  isRead: boolean;
  coverId: string | null;
}

export interface AnnouncementComment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface AnnouncementVersion {
  id: string;
  snapshot: { title: string; body: string; pinned: boolean; visibleToAll: boolean; teamIds: string[] } | null;
  changes: string[];
  activity: boolean;
  message: string | null;
  savedAt: string;
  savedBy: { id: string; name: string };
}
