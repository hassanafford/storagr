import { supabase } from '../db';

let notificationChannel = null;
const subscribers = new Set();

const NOTIFICATION_CHANNEL_NAME = 'notifications';
const NOTIFICATION_EVENT = 'notification';

export const initNotificationWebSocket = (callback) => {
    const isCallable = typeof callback === 'function';

    if (isCallable) {
        subscribers.add(callback);
    }

    if (notificationChannel) {
        return notificationChannel;
    }

    notificationChannel = supabase.channel(NOTIFICATION_CHANNEL_NAME);

    notificationChannel.on(
        'broadcast',
        { event: NOTIFICATION_EVENT },
        ({ payload }) => {
            subscribers.forEach((subscriber) => {
                try {
                    subscriber(payload ?? {});
                } catch (error) {
                    console.error('Notification subscriber error:', error);
                }
            });
        }
    );

    notificationChannel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
            console.error('WebSocket subscription error: notification channel');
        }
    });

    return notificationChannel;
};

export const disconnectWebSocket = () => {
    if (!notificationChannel) {
        return;
    }

    supabase.removeChannel(notificationChannel);
    notificationChannel = null;
    subscribers.clear();
};