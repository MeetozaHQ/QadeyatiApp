import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { syncReminders, type NotificationRow } from "@/lib/notifications";

export function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { count: c } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setCount(c ?? 0);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      await syncReminders(user.id);
      if (mounted) await refresh();
    })();
    const t = setInterval(refresh, 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [user, refresh]);

  return { count, refresh };
}

export function useNotifications(filter: "all" | "unread" | "critical" = "all") {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter === "unread") q = q.eq("is_read", false);
    if (filter === "critical") q = q.eq("priority", "حرج");
    const { data } = await q;
    setItems((data ?? []) as NotificationRow[]);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}
