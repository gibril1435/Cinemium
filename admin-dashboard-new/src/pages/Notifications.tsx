import React, { useState, useEffect } from 'react';
import api from '../api';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
  read: boolean;
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/notifications');
      setNotifications(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load notifications');
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/admin/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError('Failed to delete notification');
    }
  };

  if (loading) return <div className="p-4">Loading notifications...</div>;
  if (error) return <div className="p-4 text-[var(--error)]">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500">No notifications</div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow p-4 ${
                !notification.read ? 'border-l-4 border-[var(--primary)]' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn btn-secondary"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications; 