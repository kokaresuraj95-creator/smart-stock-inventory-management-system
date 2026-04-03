// ─── Types ────────────────────────────────────────────────────────────────────
export interface Product {
  _id: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  supplier: string;
  sku?: string;
  description?: string;
  status?: string;
  stockStatus?: string;
  createdAt?: string;
}

export interface OrderItem {
  product?: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  id?: string;
  orderId: string;
  customer: string;
  email?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: Date | string;
  notes?: string;
  createdAt?: string;
}

export interface Supplier {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  status?: string;
  productsSupplied?: number;
  totalOrders?: number;
  lastOrder?: string;
}

export interface Alert {
  _id: string;
  id?: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  read: boolean;
  timestamp: Date | string;
  product?: { _id: string; name: string } | null;
  order?: { _id: string; orderId: string; customer: string } | null;
}

export interface SalesDataPoint {
  name: string;
  sales: number;
  profit: number;
  orders?: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  stock?: number;
  avgPrice?: number;
}

// ─── Utility helpers (in-memory fallback for chart/stats when API unavailable) ─
export const products: Product[] = [];
export const orders: Order[] = [];
export const suppliers: Supplier[] = [];
export const alerts: Alert[] = [];
export const salesData: SalesDataPoint[] = [
  { name: 'Jan', sales: 4000, profit: 1000 },
  { name: 'Feb', sales: 6200, profit: 1550 },
  { name: 'Mar', sales: 5800, profit: 1450 },
  { name: 'Apr', sales: 7100, profit: 1775 },
  { name: 'May', sales: 8500, profit: 2125 },
  { name: 'Jun', sales: 9200, profit: 2300 },
];
