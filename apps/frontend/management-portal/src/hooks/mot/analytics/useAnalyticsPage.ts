import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { Button } from '@busmate/ui';
import { useAnalytics } from './useAnalytics';

export function useAnalyticsPage() {
  useSetPageMetadata({
    title: 'Analytics Dashboard',
    description: 'Comprehensive data insights and performance analytics for MOT operations',
    activeItem: 'analytics',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Analytics' }],
  });

  const analytics = useAnalytics();
  const { loading, isLive, setIsLive, lastRefresh, loadData, handleExport } = analytics;

  useSetPageActions(
    React.createElement('div', { className: 'flex items-center gap-2' },
      React.createElement('span', { className: 'text-xs text-muted-foreground/70 hidden sm:inline' },
        `Updated ${lastRefresh.toLocaleTimeString()}`
      ),
      React.createElement(Button, {
        variant: isLive ? 'default' : 'outline',
        size: 'sm',
        onClick: () => setIsLive((prev: boolean) => !prev),
        className: isLive ? 'bg-success/15 text-success hover:bg-success/20 border-success/20' : '',
        children: isLive ? '● Live' : '○ Live',
      }),
      React.createElement(Button, {
        variant: 'outline',
        size: 'icon',
        onClick: loadData,
        disabled: loading,
        title: 'Refresh data',
        children: React.createElement(RefreshCw, { className: `h-4 w-4 ${loading ? 'animate-spin' : ''}` }),
      }),
      React.createElement(Button, { onClick: handleExport, children: [
        React.createElement(Download, { key: 'icon', className: 'h-4 w-4' }),
        React.createElement('span', { key: 'label', className: 'hidden sm:inline' }, 'Export Report'),
      ]}),
    )
  );

  return analytics;
}
