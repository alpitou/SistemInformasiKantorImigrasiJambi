import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: '1', 
      title: 'Simpanan Wajib', 
      message: 'Simpanan wajib bulan Maret telah berhasil didebet.', 
      time: '2 jam yang lalu', 
      read: false,
      type: 'success'
    },
    { 
      id: '2', 
      title: 'Pinjaman Disetujui', 
      message: 'Pengajuan pinjaman Anda sebesar Rp 5.000.000 telah disetujui.', 
      time: '1 hari yang lalu', 
      read: true,
      type: 'success'
    },
  ]);

  const addNotification = (newNotif: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const notification: Notification = {
      ...newNotif,
      id: Math.random().toString(36).substr(2, 9),
      time: 'Baru saja',
      read: false,
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
