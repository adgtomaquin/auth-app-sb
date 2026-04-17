"use client";
import { useState, useCallback } from "react";
import { notificationsApi, Notification } from "@/lib/api";

export function useNotifications(token: string) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const result = await notificationsApi.list(token);
    setLoading(false);
    if (result.data) {
      setItems(result.data.notifications);
      setUnreadCount(result.data.unreadCount);
    } else {
      setError(result.error ?? "Failed to load notifications");
    }
  }, [token]);

  const read = useCallback(async (id: string) => {
    await notificationsApi.markRead(token, id);
    refresh();
  }, [token, refresh]);

  const readAll = useCallback(async () => {
    await notificationsApi.markAllRead(token);
    refresh();
  }, [token, refresh]);

  const remove = useCallback(async (id: string) => {
    await notificationsApi.delete(token, id);
    refresh();
  }, [token, refresh]);

  return { items, unreadCount, loading, error, read, readAll, remove, refresh };
}
