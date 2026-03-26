'use client';

import { 
  Bus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@busmate/ui';
import { DashboardStats } from '@/data/timekeeper/types';

interface StatsCardsProps {
  stats: DashboardStats;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}

function StatCard({ title, value, icon, description, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-primary/10 text-primary border-primary/20',
    green: 'bg-success/10 text-success border-success/20',
    yellow: 'bg-warning/10 text-warning border-warning/20',
    red: 'bg-destructive/10 text-destructive border-destructive/20',
    purple: 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-600))] border-[hsl(var(--purple-200))]',
    orange: 'bg-warning/10 text-warning border-orange-200',
  };

  const iconBgClasses = {
    blue: 'bg-primary/15',
    green: 'bg-success/15',
    yellow: 'bg-warning/15',
    red: 'bg-destructive/15',
    purple: 'bg-[hsl(var(--purple-100))]',
    orange: 'bg-warning/15',
  };

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                <span>{Math.abs(trend)}% from yesterday</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, className = '' }: StatsCardsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <StatCard
        title="Total Trips Today"
        value={stats.totalTripsToday}
        icon={<Bus className="h-5 w-5" />}
        color="blue"
        trend={5}
      />
      <StatCard
        title="Completed"
        value={stats.completedTrips}
        icon={<CheckCircle className="h-5 w-5" />}
        description={`${stats.activeTrips} active, ${stats.pendingTrips} pending`}
        color="green"
      />
      <StatCard
        title="On-Time Rate"
        value={`${stats.onTimePercentage}%`}
        icon={<Clock className="h-5 w-5" />}
        description="Performance metric"
        color="purple"
        trend={2.1}
      />
      <StatCard
        title="Delayed / Cancelled"
        value={`${stats.delayedTrips} / ${stats.cancelledTrips}`}
        icon={<AlertTriangle className="h-5 w-5" />}
        description="Requires attention"
        color={stats.delayedTrips > 2 ? 'red' : 'yellow'}
      />
    </div>
  );
}
