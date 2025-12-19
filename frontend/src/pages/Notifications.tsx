import { useState, useEffect } from 'react';
import api from '../services/api';

export function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data || data);
        } catch { }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            loadNotifications();
        } catch { }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            loadNotifications();
        } catch { }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div>
            <div>
                <div>
                    <h2>Notificações</h2>
                    {unreadCount > 0 && (
                        <button onClick={markAllAsRead}>
                            Marcar todas como lidas
                        </button>
                    )}
                </div>

                <div>
                    {notifications.length === 0 ? (
                        <p>Nenhuma notificação.</p>
                    ) : (
                        notifications.map(notification => (
                            <div key={notification.id}>
                                <div>
                                    <h5>{notification.title}</h5>
                                    <small>{new Date(notification.createdAt).toLocaleString()}</small>
                                </div>
                                <p>{notification.message}</p>
                                {!notification.isRead && (
                                    <button onClick={() => markAsRead(notification.id)}>
                                        Marcar como lida
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
