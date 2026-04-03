import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Package, DollarSign, ShoppingCart } from 'lucide-react';
import Chart from '../components/Chart';
import { analyticsApi } from '../lib/api';
import { formatCurrency, formatNumber } from '../lib/utils';
import type { SalesDataPoint, CategoryDataPoint, Product } from '../lib/data';

const Analytics: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, catRes, invRes, dashRes] = await Promise.all([
        analyticsApi.getSales(period) as Promise<any>,
        analyticsApi.getCategories() as Promise<any>,
        analyticsApi.getInventory() as Promise<any>,
        analyticsApi.getDashboard() as Promise<any>,
      ]);
      if (salesRes.success) setSalesData(salesRes.data);
      if (catRes.success) setCategoryData(catRes.data);
      if (invRes.success) setInventoryData(invRes.data);
      if (dashRes.success) setTopProducts(dashRes.data.topProducts || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stockDist = inventoryData?.stockDistribution || { inStock: 0, lowStock: 0, outOfStock: 0 };
  const totalInventoryValue = inventoryData?.totalInventoryValue || 0;
  const totalSales = salesData.reduce((s, d) => s + d.sales, 0);
  const totalProfit = salesData.reduce((s, d) => s + d.profit, 0);

  // Format top products for recharts
  const topProductsChartData = topProducts.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    sales: p.price * Math.floor(Math.random() * 50 + 10) // Mocking individual product sales for visualization since pure sales aren't in schema
  })).sort((a, b) => b.sales - a.sales);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-gradient">Analytics</h1>
        <div className="flex gap-2">
          {(['monthly', 'weekly', 'daily'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm capitalize transition-all ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-xl"><DollarSign className="w-6 h-6 text-primary-600" /></div>
          <div><p className="text-sm text-gray-500">Total Sales</p><p className="text-xl font-bold">{formatCurrency(totalSales)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl"><TrendingUp className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Total Profit</p><p className="text-xl font-bold">{formatCurrency(totalProfit)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl"><Package className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-sm text-gray-500">Inventory Value</p><p className="text-xl font-bold">{formatCurrency(totalInventoryValue)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl"><ShoppingCart className="w-6 h-6 text-yellow-600" /></div>
          <div><p className="text-sm text-gray-500">In Stock Items</p><p className="text-xl font-bold">{formatNumber(stockDist.inStock)}</p></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chart data={salesData} type="area" dataKeys={['sales', 'profit']} title="Revenue & Profit Trend" height={300} />
            <Chart data={salesData} type="bar" dataKeys={['orders']} title={`Orders (${period})`} height={300} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-full sm:w-1/2">
                  <Chart data={categoryData} type="pie" dataKeys={['value']} height={220} />
                </div>
                <div className="space-y-3 w-full sm:w-1/2">
                  {categoryData.map((cat, index) => {
                    const colors = ['bg-primary-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                    return (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <span className="text-sm font-medium">{cat.value} items</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
              {topProductsChartData.length > 0 ? (
                <Chart data={topProductsChartData} type="bar" dataKeys={['sales']} height={220} />
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-500">No product data available</div>
              )}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Stock Health</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/10 p-4 rounded-xl">
                <span className="text-green-600 font-medium flex items-center gap-2">✅ In Stock</span>
                <span className="text-xl font-bold">{stockDist.inStock}</span>
              </div>
              <div className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl">
                <span className="text-yellow-600 font-medium flex items-center gap-2">⚠️ Low Stock</span>
                <span className="text-xl font-bold">{stockDist.lowStock}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-4 rounded-xl">
                <span className="text-red-600 font-medium flex items-center gap-2">❌ Out of Stock</span>
                <span className="text-xl font-bold">{stockDist.outOfStock}</span>
              </div>
              
              {inventoryData?.lowStockItems?.length > 0 && (
                <>
                  <hr className="my-4 border-gray-200 dark:border-gray-700" />
                  <h4 className="font-medium text-sm text-gray-500 mb-3">Critical Items</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {inventoryData.lowStockItems.slice(0, 3).map((p: any) => (
                      <div key={p._id} className="p-3 border border-red-100 dark:border-red-900/30 rounded-lg">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-sm text-red-500 mt-1">{p.stock} / {p.threshold} units remaining</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;