import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import Chart from '../components/Chart';
import Table from '../components/Table';
import Badge from '../components/Badge';
import { analyticsApi, orderApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import { formatCurrency, formatNumber, calculateStockStatus, formatDate } from '../lib/utils';
import type { Order, SalesDataPoint, Product } from '../lib/data';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, salesRes, catRes] = await Promise.all([
        analyticsApi.getDashboard() as Promise<any>,
        analyticsApi.getSales('monthly') as Promise<any>,
        analyticsApi.getCategories() as Promise<any>,
      ]);

      if (dashRes.success) {
        const d = dashRes.data;
        setStats({
          totalProducts: d.totalProducts,
          totalOrders: d.totalOrders,
          lowStockProducts: d.lowStockProducts,
          totalRevenue: d.totalRevenue,
        });
        setRecentOrders(d.recentOrders || []);
        setTopProducts(d.topProducts || []);
      }
      if (salesRes.success) setSalesData(salesRes.data || []);
      if (catRes.success) setCategoryData(catRes.data || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // fallback refresh every 30s

    // Real-time Socket.IO Triggers
    const socket = getSocket();
    const handleRealtimeUpdate = () => {
      console.log('Real-time event received, refreshing dashboard...');
      fetchData();
    };

    socket.on('stock_alert', handleRealtimeUpdate);
    socket.on('product_updated', handleRealtimeUpdate);
    socket.on('new_order', handleRealtimeUpdate);
    socket.on('order_status_updated', handleRealtimeUpdate);

    return () => {
      clearInterval(interval);
      socket.off('stock_alert', handleRealtimeUpdate);
      socket.off('product_updated', handleRealtimeUpdate);
      socket.off('new_order', handleRealtimeUpdate);
      socket.off('order_status_updated', handleRealtimeUpdate);
    };
  }, [fetchData]);

  const orderColumns = [
    { key: 'orderId', header: 'Order ID' },
    { key: 'customer', header: 'Customer' },
    {
      key: 'total',
      header: 'Total',
      render: (order: Order) => formatCurrency(order.total),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: Order) => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
          delivered: 'success',
          shipped: 'info',
          processing: 'warning',
          pending: 'warning',
          cancelled: 'danger',
        };
        return <Badge variant={variants[order.status] || 'info'}>{order.status}</Badge>;
      },
    },
    {
      key: 'date',
      header: 'Date',
      render: (order: Order) => formatDate(order.date),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Products" value={formatNumber(stats.totalProducts)} icon={<Package className="w-6 h-6" />} trend={12} trendLabel="vs last month" color="primary" />
        <StatsCard title="Total Orders" value={formatNumber(stats.totalOrders)} icon={<ShoppingCart className="w-6 h-6" />} trend={8} trendLabel="vs last month" color="success" />
        <StatsCard title="Low Stock Items" value={formatNumber(stats.lowStockProducts)} icon={<AlertTriangle className="w-6 h-6" />} trend={-5} trendLabel="vs last month" color="danger" />
        <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="w-6 h-6" />} trend={15} trendLabel="vs last month" color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart data={salesData} type="area" dataKeys={['sales', 'profit']} title="Sales Overview" height={300} />
        <Chart data={salesData} type="bar" dataKeys={['sales']} title="Monthly Sales" height={300} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <Table data={recentOrders} columns={orderColumns} onRowClick={(order) => navigate('/orders')} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold mb-4">Stock Status</h3>
          <div className="space-y-4">
            {topProducts.slice(0, 5).map((product) => {
              const status = calculateStockStatus(product.stock, product.threshold);
              return (
                <div key={product._id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                  </div>
                  <Badge variant={status}>{status === 'danger' ? 'Critical' : status === 'warning' ? 'Low' : 'Good'}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold mb-4">Top Categories</h3>
          <Chart data={categoryData} type="pie" dataKeys={['value']} height={200} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/products?action=add')}
              className="w-full p-3 text-left bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:scale-[1.02] transition-all duration-200">
              <p className="font-medium text-primary-700 dark:text-primary-300">Add New Product</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create a new product listing</p>
            </button>
            <button 
              onClick={() => navigate('/orders?action=create')}
              className="w-full p-3 text-left bg-green-50 dark:bg-green-900/20 rounded-xl hover:scale-[1.02] transition-all duration-200">
              <p className="font-medium text-green-700 dark:text-green-300">Create Order</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Process a new customer order</p>
            </button>
            <button 
              onClick={() => navigate('/products?filter=low_stock')}
              className="w-full p-3 text-left bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:scale-[1.02] transition-all duration-200">
              <p className="font-medium text-yellow-700 dark:text-yellow-300">Restock Items</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review low stock inventory</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;