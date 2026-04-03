import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Star, Phone, Mail, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { supplierApi } from '../lib/api';
import type { Supplier } from '../lib/data';

const emptyForm = { name: '', email: '', phone: '', address: '', category: '', rating: '0', notes: '' };

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await supplierApi.getAll(searchTerm ? { search: searchTerm } : undefined) as any;
      if (res.success) setSuppliers(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [searchTerm]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openAdd = () => { setSelected(null); setForm(emptyForm); setError(''); setIsModalOpen(true); };
  const openEdit = (s: Supplier) => {
    setSelected(s);
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', category: s.category || '', rating: String(s.rating || 0), notes: '' });
    setError(''); setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { setError('Supplier name is required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone, address: form.address, category: form.category, rating: Number(form.rating) };
      if (selected) await supplierApi.update(selected._id, payload);
      else await supplierApi.create(payload);
      setIsModalOpen(false); fetchSuppliers();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await supplierApi.delete(id); setSuppliers((p) => p.filter((s) => s._id !== id)); }
    catch (err: any) { alert(err.message); }
  };

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient">Suppliers</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSuppliers} icon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          <Button onClick={openAdd} icon={<Plus />}>Add Supplier</Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input placeholder="Search suppliers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="w-4 h-4" />} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier._id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{supplier.name}</h3>
                  {supplier.category && <p className="text-sm text-primary-600 dark:text-primary-400">{supplier.category}</p>}
                </div>
                <Badge variant={supplier.status === 'active' ? 'success' : 'danger'}>{supplier.status}</Badge>
              </div>

              <div className="space-y-2 mb-3">
                {supplier.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Mail className="w-4 h-4" />{supplier.email}</div>}
                {supplier.phone && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Phone className="w-4 h-4" />{supplier.phone}</div>}
              </div>

              <div className="flex items-center gap-1 mb-4">{renderStars(supplier.rating)}<span className="text-sm text-gray-500 ml-1">({supplier.rating?.toFixed(1)})</span></div>

              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500">{supplier.productsSupplied || 0} products</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{supplier.totalOrders || 0} orders</span>
                <div className="flex gap-1 ml-auto">
                  <button onClick={() => openEdit(supplier)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(supplier._id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Edit Supplier' : 'Add Supplier'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : selected ? 'Update' : 'Add'} Supplier</Button></>}
      >
        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Rating (0-5)" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Suppliers;