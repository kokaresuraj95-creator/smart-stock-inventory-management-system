import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/alerts', icon: Bell, label: 'Alerts', badge: 3 },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out',
          isOpen ? 'w-64' : 'w-20',
          'lg:translate-x-0',
          !isOpen && '-translate-x-full lg:translate-x-0'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className={cn('flex items-center gap-3', !isOpen && 'lg:justify-center')}>
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <span className="font-bold text-xl text-gradient animate-float">
                StockSmart
              </span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'sidebar-item group relative',
                  isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary-600 dark:text-primary-400')} />
                {isOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {!isOpen && isHovered && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap animate-scale-in z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className={cn(
            'p-4 bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl text-white',
            !isOpen && 'p-2'
          )}>
            {isOpen ? (
              <div className="space-y-2">
                <p className="text-xs opacity-90">Storage</p>
                <p className="text-lg font-bold">45% used</p>
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="w-[45%] h-full bg-white rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-white/30 rounded-full overflow-hidden">
                  <div className="w-full h-[45%] bg-white rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;