'use client';

import RouteStopsList from "./RouteStopsList";
import RouteStopsMap from "./RouteStopsMap";
import StopEditor from "./StopEditor";
import { useState } from 'react';

interface RouteStopsEditorProps {
    routeIndex: number;
}

export default function RouteStopsEditor({ routeIndex }: RouteStopsEditorProps) {
    const [routeStopsMapCollapsed, setRouteStopsMapCollapsed] = useState(false);

    return (
        <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="px-5 py-3 bg-muted border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground">Route Stops Editor</h3>
            </div>

            {/* Two-column layout: stops list + map */}
            <div
                className="grid"
                style={{ gridTemplateColumns: routeStopsMapCollapsed ? '1fr 48px' : '1fr 1fr' }}
            >
                <RouteStopsList routeIndex={routeIndex} />
                <RouteStopsMap
                    collapsed={routeStopsMapCollapsed}
                    onToggle={() => setRouteStopsMapCollapsed(!routeStopsMapCollapsed)}
                    routeIndex={routeIndex}
                />
            </div>

            {/* StopEditor renders as a fixed right-side slide-over overlay */}
            <StopEditor />
        </div>
    );
}





