'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Calendar,
  Plus,
  Eye,
  Edit,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ScheduleManagementService } from '@busmate/api-client-route';
import type {
  RouteResponse,
  ScheduleResponse,
} from '@busmate/api-client-route';

// ── Types ─────────────────────────────────────────────────────────

interface RouteSchedulesTabProps {
  route: RouteResponse;
}

// ── Helper functions ──────────────────────────────────────────────

function getFirstStopDepartureTime(schedule: ScheduleResponse): string | null {
  if (!schedule.scheduleStops || schedule.scheduleStops.length === 0) return null;
  return schedule.scheduleStops[0].departureTime || null;
}

function getLastStopArrivalTime(schedule: ScheduleResponse): string | null {
  if (!schedule.scheduleStops || schedule.scheduleStops.length === 0) return null;
  return schedule.scheduleStops[schedule.scheduleStops.length - 1].arrivalTime || null;
}

function formatTime(timeString?: string | null): string {
  if (!timeString) return '--:--';
  try {
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes} ${period}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
}

function getStatusConfig(status?: string) {
  switch (status) {
    case 'ACTIVE':
      return {
        icon: CheckCircle,
        bg: 'bg-success/10',
        text: 'text-success',
        border: 'border-success/20',
      };
    case 'INACTIVE':
      return {
        icon: XCircle,
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
      };
    case 'PENDING':
      return {
        icon: Clock,
        bg: 'bg-warning/10',
        text: 'text-warning',
        border: 'border-warning/20',
      };
    case 'CANCELLED':
      return {
        icon: XCircle,
        bg: 'bg-destructive/10',
        text: 'text-destructive',
        border: 'border-destructive/20',
      };
    default:
      return {
        icon: AlertCircle,
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
      };
  }
}

function getDaysOfWeek(calendars?: any[]): boolean[] {
  const days = [false, false, false, false, false, false, false];
  if (!calendars || calendars.length === 0) return days;
  
  const c = calendars[0];
  days[0] = !!c?.monday;
  days[1] = !!c?.tuesday;
  days[2] = !!c?.wednesday;
  days[3] = !!c?.thursday;
  days[4] = !!c?.friday;
  days[5] = !!c?.saturday;
  days[6] = !!c?.sunday;
  
  return days;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Component ─────────────────────────────────────────────────────

export function RouteSchedulesTab({ route }: RouteSchedulesTabProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    if (!route.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await ScheduleManagementService.getSchedulesByRoute(
        route.id,
        undefined,
        0,
        100,
        'name',
        'asc'
      );

      // Sort by departure time
      const sortedSchedules = (response.content || []).sort((a, b) => {
        const aTime = getFirstStopDepartureTime(a);
        const bTime = getFirstStopDepartureTime(b);
        if (!aTime || !bTime) return 0;
        return aTime.localeCompare(bTime);
      });

      setSchedules(sortedSchedules);
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  }, [route.id]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-32 h-12 bg-secondary rounded" />
              <div className="flex-1">
                <div className="h-4 bg-secondary rounded w-40 mb-2" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive/80" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Failed to Load Schedules</h3>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <button
          onClick={loadSchedules}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground/70" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">No Schedules</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
          Create schedules to define when buses operate on this route.
        </p>
        <button
          onClick={() => router.push(`/mot/schedules/add-new?routeId=${route.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>
    );
  }

  // Active and inactive counts
  const activeCount = schedules.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = schedules.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Schedules</h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{schedules.length} total</span>
            <span className="text-muted-foreground/50">|</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              {activeCount} active
            </span>
            {inactiveCount > 0 && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/70" />
                  {inactiveCount} inactive
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push(`/mot/schedules/add-new?routeId=${route.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      {/* Schedule cards */}
      <div className="space-y-3">
        {schedules.map((schedule) => {
          const statusConfig = getStatusConfig(schedule.status);
          const StatusIcon = statusConfig.icon;
          const days = getDaysOfWeek(schedule.scheduleCalendars);
          const departTime = formatTime(getFirstStopDepartureTime(schedule));
          const arriveTime = formatTime(getLastStopArrivalTime(schedule));

          return (
            <div
              key={schedule.id}
              className="group bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
              onClick={() => router.push(`/mot/schedules/${schedule.id}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Time display */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="text-center px-3 py-2 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-foreground">{departTime}</div>
                    <div className="text-xs text-muted-foreground">Depart</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                  <div className="text-center px-3 py-2 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-foreground">{arriveTime}</div>
                    <div className="text-xs text-muted-foreground">Arrive</div>
                  </div>
                </div>

                {/* Schedule info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground truncate">
                      {schedule.name || 'Unnamed Schedule'}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {schedule.status}
                    </span>
                    {schedule.scheduleType && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          schedule.scheduleType === 'SPECIAL'
                            ? 'bg-[hsl(var(--purple-50))] text-[hsl(var(--purple-700))]'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {schedule.scheduleType}
                      </span>
                    )}
                  </div>

                  {/* Days of week */}
                  <div className="flex items-center gap-1">
                    {DAY_LABELS.map((day, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded ${
                          days[i]
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground/70'
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/mot/schedules/${schedule.id}`);
                    }}
                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/mot/schedules/${schedule.id}/edit`);
                    }}
                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
