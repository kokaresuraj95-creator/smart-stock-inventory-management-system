import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, Plus, RefreshCw } from 'lucide-react';
import Table from '../components/Table';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { orderApi, productApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Order, Product } from '../lib/data';
import { getSocket } from '../lib/socket';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, delivered: 0, revenue: 0 });
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', email: '', productId: '', quantity: '1', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        orderApi.getAll(searchTerm ? { search: searchTerm } : undefined) as Promise<any>,
        orderApi.getStats() as Promise<any>,
      ]);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [searchTerm]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    productApi.getAll().then((res: any) => { if (res.success) setProducts(res.data); });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.on('order_created', (o: Order) => setOrders((prev) => [o, ...prev]));
    socket.on('order_updated', (o: Order) => setOrders((prev) => prev.map((x) => (x._id === o._id ? o : x))));
    return () => { socket.off('order_created'); socket.off('order_updated'); };
  }, []);

  const getVariant = (status: Order['status']): 'success' | 'warning' | 'info' | 'danger' => {
    const m: Record<string, 'success' | 'warning' | 'info' | 'danger'> = { delivered: 'success', shipped: 'info', processing: 'warning', pending: 'warning', cancelled: 'danger' };
    return m[status] || 'info';
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.update(orderId, { status });
      fetchOrders();
      setViewOrder(null);
    } catch (err: any) { alert(err.message); }
  };

  const handleCreateOrder = async () => {
    if (!form.customer || !form.productId) { setError('Customer and product are required'); return; }
    setSaving(true);
    try {
      const product = products.find((p) => p._id === form.productId);
      if (!product) { setError('Product not found'); return; }
      const qty = Number(form.quantity);
      await orderApi.create({
        customer: form.customer,
        email: form.email,
        items: [{ product: product._id, productName: product.name, quantity: qty, price: product.price }],
        total: product.price * qty,
        notes: form.notes,
      });
      setIsAddOpen(false);
      setForm({ customer: '', email: '', productId: '', quantity: '1', notes: '' });
      fetchOrders();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const columns = [
    { key: 'orderId', header: 'Order ID' },
    { key: 'customer', header: 'Customer' },
    { key: 'items', header: 'Items', render: (o: Order) => o.items?.length || 0 },
    { key: 'total', header: 'Total', render: (o: Order) => formatCurrency(o.total) },
    { key: 'status', header: 'Status', render: (o: Order) => <Badge variant={getVariant(o.status)} pulse={o.status === 'processing'}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</Badge> },
    { key: 'date', header: 'Date', render: (o: Order) => formatDate(o.date) },
    { key: 'actions', header: 'Actions', render: (o: Order) => <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={(e) => { e.stopPropagation(); setViewOrder(o); }}><Eye className="w-4 h-4" /></button> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient">Orders</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders} icon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          <Button icon={<Plus />} onClick={() => { setError(''); setIsAddOpen(true); }}>New Order</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Processing</p><p className="text-2xl font-bold text-blue-600">{stats.processing}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p></div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1"><Input placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="w-4 h-4" />} /></div>
        <Button variant="outline" icon={<Filter />}>Filter</Button>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
        : <Table data={orders} columns={columns} onRowClick={(o) => setViewOrder(o)} />}

      {/* View/Update Order Modal */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.orderId}`} size="lg"
        footer={<Button variant="ghost" onClick={() => setViewOrder(null)}>Close</Button>}
      >
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Customer</p><p className="font-medium">{viewOrder.customer}</p></div>
              <div><p className="text-sm text-gray-500">Date</p><p className="font-medium">{formatDate(viewOrder.date)}</p></div>
              <div><p className="text-sm text-gray-500">Total</p><p className="font-medium">{formatCurrency(viewOrder.total)}</p></div>
              <div><p className="text-sm text-gray-500">Status</p><Badge variant={getVariant(viewOrder.status)}>{viewOrder.status}</Badge></div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Items</p>
              <div className="space-y-2">
                {viewOrder.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                    <span>{item.productName} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => handleUpdateStatus(viewOrder._id, s)}
                    className={`px-3 py-1 rounded-lg text-sm capitalize transition-all ${viewOrder.status === s ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-100'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Order Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Order" size="lg"
        footer={<><Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleCreateOrder} disabled={saving}>{saving ? 'Creating...' : 'Create Order'}</Button></>}
      >
        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <Input label="Customer Name *" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product *</label>
            <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select product...</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} — ${p.price} (Stock: {p.stock})</option>)}
            </select>
          </div>
          <Input label="Quantity *" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
};

export default Orders;