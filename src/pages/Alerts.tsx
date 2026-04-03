import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import AlertItem from '../components/AlertItem';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { alertApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import type { Alert } from '../lib/data';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filter === 'unread') params.read = 'false';
      if (filter === 'read') params.read = 'true';
      const res = await alertApi.getAll(params) as any;
      if (res.success) {
        setAlerts(res.data);
        setUnreadCount(res.unreadCount ?? res.data.filter((a: Alert) => !a.read).length);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Real-time alert updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    socket.on('new_alert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((c) => c + 1);
    });
    socket.on('alert_read', ({ id }: { id: string }) => {
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
    socket.on('alerts_all_read', () => {
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    });
    return () => { socket.off('new_alert'); socket.off('alert_read'); socket.off('alerts_all_read'); };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await alertApi.markRead(id);
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertApi.markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleDismiss = async (id: string) => {
    try {
      await alertApi.delete(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    } catch (err) { console.error(err); }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unread') return !a.read;
    if (filter === 'read') return a.read;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient">Alerts & Notifications</h1>
        <Button variant="outline" icon={<CheckCheck />} onClick={handleMarkAllRead}>Mark All Read</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Total Alerts</p><p className="text-2xl font-bold">{alerts.length}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Unread</p><p className="text-2xl font-bold text-red-600">{unreadCount}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Read</p><p className="text-2xl font-bold text-green-600">{alerts.length - unreadCount}</p></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <Badge variant={unreadCount > 0 ? 'danger' : 'success'} pulse={unreadCount > 0}>{unreadCount} unread</Badge>
          </div>
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
          ) : filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div key={alert._id} onClick={() => !alert.read && handleMarkRead(alert._id)} className="cursor-pointer">
                <AlertItem
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  timestamp={new Date(alert.timestamp)}
                  read={alert.read}
                  onDismiss={() => handleDismiss(alert._id)}
                />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No alerts found</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {filteredAlerts.length} of {alerts.length} alerts</p>
          <Button variant="ghost" size="sm" onClick={fetchAlerts}>Refresh</Button>
        </div>
      </div>
    </div>
  );
};

export default Alerts;