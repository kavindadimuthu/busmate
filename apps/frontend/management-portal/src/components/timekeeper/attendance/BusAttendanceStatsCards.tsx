'use client';

import { 
  Bus, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BusAttendanceStats } from '@/data/timekeeper/types';

interface BusAttendanceStatsCardsProps {
  stats: BusAttendanceStats;
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

export function BusAttendanceStatsCards({ stats, className = '' }: BusAttendanceStatsCardsProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      <StatCard
        title="Total Buses"
        value={stats.totalBusesToday}
        icon={<Bus className="h-5 w-5 text-blue-600" />}
        color="text-blue-600"
        bgColor="bg-blue-50 border-blue-200"
      />
      <StatCard
        title="On Time"
        value={stats.arrivedOnTime}
        icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        color="text-green-600"
        bgColor="bg-green-50 border-green-200"
      />
      <StatCard
        title="Delayed"
        value={stats.delayed}
        icon={<Clock className="h-5 w-5 text-yellow-600" />}
        color="text-yellow-600"
        bgColor="bg-yellow-50 border-yellow-200"
      />
      <StatCard
        title="Missed"
        value={stats.missed}
        icon={<XCircle className="h-5 w-5 text-red-600" />}
        color="text-red-600"
        bgColor="bg-red-50 border-red-200"
      />
      <StatCard
        title="Expected"
        value={stats.expectedToday}
        icon={<AlertTriangle className="h-5 w-5 text-purple-600" />}
        color="text-purple-600"
        bgColor="bg-purple-50 border-purple-200"
      />
    </div>
  );
}
