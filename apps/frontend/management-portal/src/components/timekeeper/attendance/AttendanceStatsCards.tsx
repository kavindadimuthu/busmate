'use client';

import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  CalendarOff,
} from 'lucide-react';
import { Card, CardContent } from '@busmate/ui';
import { AttendanceStats } from '@/data/timekeeper/types';

interface AttendanceStatsCardsProps {
  stats: AttendanceStats;
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

export function AttendanceStatsCards({ stats, className = '' }: AttendanceStatsCardsProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      <StatCard
        title="Total Staff"
        value={stats.totalStaff}
        icon={<Users className="h-5 w-5 text-primary" />}
        color="text-primary"
        bgColor="bg-primary/10 border-primary/20"
      />
      <StatCard
        title="Present"
        value={stats.presentCount}
        icon={<UserCheck className="h-5 w-5 text-success" />}
        color="text-success"
        bgColor="bg-success/10 border-success/20"
      />
      <StatCard
        title="Late"
        value={stats.lateCount}
        icon={<Clock className="h-5 w-5 text-warning" />}
        color="text-warning"
        bgColor="bg-warning/10 border-warning/20"
      />
      <StatCard
        title="Absent"
        value={stats.absentCount}
        icon={<UserX className="h-5 w-5 text-destructive" />}
        color="text-destructive"
        bgColor="bg-destructive/10 border-destructive/20"
      />
      <StatCard
        title="On Leave"
        value={stats.onLeaveCount}
        icon={<CalendarOff className="h-5 w-5 text-[hsl(var(--purple-600))]" />}
        color="text-[hsl(var(--purple-600))]"
        bgColor="bg-[hsl(var(--purple-50))] border-[hsl(var(--purple-200))]"
      />
    </div>
  );
}
