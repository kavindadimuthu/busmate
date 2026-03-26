'use client';

import { 
  Bus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent } from '@busmate/ui';
import { TripStats } from '@/data/timekeeper/types';

interface TripStatsCardsProps {
  stats: TripStats;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <Card className={`${bgColor} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-card/50`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TripStatsCards({ stats, className = '' }: TripStatsCardsProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-6 gap-4 ${className}`}>
      <StatCard
        title="Total Trips"
        value={stats.totalTrips}
        icon={<Calendar className="h-5 w-5 text-primary" />}
        color="text-primary"
        bgColor="bg-primary/10 border-primary/20"
      />
      <StatCard
        title="Scheduled"
        value={stats.scheduledTrips}
        icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        color="text-muted-foreground"
        bgColor="bg-muted border-border"
      />
      <StatCard
        title="In Progress"
        value={stats.inProgressTrips}
        icon={<Bus className="h-5 w-5 text-[hsl(var(--purple-600))]" />}
        color="text-[hsl(var(--purple-600))]"
        bgColor="bg-[hsl(var(--purple-50))] border-[hsl(var(--purple-200))]"
      />
      <StatCard
        title="Completed"
        value={stats.completedTrips}
        icon={<CheckCircle className="h-5 w-5 text-success" />}
        color="text-success"
        bgColor="bg-success/10 border-success/20"
      />
      <StatCard
        title="Delayed"
        value={stats.delayedTrips}
        icon={<AlertTriangle className="h-5 w-5 text-warning" />}
        color="text-warning"
        bgColor="bg-warning/10 border-warning/20"
      />
      <StatCard
        title="Cancelled"
        value={stats.cancelledTrips}
        icon={<XCircle className="h-5 w-5 text-destructive" />}
        color="text-destructive"
        bgColor="bg-destructive/10 border-destructive/20"
      />
    </div>
  );
}
