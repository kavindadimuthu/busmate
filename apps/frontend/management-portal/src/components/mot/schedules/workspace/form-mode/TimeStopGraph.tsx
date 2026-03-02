'use client';

import React, { useMemo, useCallback } from 'react';
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace';
import { Clock, ZoomIn, ZoomOut, Move, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import service functions and types
import {
    Point,
    TooltipData,
    DEFAULT_MARGINS,
    calculateTimeRange,
    generateSchedulePoints,
    generateTimeAxisTicks,
    getScheduleColor,
    buildPathFromPoints,
    calculateChartDimensions,
    getScheduleStartTime,
    truncateStopName,
    getStopIndicatorColor,
    minutesToTime,
    createXScale,
    createYScale,
} from '@/services/timeStopGraph';

// Import custom hooks
import {
    usePanZoom,
    useTooltip,
    useScheduleVisibility,
    useContainerSize,
} from '@/hooks/useTimeStopGraph';

// ============================================================================
// Sub-Components
// ============================================================================

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
    return (
        <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">Time-Stop Graph</h3>
            </div>
            <div className="p-8 text-center text-slate-500">
                {icon}
                <p className="text-base font-medium text-slate-700">{title}</p>
                <p className="text-sm mt-2 text-slate-500">{description}</p>
            </div>
        </div>
    );
}

interface ZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
}

function ZoomControls({ onZoomIn, onZoomOut, onResetView }: ZoomControlsProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                    onClick={onZoomIn}
                    className="p-1.5 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm"
                    title="Zoom In"
                >
                    <ZoomIn className="h-4 w-4 text-slate-600" />
                </button>
                <button
                    onClick={onZoomOut}
                    className="p-1.5 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm ml-1"
                    title="Zoom Out"
                >
                    <ZoomOut className="h-4 w-4 text-slate-600" />
                </button>
                <button
                    onClick={onResetView}
                    className="p-1.5 bg-white rounded-md hover:bg-slate-50 transition-colors shadow-sm ml-1"
                    title="Reset View"
                >
                    <RotateCcw className="h-4 w-4 text-slate-600" />
                </button>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
                <Move className="h-3 w-3" /> Drag to pan, scroll to zoom
            </span>
        </div>
    );
}

interface TooltipProps {
    tooltip: TooltipData;
}

function Tooltip({ tooltip }: TooltipProps) {
    if (!tooltip.visible) return null;

    return (
        <div
            className="absolute pointer-events-none z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg"
            style={{
                left: tooltip.x + 15,
                top: tooltip.y - 10,
                transform: 'translateY(-50%)',
            }}
        >
            <div className="flex items-center gap-2 mb-1">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tooltip.color }}
                />
                <span className="font-medium">{tooltip.scheduleName}</span>
            </div>
            <div className="text-gray-300">
                <div>{tooltip.stopName}</div>
                <div className="font-mono">{tooltip.time}</div>
            </div>
        </div>
    );
}

interface LegendPanelProps {
    schedules: { name?: string; scheduleStops: { departureTime?: string }[] }[];
    activeScheduleIndex: number | null;
    visibleSchedules: Set<number>;
    onToggleVisibility: (index: number) => void;
    onShowAll: () => void;
    onHideAll: () => void;
    onScheduleClick: (index: number) => void;
}

