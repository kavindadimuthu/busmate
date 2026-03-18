import * as React from "react";
import { FileText, CheckCircle, XCircle, Clock, Users, MapPin } from "lucide-react";
import { StatsCard, StatsCardGrid } from "@busmate/ui";

interface PermitStats {
  totalPermits?: number;
  activePermits?: number;
  inactivePermits?: number;
  expiringSoonPermits?: number;
  permitsByOperator?: Record<string, number>;
  permitsByRouteGroup?: Record<string, number>;
}

interface PermitsStatsCardsNewProps {
  stats: PermitStats | null;
}

export function PermitsStatsCardsNew({ stats }: PermitsStatsCardsNewProps) {
  const safe = stats || {
    totalPermits: 0,
    activePermits: 0,
    inactivePermits: 0,
    expiringSoonPermits: 0,
    permitsByOperator: {},
    permitsByRouteGroup: {},
  };

  const totalOperators = Object.keys(safe.permitsByOperator || {}).length;
  const totalRouteGroups = Object.keys(safe.permitsByRouteGroup || {}).length;

  return (
    <StatsCardGrid className="lg:grid-cols-6">
      <StatsCard
        title="Total Permits"
        value={(safe.totalPermits || 0).toLocaleString()}
        icon={<FileText className="h-5 w-5" />}
      />
      <StatsCard
        title="Active"
        value={(safe.activePermits || 0).toLocaleString()}
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Inactive"
        value={(safe.inactivePermits || 0).toLocaleString()}
        icon={<XCircle className="h-5 w-5" />}
      />
      <StatsCard
        title="Expiring Soon"
        value={(safe.expiringSoonPermits || 0).toLocaleString()}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatsCard
        title="Operators"
        value={totalOperators.toLocaleString()}
        icon={<Users className="h-5 w-5" />}
      />
      <StatsCard
        title="Route Groups"
        value={totalRouteGroups.toLocaleString()}
        icon={<MapPin className="h-5 w-5" />}
      />
    </StatsCardGrid>
  );
}
