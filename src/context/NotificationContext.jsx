import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { notificationService } from '../services';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ unreadCount: 0, refreshCount: () => {} });

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    refreshCount();
    intervalRef.current = setInterval(refreshCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, [refreshCount]);

  const value = useMemo(() => ({ unreadCount, refreshCount }), [unreadCount, refreshCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