function LegendPanel({
    schedules,
    activeScheduleIndex,
    visibleSchedules,
    onToggleVisibility,
    onShowAll,
    onHideAll,
    onScheduleClick,
}: LegendPanelProps) {
    return (
        <div className="w-48 bg-white rounded-md p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Schedules</span>
                <div className="flex gap-1">
                    <button
                        onClick={onShowAll}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Show All"
                    >
                        <Eye className="h-3 w-3" />
                    </button>
                    <button
                        onClick={onHideAll}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Hide All"
                    >
                        <EyeOff className="h-3 w-3" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {schedules.map((schedule, index) => {
                    const color = getScheduleColor(index);
                    const isVisible = visibleSchedules.has(index);
                    const isActive = activeScheduleIndex === index;
                    const firstStopTime = getScheduleStartTime(schedule);

                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                isActive ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-gray-50",
                                !isVisible && "opacity-50"
                            )}
                            onClick={() => onScheduleClick(index)}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleVisibility(index);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                {isVisible ? (
                                    <Eye className="h-3 w-3" />
                                ) : (
                                    <EyeOff className="h-3 w-3 text-gray-400" />
                                )}
                            </button>
                            <div
                                className="w-4 h-3 rounded-sm"
                                style={{ backgroundColor: color }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                    {schedule.name || `Schedule ${index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                    {firstStopTime.substring(0, 5)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend info */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span>First stop</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-600" />
                    <span>Last stop</span>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TimeStopGraph() {
    const { data, setActiveScheduleIndex, activeScheduleIndex, setHighlightedScheduleIndex } = useScheduleWorkspace();
    const { schedules, routeStops, selectedRouteId } = data;

    // Custom hooks for state management
    const { containerRef, containerSize } = useContainerSize();
    const {
        transform,
        isPanning,
        svgRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave: handlePanMouseLeave,
        handleZoomIn,
        handleZoomOut,
        handleResetView,
    } = usePanZoom();
    const { tooltip, handlePointMouseEnter, handlePointMouseLeave, hideTooltip } = useTooltip();
    const {
        visibleSchedules,
        toggleScheduleVisibility,
        showAllSchedules,
        hideAllSchedules
    } = useScheduleVisibility(schedules.length);

    // Calculate chart dimensions
    const { chartWidth, chartHeight, margin } = useMemo(() =>
        calculateChartDimensions(containerSize.width, containerSize.height, DEFAULT_MARGINS),
        [containerSize]
    );

    // Calculate time range from all schedules
    const { minTime, maxTime, timeRange } = useMemo(() =>
        calculateTimeRange(schedules),
        [schedules]
    );

    // Scale functions
    const xScale = useMemo(() =>
        createXScale(minTime, timeRange, chartWidth, margin.left),
        [minTime, timeRange, chartWidth, margin.left]
    );

    const yScale = useMemo(() =>
        createYScale(routeStops.length, chartHeight, margin.top),
        [routeStops.length, chartHeight, margin.top]
    );

    // Generate points for each schedule
    const schedulePoints = useMemo(() =>
        generateSchedulePoints(schedules, routeStops, xScale, yScale),
        [schedules, routeStops, xScale, yScale]
    );

    // Generate time axis ticks
    const timeAxisTicks = useMemo(() =>
        generateTimeAxisTicks(minTime, maxTime),
        [minTime, maxTime]
    );

    // Event handlers
    const handleMouseLeave = useCallback(() => {
        handlePanMouseLeave();
        hideTooltip();
    }, [handlePanMouseLeave, hideTooltip]);

    const handleScheduleClick = useCallback((scheduleIndex: number) => {
        setActiveScheduleIndex(scheduleIndex);
        setHighlightedScheduleIndex(scheduleIndex);
    }, [setActiveScheduleIndex, setHighlightedScheduleIndex]);

    const handlePointEnter = useCallback((point: Point, color: string, e: React.MouseEvent) => {
        handlePointMouseEnter(point, color, e, containerRef);
    }, [handlePointMouseEnter, containerRef]);

    // Render empty states
    if (!selectedRouteId) {
        return (
            <EmptyState
                icon={<Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />}
                title="Select a Route"
                description="Choose a route above to view the time-stop graph"
            />
        );
    }

    if (routeStops.length === 0) {
        return (
            <EmptyState
                icon={<Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />}
                title="No Stops Available"
                description="This route has no stops defined"
            />
        );
    }

    if (schedules.length === 0) {
        return (
            <EmptyState
                icon={<Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />}
                title="No Schedules"
                description="Add a schedule to see the time-stop visualization"
            />
        );
    }

    return (
        <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">
                    Time-Stop Graph
                </h3>

                <ZoomControls
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetView={handleResetView}
                />
            </div>

            <div className="flex gap-4">
                {/* Main graph area */}
                <div
                    ref={containerRef}
                    className="flex-1 bg-slate-50 overflow-hidden relative border-r border-slate-200"
                    style={{ height: '600px', cursor: isPanning ? 'grabbing' : 'grab' }}
                >
                    <svg
                        ref={svgRef}
                        width="100%"
                        height="100%"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        style={{ touchAction: 'none' }}
                    >
                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                            {/* Grid lines - Vertical (time) */}
                            {timeAxisTicks.map((tick) => (
                                <line
                                    key={`vgrid-${tick}`}
                                    x1={xScale(tick)}
                                    y1={margin.top}
                                    x2={xScale(tick)}
                                    y2={margin.top + chartHeight}
                                    stroke="#e5e7eb"
                                    strokeWidth={1 / transform.scale}
                                />
                            ))}

                            {/* Grid lines - Horizontal (stops) */}
                            {routeStops.map((_, index) => (
                                <line
                                    key={`hgrid-${index}`}
                                    x1={margin.left}
                                    y1={yScale(index)}
                                    x2={margin.left + chartWidth}
                                    y2={yScale(index)}
                                    stroke="#e5e7eb"
                                    strokeWidth={1 / transform.scale}
                                />
                            ))}

                            {/* Y-Axis labels (Stop names) */}
                            {routeStops.map((stop, index) => (
                                <g key={`ylabel-${index}`}>
                                    <text
                                        x={margin.left - 10}
                                        y={yScale(index)}
                                        textAnchor="end"
                                        dominantBaseline="middle"
                                        fontSize={11 / transform.scale}
                                        fill="#374151"
                                        className="select-none"
                                    >
                                        {truncateStopName(stop.name)}
                                    </text>
                                    {/* Stop order indicator */}
                                    <circle
                                        cx={margin.left - 5}
                                        cy={yScale(index)}
                                        r={3 / transform.scale}
                                        fill={getStopIndicatorColor(index, routeStops.length)}
                                    />
                                </g>
                            ))}

                            {/* X-Axis labels (Time) */}
                            {timeAxisTicks.map((tick) => (
                                <g key={`xlabel-${tick}`}>
                                    <text
                                        x={xScale(tick)}
                                        y={margin.top + chartHeight + 20}
                                        textAnchor="middle"
                                        fontSize={10 / transform.scale}
                                        fill="#6b7280"
                                        className="select-none"
                                    >
                                        {minutesToTime(tick)}
                                    </text>
                                </g>
                            ))}

                            {/* X-Axis title */}
                            <text
                                x={margin.left + chartWidth / 2}
                                y={margin.top + chartHeight + 45}
                                textAnchor="middle"
                                fontSize={12 / transform.scale}
                                fill="#374151"
                                fontWeight="500"
                                className="select-none"
                            >
                                Time
                            </text>

                            {/* Y-Axis title */}
                            <text
                                x={20}
                                y={margin.top + chartHeight / 2}
                                textAnchor="middle"
                                fontSize={12 / transform.scale}
                                fill="#374151"
                                fontWeight="500"
                                transform={`rotate(-90, 20, ${margin.top + chartHeight / 2})`}
                                className="select-none"
                            >
                                Stops
                            </text>

                            {/* Schedule lines and points */}
                            {schedulePoints.map((points, scheduleIndex) => {
                                if (!visibleSchedules.has(scheduleIndex)) return null;

                                const color = getScheduleColor(scheduleIndex);
                                const isActive = activeScheduleIndex === scheduleIndex;
                                const pathD = buildPathFromPoints(points);

                                return (
                                    <g key={`schedule-${scheduleIndex}`}>
                                        {/* Schedule line */}
                                        {points.length > 1 && (
                                            <path
                                                d={pathD}
                                                fill="none"
                                                stroke={color}
                                                strokeWidth={(isActive ? 3 : 2) / transform.scale}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                opacity={isActive ? 1 : 0.7}
                                                className="cursor-pointer hover:opacity-100"
                                                onClick={() => handleScheduleClick(scheduleIndex)}
                                            />
                                        )}

                                        {/* Points */}
                                        {points.map((point, pointIndex) => (
                                            <circle
                                                key={`point-${scheduleIndex}-${pointIndex}`}
                                                cx={point.x}
                                                cy={point.y}
                                                r={(isActive ? 6 : 5) / transform.scale}
                                                fill={color}
                                                stroke="white"
                                                strokeWidth={2 / transform.scale}
                                                className="cursor-pointer"
                                                onMouseEnter={(e) => handlePointEnter(point, color, e)}
                                                onMouseLeave={handlePointMouseLeave}
                                                onClick={() => handleScheduleClick(scheduleIndex)}
                                            />
                                        ))}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>

                    <Tooltip tooltip={tooltip} />
                </div>

                <LegendPanel
                    schedules={schedules}
                    activeScheduleIndex={activeScheduleIndex}
                    visibleSchedules={visibleSchedules}
                    onToggleVisibility={toggleScheduleVisibility}
                    onShowAll={showAllSchedules}
                    onHideAll={hideAllSchedules}
                    onScheduleClick={handleScheduleClick}
                />
            </div>
        </div>
    );
}
