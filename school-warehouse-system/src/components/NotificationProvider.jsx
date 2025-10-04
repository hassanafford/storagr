import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToNotifications, subscribeToBroadcast, unsubscribeAll } from '../services/realtimeService';
import { formatEgyptianDateTime } from '../lib/timeUtils';
import { getEgyptianTime } from '../lib/timeUtils';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // الاستماع للإشعارات الفورية من Supabase
  useEffect(() => {
    // الحصول على معلومات المستخدم الحالي
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    const user = JSON.parse(userStr);

    // الاستماع للإشعارات من جدول notifications
    const notificationSub = subscribeToNotifications((notification) => {
      addNotification({
        type: notification.type || 'info',
        message: notification.message,
        details: notification.details?.message || null,
        timestamp: notification.created_at || getEgyptianTime().toISOString()
      });
    }, user.id);

    // الاستماع للـ broadcast notifications (للإشعارات العامة)
    const broadcastSub = subscribeToBroadcast('notifications', 'notification', (payload) => {
      addNotification({
        ...payload,
        timestamp: payload.timestamp || getEgyptianTime().toISOString()
      });
    });

    // تنظيف الاشتراكات عند إلغاء التحميل
    return () => {
      notificationSub.unsubscribe();
      broadcastSub.unsubscribe();
    };
  }, []);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const timestamp = notification.timestamp || getEgyptianTime().toISOString();
    
    setNotifications(prev => [...prev, { 
      ...notification, 
      id,
      timestamp 
    }]);

    // Auto remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2" dir="rtl">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg flex items-start max-w-md ${notification.type === 'success'
                ? 'bg-green-100 border border-green-200 text-green-800'
                : notification.type === 'error'
                  ? 'bg-red-100 border border-red-200 text-red-800'
                  : notification.type === 'warning'
                    ? 'bg-yellow-100 border border-yellow-200 text-yellow-800'
                    : 'bg-blue-100 border border-blue-200 text-blue-800'
              }`}
          >
            <div className="mr-2 mt-0.5">
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : notification.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : notification.type === 'warning' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
              {notification.details && (
                <p className="text-xs mt-1">{notification.details}</p>
              )}
              {notification.quantity && (
                <p className="text-xs mt-1">الكمية: {Math.abs(notification.quantity)}</p>
              )}
              {notification.timestamp && (
                <p className="text-xs mt-1 text-gray-500">
                  {formatEgyptianDateTime(notification.timestamp)}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};