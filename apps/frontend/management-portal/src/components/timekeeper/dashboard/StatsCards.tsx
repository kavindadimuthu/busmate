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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    orange: 'bg-orange-100',
  };

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
