'use client';

import { useMemo } from 'react';
import { RouteWorkspaceData, DirectionEnum } from '@/types/RouteWorkspaceData';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  /** Which section the issue belongs to, for grouping */
  section: 'route-group' | 'outbound' | 'inbound';
}

export interface RouteValidationSummary {
  /** Is the form valid enough to submit? (no errors) */
  canSubmit: boolean;
  /** Total counts */
  errorCount: number;
  warningCount: number;
  infoCount: number;
  /** All issues */
  issues: ValidationIssue[];
  /** Per-section readiness */
  sections: {
    routeGroup: { status: 'ok' | 'error' | 'warning'; label: string };
    outbound: { status: 'ok' | 'error' | 'warning' | 'empty'; label: string };
    inbound: { status: 'ok' | 'error' | 'warning' | 'empty'; label: string };
  };
  /** High-level completion percentage */
  completionPercent: number;
}

export function useRouteValidation(data: RouteWorkspaceData): RouteValidationSummary {
  return useMemo(() => {
    const issues: ValidationIssue[] = [];

    // ── Route Group Validation ──
    if (!data.routeGroup.name?.trim()) {
      issues.push({
        severity: 'error',
        field: 'Route Group Name',
        message: 'Route group name is required',
        section: 'route-group',
      });
    }

    // ── Per-Route Validation ──
    const outboundRoute = data.routeGroup.routes.find(r => r.direction === DirectionEnum.OUTBOUND);
    const inboundRoute = data.routeGroup.routes.find(r => r.direction === DirectionEnum.INBOUND);

    const validateRoute = (route: typeof outboundRoute, section: 'outbound' | 'inbound') => {
      if (!route) return;

      const dirLabel = section === 'outbound' ? 'Outbound' : 'Inbound';

      if (!route.name?.trim()) {
        issues.push({
          severity: 'error',
          field: `${dirLabel} Route Name`,
          message: `${dirLabel} route name is required`,
          section,
        });
      }

      const stops = route.routeStops || [];
      if (stops.length < 2) {
        issues.push({
          severity: 'error',
          field: `${dirLabel} Stops`,
          message: `${dirLabel} route needs at least 2 stops (start and end)`,
          section,
        });
      }

      // Check for stops without names
      const unnamedStops = stops.filter(s => !s.stop.name?.trim());
      if (unnamedStops.length > 0) {
        issues.push({
          severity: 'error',
          field: `${dirLabel} Stop Names`,
          message: `${unnamedStops.length} stop(s) missing names`,
          section,
        });
      }

      // Check for stops without coordinates
      const noCoordStops = stops.filter(s =>
        !s.stop.location?.latitude || !s.stop.location?.longitude ||
        (s.stop.location.latitude === 0 && s.stop.location.longitude === 0)
      );
      if (noCoordStops.length > 0) {
        issues.push({
          severity: 'warning',
          field: `${dirLabel} Coordinates`,
          message: `${noCoordStops.length} stop(s) missing coordinates`,
          section,
        });
      }

      // Check for stops without distances  
      const noDistStops = stops.filter(s => s.distanceFromStart === null);
      if (noDistStops.length > 0 && stops.length > 1) {
        issues.push({
          severity: 'info',
          field: `${dirLabel} Distances`,
          message: `${noDistStops.length} stop(s) without distances (will be calculated)`,
          section,
        });
      }

      // Check for new stops (not yet in database)
      const newStops = stops.filter(s => !s.stop.id);
      if (newStops.length > 0) {
        issues.push({
          severity: 'info',
          field: `${dirLabel} New Stops`,
          message: `${newStops.length} new stop(s) will be created on submit`,
          section,
        });
      }
    };

    validateRoute(outboundRoute, 'outbound');
    validateRoute(inboundRoute, 'inbound');

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    // Compute section status
    const sectionStatus = (section: 'route-group' | 'outbound' | 'inbound') => {
      const sectionIssues = issues.filter(i => i.section === section);
      if (sectionIssues.some(i => i.severity === 'error')) return 'error' as const;
      if (sectionIssues.some(i => i.severity === 'warning')) return 'warning' as const;
      return 'ok' as const;
    };

    const outboundStatus = outboundRoute ? sectionStatus('outbound') : 'empty' as const;
    const inboundStatus = inboundRoute ? sectionStatus('inbound') : 'empty' as const;

    // Completion percentage (rough heuristic)
    let totalChecks = 4; // group name + name for each route direction + at least 2 stops
    let passedChecks = 0;
    if (data.routeGroup.name?.trim()) passedChecks++;
    if (outboundRoute?.name?.trim()) passedChecks++;
    if (outboundRoute && outboundRoute.routeStops.length >= 2) passedChecks++;
    if (outboundRoute && outboundRoute.routeStops.every(s => s.stop.name?.trim())) passedChecks++;
    // Inbound is optional but counts if present
    if (inboundRoute) {
      totalChecks += 2;
      if (inboundRoute.name?.trim()) passedChecks++;
      if (inboundRoute.routeStops.length >= 2) passedChecks++;
    }

    const completionPercent = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    return {
      canSubmit: errorCount === 0 && (outboundRoute !== undefined || inboundRoute !== undefined),
      errorCount,
      warningCount,
      infoCount,
      issues,
      sections: {
        routeGroup: {
          status: sectionStatus('route-group'),
          label: data.routeGroup.name?.trim() ? data.routeGroup.name : 'Unnamed',
        },
        outbound: {
          status: outboundStatus,
          label: outboundRoute
            ? `${outboundRoute.routeStops.length} stops`
            : 'Not started',
        },
        inbound: {
          status: inboundStatus,
          label: inboundRoute
            ? `${inboundRoute.routeStops.length} stops`
            : 'Not started',
        },
      },
      completionPercent,
    };
  }, [data]);
}
