'use client';

import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  CalendarOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-white/50`}>
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
        icon={<Users className="h-5 w-5 text-blue-600" />}
        color="text-blue-600"
        bgColor="bg-blue-50 border-blue-200"
      />
      <StatCard
        title="Present"
        value={stats.presentCount}
        icon={<UserCheck className="h-5 w-5 text-green-600" />}
        color="text-green-600"
        bgColor="bg-green-50 border-green-200"
      />
      <StatCard
        title="Late"
        value={stats.lateCount}
        icon={<Clock className="h-5 w-5 text-yellow-600" />}
        color="text-yellow-600"
        bgColor="bg-yellow-50 border-yellow-200"
      />
      <StatCard
        title="Absent"
        value={stats.absentCount}
        icon={<UserX className="h-5 w-5 text-red-600" />}
        color="text-red-600"
        bgColor="bg-red-50 border-red-200"
      />
      <StatCard
        title="On Leave"
        value={stats.onLeaveCount}
        icon={<CalendarOff className="h-5 w-5 text-purple-600" />}
        color="text-purple-600"
        bgColor="bg-purple-50 border-purple-200"
      />
    </div>
  );
}
