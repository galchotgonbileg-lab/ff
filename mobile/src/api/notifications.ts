import { apiClient } from "./client";
import { User } from "./types";

export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW";

export interface AppNotification {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: User;
  recipe: { id: string; title: string; imageUrl: string | null } | null;
  restaurant: { id: string; name: string; imageUrl: string | null } | null;
}

export function getNotifications() {
  return apiClient
    .get<{ notifications: AppNotification[] }>("/api/notifications")
    .then((r) => r.data.notifications);
}

export function getUnreadCount() {
  return apiClient.get<{ count: number }>("/api/notifications/unread-count").then((r) => r.data.count);
}

export function markNotificationsRead() {
  return apiClient.post<{ ok: true }>("/api/notifications/read").then((r) => r.data);
}
