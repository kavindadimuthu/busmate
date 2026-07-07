'use client';

import { ArrowRight, Shield, Terminal, Activity, AlertTriangle } from 'lucide-react';
import type { getSecurityLogs, getApplicationLogs, getUserActivityLogs } from '@/data/admin';

type SecurityLog = ReturnType<typeof getSecurityLogs>[number];
type ApplicationLog = ReturnType<typeof getApplicationLogs>[number];
type UserActivityLog = ReturnType<typeof getUserActivityLogs>[number];

interface LogQuickAccessPanelsProps {
  recentSecurity: SecurityLog[];
  recentErrors: ApplicationLog[];
  recentUserActivity: UserActivityLog[];
  onViewSecurity: () => void;
  onViewApplication: () => void;
  onViewActivity: () => void;
  onViewLog: (id: string) => void;
}

export function LogQuickAccessPanels({
  recentSecurity,
  recentErrors,
  recentUserActivity,
  onViewSecurity,
  onViewApplication,
  onViewActivity,
  onViewLog,
}: LogQuickAccessPanelsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Critical Security Events */}
      <div className="bg-card rounded-xl border border-border overflow-hidden lg:col-span-1">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-warning/10 rounded-lg">
              <Shield className="h-4 w-4 text-warning" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Critical Security</h3>
          </div>
          <button
            onClick={onViewSecurity}
            className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recentSecurity.length > 0 ? (
          <div className="divide-y divide-border/30">
            {recentSecurity.map((log) => (
              <div
                key={log.id}
                className="p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onViewLog(log.id)}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      log.severity === 'critical' ? 'text-destructive/80' : 'text-warning/80'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          log.severity === 'critical'
                            ? 'bg-destructive text-white'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {log.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No critical security events
          </div>
        )}
      </div>

      {/* Recent Errors */}
      <div className="bg-card rounded-xl border border-border overflow-hidden lg:col-span-1">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-destructive/10 rounded-lg">
              <Terminal className="h-4 w-4 text-destructive" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Recent Errors</h3>
          </div>
          <button
            onClick={onViewApplication}
            className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recentErrors.length > 0 ? (
          <div className="divide-y divide-border/30">
            {recentErrors.map((log) => (
              <div
                key={log.id}
                className="p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onViewLog(log.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{log.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {log.service}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">No recent errors</div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border overflow-hidden lg:col-span-1">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-success/10 rounded-lg">
              <Activity className="h-4 w-4 text-success" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          </div>
          <button
            onClick={onViewActivity}
            className="text-xs text-primary hover:text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {recentUserActivity.length > 0 ? (
          <div className="divide-y divide-border/30">
            {recentUserActivity.map((log) => (
              <div
                key={log.id}
                className="p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onViewLog(log.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-medium">{log.userName}</span>{' '}
                    <span className="text-muted-foreground">{log.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        log.status === 'success'
                          ? 'bg-success/10 text-success'
                          : log.status === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono">
                      {log.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">No recent activity</div>
        )}
      </div>
    </div>
  );
}
