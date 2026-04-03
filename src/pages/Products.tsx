import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Filter, RefreshCw } from 'lucide-react';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { productApi } from '../lib/api';
import { formatCurrency, calculateStockStatus } from '../lib/utils';
import type { Product } from '../lib/data';
import { getSocket } from '../lib/socket';

const emptyForm = { name: '', category: '', price: '', stock: '', threshold: '10', supplier: '', sku: '' };

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productApi.getAll(searchTerm ? { search: searchTerm } : undefined) as any;
      if (res.success) setProducts(res.data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    socket.on('product_created', (p: Product) => setProducts((prev) => [p, ...prev]));
    socket.on('product_updated', (p: Product) =>
      setProducts((prev) => prev.map((x) => (x._id === p._id ? p : x)))
    );
    socket.on('product_deleted', ({ id }: { id: string }) =>
      setProducts((prev) => prev.filter((x) => x._id !== id))
    );
    return () => {
      socket.off('product_created');
      socket.off('product_updated');
      socket.off('product_deleted');
    };
  }, []);

  const openAdd = () => { setSelectedProduct(null); setForm(emptyForm); setError(''); setIsModalOpen(true); };
  const openEdit = (p: Product) => {
    setSelectedProduct(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), threshold: String(p.threshold), supplier: p.supplier, sku: p.sku || '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.price || !form.stock) {
      setError('Please fill in all required fields'); return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, category: form.category, price: Number(form.price), stock: Number(form.stock), threshold: Number(form.threshold), supplier: form.supplier, sku: form.sku };
      if (selectedProduct) {
        await productApi.update(selectedProduct._id, payload);
      } else {
        await productApi.create(payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productApi.delete(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Product Name' },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price', render: (p: Product) => formatCurrency(p.price) },
    {
      key: 'stock',
      header: 'Stock',
      render: (p: Product) => (
        <div className="flex items-center gap-2">
          <span>{p.stock}</span>
          <Badge variant={calculateStockStatus(p.stock, p.threshold)}>
            {p.stock === 0 ? 'Out' : p.stock <= p.threshold ? 'Low' : 'In Stock'}
          </Badge>
        </div>
      ),
    },
    { key: 'supplier', header: 'Supplier' },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Product) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient">Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts} icon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          <Button onClick={openAdd} icon={<Plus />}>Add Product</Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="w-4 h-4" />} />
        </div>
        <Button variant="outline" icon={<Filter />}>Filter</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
      ) : (
        <Table data={products} columns={columns} onRowClick={(p) => openEdit(p)} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedProduct ? 'Edit Product' : 'Add New Product'} size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : selectedProduct ? 'Update' : 'Create'} Product</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <Input label="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Category *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price ($) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Stock *" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Low Stock Threshold" type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
};

export default Products;