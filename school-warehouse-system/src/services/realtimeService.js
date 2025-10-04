/**
 * Supabase Realtime Service
 * يوفر خدمات الاستماع للتحديثات الفورية من قاعدة البيانات
 */

import { supabase } from '../db';

// قنوات الاستماع النشطة
const activeChannels = new Map();
const subscribers = new Map();

/**
 * الاستماع لتغييرات جدول معين
 * @param {string} table - اسم الجدول
 * @param {string} event - نوع الحدث (INSERT, UPDATE, DELETE, *)
 * @param {function} callback - دالة يتم استدعاؤها عند حدوث تغيير
 * @param {object} filter - فلتر اختياري للبيانات
 * @returns {object} معلومات القناة للإلغاء لاحقاً
 */
export const subscribeToTable = (table, event = '*', callback, filter = null) => {
    const channelName = `${table}_${event}_${Date.now()}`;

    // إنشاء قناة جديدة
    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: event,
                schema: 'public',
                table: table,
                ...(filter && { filter: filter })
            },
            (payload) => {
                console.log(`Realtime event on ${table}:`, payload);
                callback(payload);
            }
        )
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`✅ Subscribed to ${table} (${event})`);
            } else if (status === 'CHANNEL_ERROR') {
                console.error(`❌ Error subscribing to ${table}`);
            }
        });

    // حفظ القناة للإلغاء لاحقاً
    activeChannels.set(channelName, channel);

    return {
        channelName,
        unsubscribe: () => unsubscribeFromChannel(channelName)
    };
};

/**
 * الاستماع لتحديثات المخزون (items)
 * @param {function} callback - دالة يتم استدعاؤها عند تحديث العناصر
 * @param {number} warehouseId - معرف المستودع (اختياري)
 */
export const subscribeToInventoryUpdates = (callback, warehouseId = null) => {
    const filter = warehouseId ? `warehouse_id=eq.${warehouseId}` : null;

    return subscribeToTable('items', '*', (payload) => {
        // معالجة التحديث
        const { eventType, new: newRecord, old: oldRecord } = payload;

        callback({
            type: eventType,
            item: newRecord || oldRecord,
            changes: newRecord && oldRecord ? {
                quantityChange: newRecord.quantity - oldRecord.quantity
            } : null
        });
    }, filter);
};

/**
 * الاستماع للمعاملات الجديدة (transactions)
 * @param {function} callback - دالة يتم استدعاؤها عند إضافة معاملة
 * @param {number} userId - معرف المستخدم (اختياري)
 */
export const subscribeToTransactions = (callback, userId = null) => {
    const filter = userId ? `user_id=eq.${userId}` : null;

    return subscribeToTable('transactions', 'INSERT', (payload) => {
        callback(payload.new);
    }, filter);
};

/**
 * الاستماع للإشعارات (notifications)
 * @param {function} callback - دالة يتم استدعاؤها عند إضافة إشعار
 * @param {number} userId - معرف المستخدم
 */
export const subscribeToNotifications = (callback, userId = null) => {
    const filter = userId ? `user_id=eq.${userId}` : null;

    return subscribeToTable('notifications', 'INSERT', (payload) => {
        callback(payload.new);
    }, filter);
};

/**
 * إلغاء الاشتراك من قناة معينة
 * @param {string} channelName - اسم القناة
 */
export const unsubscribeFromChannel = async (channelName) => {
    const channel = activeChannels.get(channelName);

    if (channel) {
        await supabase.removeChannel(channel);
        activeChannels.delete(channelName);
        console.log(`🔌 Unsubscribed from ${channelName}`);
    }
};

/**
 * إلغاء جميع الاشتراكات النشطة
 */
export const unsubscribeAll = async () => {
    for (const [channelName, channel] of activeChannels.entries()) {
        await supabase.removeChannel(channel);
        console.log(`🔌 Unsubscribed from ${channelName}`);
    }

    activeChannels.clear();
    subscribers.clear();
    console.log('✅ All subscriptions cleared');
};

/**
 * إرسال إشعار broadcast لجميع المستخدمين المتصلين
 * @param {string} channelName - اسم القناة
 * @param {string} event - اسم الحدث
 * @param {object} payload - البيانات المرسلة
 */
export const broadcastNotification = async (channelName, event, payload) => {
    const channel = supabase.channel(channelName);

    await channel.send({
        type: 'broadcast',
        event: event,
        payload: payload
    });
};

/**
 * الاستماع لـ broadcast notifications
 * @param {string} channelName - اسم القناة
 * @param {string} event - اسم الحدث
 * @param {function} callback - دالة يتم استدعاؤها عند استقبال broadcast
 */
export const subscribeToBroadcast = (channelName, event, callback) => {
    const channel = supabase
        .channel(channelName)
        .on('broadcast', { event: event }, ({ payload }) => {
            callback(payload);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`✅ Subscribed to broadcast: ${channelName}/${event}`);
            }
        });

    activeChannels.set(`broadcast_${channelName}_${event}`, channel);

    return {
        channelName: `broadcast_${channelName}_${event}`,
        unsubscribe: () => unsubscribeFromChannel(`broadcast_${channelName}_${event}`)
    };
};

/**
 * Hook مخصص لـ React للاستماع للتحديثات الفورية
 * استخدمه في مكونات React
 */
export const useRealtimeSubscription = (table, event, callback, dependencies = []) => {
    // يمكن استخدامه مع useEffect في React
    // مثال:
    // useEffect(() => {
    //   const subscription = subscribeToTable('items', '*', handleUpdate);
    //   return () => subscription.unsubscribe();
    // }, []);
};

// تصدير الوظائف الأساسية
export default {
    subscribeToTable,
    subscribeToInventoryUpdates,
    subscribeToTransactions,
    subscribeToNotifications,
    subscribeToBroadcast,
    broadcastNotification,
    unsubscribeFromChannel,
    unsubscribeAll
};