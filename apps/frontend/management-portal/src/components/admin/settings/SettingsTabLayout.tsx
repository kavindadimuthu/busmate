'use client';

import { useState } from 'react';
import { Settings, Zap, Wrench, Database } from 'lucide-react';
import { GeneralSettingsPanel } from './GeneralSettingsPanel';
import { ApiSettingsPanel } from './ApiSettingsPanel';
import { MaintenanceSettingsPanel } from './MaintenanceSettingsPanel';
import { BackupSettingsPanel } from './BackupSettingsPanel';

// ── Tab definitions ──────────────────────────────────────────────

export type SettingsTab = 'general' | 'api' | 'maintenance' | 'backup';

const TABS: {
  key: SettingsTab;
  label: string;
  icon: React.ReactNode;
  color: { active: string; border: string };
}[] = [
  {
    key: 'general',
    label: 'General',
    icon: <Settings className="h-4 w-4" />,
    color: { active: 'text-blue-700 bg-blue-50', border: 'border-blue-500' },
  },
  {
    key: 'api',
    label: 'API Settings',
    icon: <Zap className="h-4 w-4" />,
    color: { active: 'text-violet-700 bg-violet-50', border: 'border-violet-500' },
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    icon: <Wrench className="h-4 w-4" />,
    color: { active: 'text-amber-700 bg-amber-50', border: 'border-amber-500' },
  },
  {
    key: 'backup',
    label: 'Backup & Restore',
    icon: <Database className="h-4 w-4" />,
    color: { active: 'text-green-700 bg-green-50', border: 'border-green-500' },
  },
];

// ── Component ────────────────────────────────────────────────────

interface SettingsTabLayoutProps {
  initialTab?: SettingsTab;
}

export function SettingsTabLayout({ initialTab = 'general' }: SettingsTabLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200">
        {/* ── Tab navigation ───────────────────────────── */}
        <div className="flex items-center border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? `${tab.color.active} ${tab.color.border}`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ──────────────────────────────── */}
        {activeTab === 'general' && <GeneralSettingsPanel />}
        {activeTab === 'api' && <ApiSettingsPanel />}
        {activeTab === 'maintenance' && <MaintenanceSettingsPanel />}
        {activeTab === 'backup' && <BackupSettingsPanel />}
      </div>
    </div>
  );
}
