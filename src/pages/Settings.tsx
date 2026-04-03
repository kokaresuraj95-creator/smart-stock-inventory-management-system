import React, { useState, useEffect } from 'react';
import { Save, User, Bell, Shield, Store, Palette, Globe, CreditCard, Check } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form State
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('smartStoreSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      storeName: 'Smart Stock Pro',
      storeEmail: 'admin@smartstock.com',
      phone: '+1 234 567 890',
      address: '123 Business St',
      city: 'New York',
      country: 'USA',
      fullName: 'Admin User',
      emailNotification: true,
      pushNotification: true,
      smsAlerts: false,
      twoFactor: false,
      darkMode: false,
      fontSize: 'Medium'
    };
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API delay
    setTimeout(() => {
      localStorage.setItem('smartStoreSettings', JSON.stringify(settings));
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const SaveButton = ({ label }: { label: string }) => (
    <div className="pt-4 flex items-center gap-4">
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        icon={saved ? <Check className="text-white" /> : <Save />}
        className={cn("transition-all duration-300", saved && "bg-green-600 hover:bg-green-700")}
      >
        {isSaving ? 'Saving...' : saved ? 'Saved Successfully!' : label}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in relative">
      <h1 className="text-3xl font-bold text-gradient">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          {/* Success Toast Overlay */}
          <div className={cn(
            "absolute top-0 left-0 right-0 bg-green-500 text-white px-4 py-2 text-center text-sm font-medium transform transition-transform duration-300 z-10",
            saved ? "translate-y-0" : "-translate-y-full"
          )}>
            Preferences saved completely!
          </div>

          <div className={cn("transition-opacity duration-300", saved && "opacity-50")}>
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold">General Settings</h2>
                <div className="space-y-4">
                  <Input label="Store Name" value={settings.storeName} onChange={(e) => updateSetting('storeName', e.target.value)} />
                  <Input label="Store Email" type="email" value={settings.storeEmail} onChange={(e) => updateSetting('storeEmail', e.target.value)} />
                  <Input label="Phone" value={settings.phone} onChange={(e) => updateSetting('phone', e.target.value)} />
                  <Input label="Address" value={settings.address} onChange={(e) => updateSetting('address', e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" value={settings.city} onChange={(e) => updateSetting('city', e.target.value)} />
                    <Input label="Country" value={settings.country} onChange={(e) => updateSetting('country', e.target.value)} />
                  </div>
                  <SaveButton label="Save Changes" />
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold">Profile Settings</h2>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md">
                    {settings.fullName.charAt(0)}
                  </div>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <div className="space-y-4">
                  <Input label="Full Name" value={settings.fullName} onChange={(e) => updateSetting('fullName', e.target.value)} />
                  <Input label="Email Account" type="email" value={settings.storeEmail} onChange={(e) => updateSetting('storeEmail', e.target.value)} />
                  <Input label="Role" value="System Administrator" disabled />
                  <SaveButton label="Update Profile" />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                <div className="space-y-4">
                  <ToggleSwitch 
                    label="Email Notifications" 
                    description="Receive low stock alerts and daily summaries" 
                    checked={settings.emailNotification} 
                    onChange={(v) => updateSetting('emailNotification', v)} 
                  />
                  <ToggleSwitch 
                    label="Push Notifications" 
                    description="Real-time browser notifications for new orders" 
                    checked={settings.pushNotification} 
                    onChange={(v) => updateSetting('pushNotification', v)} 
                  />
                  <ToggleSwitch 
                    label="SMS Alerts" 
                    description="Critical inventory shortage alerts sent to phone" 
                    checked={settings.smsAlerts} 
                    onChange={(v) => updateSetting('smsAlerts', v)} 
                  />
                  <SaveButton label="Save Preferences" />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold">Security Settings</h2>
                <div className="space-y-4">
                  <Input label="Current Password" type="password" placeholder="••••••••" />
                  <Input label="New Password" type="password" placeholder="••••••••" />
                  <ToggleSwitch 
                    label="Two-Factor Authentication" 
                    description="Add an extra layer of security using Google Authenticator" 
                    checked={settings.twoFactor} 
                    onChange={(v) => updateSetting('twoFactor', v)} 
                  />
                  <SaveButton label="Update Security" />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold">Appearance Settings</h2>
                <div className="space-y-4">
                  <ToggleSwitch 
                    label="Dark Mode Default" 
                    description="Note: The theme toggle in the header overrides this temporarily." 
                    checked={settings.darkMode} 
                    onChange={(v) => updateSetting('darkMode', v)} 
                  />
                  <div>
                    <p className="text-sm font-medium mb-2">Interface Scale / Font Size</p>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500/50"
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', e.target.value)}
                    >
                      <option>Small</option>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>
                  <SaveButton label="Save Appearance" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) => (
  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
    <div>
      <p className="font-medium">{label}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className={cn("block w-14 h-8 rounded-full transition-colors", checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600')} />
      <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform", checked ? 'translate-x-6' : '')} />
    </div>
  </label>
);

export default Settings;