'use client';

import {
  Route as RouteIcon,
  Globe,
  Calendar,
  User,
} from 'lucide-react';
import type { RouteGroupResponse } from '../../../../../generated/api-clients/route-management';

// ── Types ─────────────────────────────────────────────────────────

interface RouteGroupDetailsSectionProps {
  routeGroup: RouteGroupResponse;
}

// ── Helper functions ──────────────────────────────────────────────

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

// ── Component ─────────────────────────────────────────────────────

export function RouteGroupDetailsSection({ routeGroup }: RouteGroupDetailsSectionProps) {
  return (
    <div className="bg-white rounded-lg border-l-3 border-blue-600 shadow-sm overflow-hidden">
      {/* Gradient header bar */}
      {/* <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" /> */}
      
      <div className="p-4">
        {/* Main header row */}
        <div className="flex items-start gap-3">
            {/* Route group icon */}
            <div className="shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <RouteIcon className="w-5 h-5 text-white" />
            </div>
            
            {/* Title and ID */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {routeGroup.name || 'Unnamed Route Group'}
              </h1>
              
              {/* Multi-language names and ID on same line */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {(routeGroup.nameSinhala || routeGroup.nameTamil) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Globe className="w-3 h-3 text-gray-400" />
                    {routeGroup.nameSinhala && (
                      <span className="font-medium">{routeGroup.nameSinhala}</span>
                    )}
                    {routeGroup.nameSinhala && routeGroup.nameTamil && (
                      <span className="text-gray-300 mx-0.5">·</span>
                    )}
                    {routeGroup.nameTamil && (
                      <span className="font-medium">{routeGroup.nameTamil}</span>
                    )}
                  </div>
                )}
                
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-gray-500 bg-gray-100 rounded">
                  ID: {routeGroup.id}
                </span>
              </div>
            </div>
          </div>
        
        {/* Description and Stats Combined */}
        <div className="mt-3 space-y-3">
          {/* Description */}
          {routeGroup.description && (
            <p className="text-gray-600 text-xs leading-relaxed">
              {routeGroup.description}
            </p>
          )}
          
        </div>
        
        {/* Inline metadata footer */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            {routeGroup.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>Created {formatDate(routeGroup.createdAt)}</span>
              </div>
            )}
            {routeGroup.createdBy && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" />
                <span>{routeGroup.createdBy}</span>
              </div>
            )}
            {routeGroup.updatedAt && routeGroup.updatedAt !== routeGroup.createdAt && (
              <div className="flex items-center gap-1">
                <span className="text-gray-300">·</span>
                <span>Updated {formatDate(routeGroup.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
