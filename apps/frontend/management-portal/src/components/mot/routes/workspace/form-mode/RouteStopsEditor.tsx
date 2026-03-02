'use client';

import { useState } from 'react';
import RouteStopsList from "./RouteStopsList";
import RouteStopsMap from "./RouteStopsMap";
import StopEditor from "./StopEditor";

interface RouteStopsEditorProps {
    routeIndex: number;
}

export default function RouteStopsEditor({ routeIndex }: RouteStopsEditorProps) {
    const [stopEditorCollapsed, setStopEditorCollapsed] = useState(false);
    const [routeStopsMapCollapsed, setRouteStopsMapCollapsed] = useState(false);

    const columns = [];
    if (stopEditorCollapsed) {
        columns.push('48px');
    } else {
        columns.push('1fr');
    }
    columns.push('2fr');
    if (routeStopsMapCollapsed) {
        columns.push('48px');
    } else {
        columns.push('2fr');
    }
    const gridTemplateColumns = columns.join(' ');

    return (
        <>
            <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700">Route Stops Editor</h3>
                </div>
                <div className="grid  " style={{ gridTemplateColumns }}>
                    <StopEditor collapsed={stopEditorCollapsed} onToggle={() => setStopEditorCollapsed(!stopEditorCollapsed)} />
                    <RouteStopsList routeIndex={routeIndex} />
                    <RouteStopsMap collapsed={routeStopsMapCollapsed} onToggle={() => setRouteStopsMapCollapsed(!routeStopsMapCollapsed)} routeIndex={routeIndex} />
                </div>
            </div>
        </>
    )
}





