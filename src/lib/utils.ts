// Merge class names (zero-dependency cn utility)
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ');

// Format currency as USD
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

// Format large numbers with commas
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Calculate stock badge variant based on stock vs threshold
export const calculateStockStatus = (
  stock: number,
  threshold: number
): 'success' | 'warning' | 'danger' => {
  if (stock === 0) return 'danger';
  if (stock <= threshold) return 'warning';
  return 'success';
};

// Format date to human-readable string
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format relative time (e.g. "2 hours ago")
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Truncate long strings
export const truncate = (str: string, maxLength = 40): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '…';
};

// Capitalize first letter
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);
