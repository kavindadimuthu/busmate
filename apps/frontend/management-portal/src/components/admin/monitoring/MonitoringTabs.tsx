'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@busmate/ui';
import { Activity, AlertTriangle, Cpu, Globe, LayoutDashboard } from 'lucide-react';

const monitoringTabs = [
  { value: 'overview', label: 'Overview', href: '/admin/monitoring', icon: LayoutDashboard },
  { value: 'performance', label: 'Performance', href: '/admin/monitoring?tab=performance', icon: Activity },
  { value: 'resources', label: 'Resources', href: '/admin/monitoring?tab=resources', icon: Cpu },
  { value: 'alerts', label: 'Alerts', href: '/admin/monitoring?tab=alerts', icon: AlertTriangle },
  { value: 'api', label: 'API', href: '/admin/monitoring?tab=api', icon: Globe },
] as const;

export function MonitoringTabs() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  return (
    <Tabs value={activeTab}>
      <TabsList className="w-1/2">
        {monitoringTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={tab.href}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
