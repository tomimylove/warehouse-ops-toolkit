import { request } from '../../lib/rest-api-provider';
import type { Announcement, AnnouncementVersion, Team } from './types';

export interface AnnouncementInput {
  title: string;
  body: string;
  pinned?: boolean;
  visibleToAll?: boolean;
  teamIds?: string[];
  coverId?: string;
}

// Dedicated client (same reasoning as features/tasks/api.ts) — read
// tracking, versions, and team audience aren't flat CRUD.
export const announcementsApi = {
  list: () => request<Announcement[]>('/announcements'),
  get: (id: string) => request<Announcement>(`/announcements/${id}`),
  create: (data: AnnouncementInput) =>
    request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AnnouncementInput>) =>
    request<Announcement>(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/announcements/${id}`, { method: 'DELETE' }),

  markRead: (id: string) => request<void>(`/announcements/${id}/read`, { method: 'POST' }),
  markAllRead: () => request<void>('/announcements/mark-all-read', { method: 'POST' }),

  listVersions: (id: string) => request<AnnouncementVersion[]>(`/announcements/${id}/versions`),
  restoreVersion: (id: string, versionId: string) =>
    request<Announcement>(`/announcements/${id}/versions/${versionId}/restore`, { method: 'POST' }),

  listTeams: () => request<Team[]>('/teams'),
  createTeam: (name: string) => request<Team>('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
};
