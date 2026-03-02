'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import RouteStopsEditor from "./RouteStopsEditor";
import { useRouteWorkspace } from "@/context/RouteWorkspace/useRouteWorkspace";
import { createEmptyRoute, RoadTypeEnum, DirectionEnum } from "@/types/RouteWorkspaceData";
import { Wand2, AlertCircle, CheckCircle } from "lucide-react";
import { canGenerateRouteFromCorresponding, findRouteByDirection } from "@/services/routeAutoGeneration";
import { useToast } from "@/hooks/use-toast";

export default function RouteFormMode() {
    const [activeTab, setActiveTab] = useState<'outbound' | 'inbound'>('outbound');
    const {
        data,
        addRoute,
        setActiveRouteIndex,
        getRouteIndexByDirection,
        generateRouteFromCorresponding,
        clearSelectedStop
    } = useRouteWorkspace();
    const { toast } = useToast();

    // Ensure we have at least one route for each direction
    useEffect(() => {
        if (data.routeGroup.routes.length === 0) {
            // Add default outbound route
            const outboundRoute = createEmptyRoute();
            outboundRoute.direction = DirectionEnum.OUTBOUND;
            addRoute(outboundRoute);
            setActiveRouteIndex(0);
        }
    }, []);

    // Get route index based on the active tab direction
    const activeRouteIndex = useMemo(() => {
        const targetDirection = activeTab === 'outbound' ? DirectionEnum.OUTBOUND : DirectionEnum.INBOUND;
        const index = getRouteIndexByDirection(targetDirection);
        return index >= 0 ? index : 0;
    }, [activeTab, getRouteIndexByDirection, data.routeGroup.routes]);

    // Update context when tab changes
    useEffect(() => {
        setActiveRouteIndex(activeRouteIndex);
        clearSelectedStop(); // Clear selected stop when switching tabs
    }, [activeRouteIndex, setActiveRouteIndex, clearSelectedStop]);

    // Check if the source route exists for auto-generation
    const sourceDirection = activeTab === 'outbound' ? DirectionEnum.INBOUND : DirectionEnum.OUTBOUND;
    const sourceRoute = findRouteByDirection(data.routeGroup.routes, sourceDirection);
    const canAutoGenerate = canGenerateRouteFromCorresponding(sourceRoute);

    // Handle tab switch with route creation if needed
    const handleTabSwitch = useCallback((tab: 'outbound' | 'inbound') => {
        const targetDirection = tab === 'outbound' ? DirectionEnum.OUTBOUND : DirectionEnum.INBOUND;
        const existingIndex = getRouteIndexByDirection(targetDirection);

        // If no route exists for this direction, create one
        if (existingIndex < 0) {
            const newRoute = createEmptyRoute();
            newRoute.direction = targetDirection;
            addRoute(newRoute);
        }

        setActiveTab(tab);
    }, [getRouteIndexByDirection, addRoute]);

    // Handle auto-generate route
    const handleAutoGenerate = useCallback(() => {
        const targetDirection = activeTab === 'outbound' ? DirectionEnum.OUTBOUND : DirectionEnum.INBOUND;

        const result = generateRouteFromCorresponding(targetDirection);

        if (result.success) {
            toast({
                title: "Route Generated Successfully",
                description: result.message,
                duration: 5000,
            });

            // Show warnings if any
            if (result.warnings.length > 0) {
                result.warnings.forEach(warning => {
                    toast({
                        title: "Warning",
                        description: warning,
                        variant: "destructive",
                        duration: 7000,
                    });
                });
            }
        } else {
            toast({
                title: "Failed to Generate Route",
                description: result.message,
                variant: "destructive",
                duration: 5000,
            });
        }
    }, [activeTab, generateRouteFromCorresponding, toast]);

    return (
        <div className="space-y-5">
            <RouteGroupInfo />

            {/* Direction Tabs */}
            <div className="flex bg-white border border-slate-200 rounded-lg p-2 justify-between items-center shadow-sm">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => handleTabSwitch('outbound')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'outbound'
                            ? 'bg-blue-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        Outbound Route
                    </button>
                    <button
                        onClick={() => handleTabSwitch('inbound')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'inbound'
                            ? 'bg-blue-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                    >
                        Inbound Route
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {/* Button for auto generating selected route using data in other routes */}
                    <button
                        onClick={handleAutoGenerate}
                        disabled={!canAutoGenerate}
                        className={`px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${canAutoGenerate
                            ? 'bg-violet-600 hover:bg-violet-700 shadow-sm'
                            : 'bg-slate-300 cursor-not-allowed'
                            }`}
                        title={canAutoGenerate
                            ? `Generate ${activeTab} route by reversing the ${activeTab === 'outbound' ? 'inbound' : 'outbound'} route stops`
                            : `No ${activeTab === 'outbound' ? 'inbound' : 'outbound'} route available to generate from`
                        }
                    >
                        <Wand2 className="w-4 h-4" />
                        Auto-Generate From {activeTab === 'outbound' ? 'Inbound' : 'Outbound'}
                    </button>
                </div>
            </div>
            <RouteInfo routeIndex={activeRouteIndex} />
        </div>
    )
}

function RouteGroupInfo() {
    const { data, updateRouteGroup } = useRouteWorkspace();

    return (
        <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">Route Group Info</h3>
            </div>
            <form className="flex flex-col gap-4 p-5">
                {/* Route group id field */}
                <div className="flex gap-3 items-center">
                    <label className="text-xs font-medium text-slate-600 w-28">Route Group ID:</label>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${data.routeGroup.id ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {data.routeGroup.id || 'new'}
                    </span>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col flex-1">
                        <label className="text-xs font-medium text-slate-600 mb-1.5">Name (English) <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={data.routeGroup.name || ''}
                            onChange={(e) => updateRouteGroup({ name: e.target.value })}
                            placeholder="Enter route group name"
                        />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label className="text-xs font-medium text-slate-600 mb-1.5">Name (Sinhala)</label>
                        <input
                            type="text"
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={data.routeGroup.nameSinhala || ''}
                            onChange={(e) => updateRouteGroup({ nameSinhala: e.target.value })}
                            placeholder="සිංහල නම"
                        />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label className="text-xs font-medium text-slate-600 mb-1.5">Name (Tamil)</label>
                        <input
                            type="text"
                            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={data.routeGroup.nameTamil || ''}
                            onChange={(e) => updateRouteGroup({ nameTamil: e.target.value })}
                            placeholder="தமிழ் பெயர்"
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-600 mb-1.5">Description</label>
                    <textarea
                        className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        rows={2}
                        value={data.routeGroup.description || ''}
                        onChange={(e) => updateRouteGroup({ description: e.target.value })}
                        placeholder="Optional description"
                    ></textarea>
                </div>
            </form>
        </div>
    );
}

function RouteInfo({ routeIndex }: { routeIndex: number }) {
    const { data, updateRoute } = useRouteWorkspace();
    const route = data.routeGroup.routes[routeIndex];

    // If no route exists at this index, show a message
    if (!route) {
        return (
            <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm p-5">
                <span className="text-sm text-slate-500">No route data available. Paste YAML in Textual Mode to load route data.</span>
            </div>
        );
    }

    const inputClassName = "border border-slate-300 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200";
    const labelClassName = "text-xs font-medium text-slate-600 mb-1.5";

    return (
        <>
            <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-700">Route Info</h3>
                </div>
                <form className="flex flex-col gap-4 p-5">
                    {/* Route id field */}
                    <div className="flex gap-3 items-center">
                        <label className="text-xs font-medium text-slate-600 w-20">Route ID:</label>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${route.id ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {route.id || 'new'}
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Name (English) <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.name || ''}
                                onChange={(e) => updateRoute(routeIndex, { name: e.target.value })}
                                placeholder="Enter route name"
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Name (Sinhala)</label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.nameSinhala || ''}
                                onChange={(e) => updateRoute(routeIndex, { nameSinhala: e.target.value })}
                                placeholder="සිංහල නම"
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Name (Tamil)</label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.nameTamil || ''}
                                onChange={(e) => updateRoute(routeIndex, { nameTamil: e.target.value })}
                                placeholder="தமிழ் பெயர்"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Route Number</label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.routeNumber || ''}
                                onChange={(e) => updateRoute(routeIndex, { routeNumber: e.target.value })}
                                placeholder="e.g., 1, 138, 240"
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Road Type</label>
                            <select
                                className={inputClassName}
                                value={route.roadType || ''}
                                onChange={(e) => updateRoute(routeIndex, { roadType: e.target.value as RoadTypeEnum })}
                            >
                                <option value="">Select road type</option>
                                <option value={RoadTypeEnum.NORMALWAY}>Normalway</option>
                                <option value={RoadTypeEnum.EXPRESSWAY}>Expressway</option>
                            </select>
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Direction</label>
                            <select
                                className={inputClassName}
                                value={route.direction || ''}
                                onChange={(e) => updateRoute(routeIndex, { direction: e.target.value as DirectionEnum })}
                            >
                                <option value="">Select direction</option>
                                <option value={DirectionEnum.OUTBOUND}>Outbound/Up</option>
                                <option value={DirectionEnum.INBOUND}>Inbound/Down</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Route Through (English)</label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.routeThrough || ''}
                                onChange={(e) => updateRoute(routeIndex, { routeThrough: e.target.value })}
                                placeholder="Via places"
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Route Through (Sinhala)</label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.routeThroughSinhala || ''}
                                onChange={(e) => updateRoute(routeIndex, { routeThroughSinhala: e.target.value })}
                                placeholder="හරහා ස්ථාන"
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Route Through (Tamil)</label>
                            <input
                                type="text"
                                className={inputClassName}
                                value={route.routeThroughTamil || ''}
                                onChange={(e) => updateRoute(routeIndex, { routeThroughTamil: e.target.value })}
                                placeholder="வழியாக இடங்கள்"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Distance (km)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={inputClassName}
                                value={route.distanceKm || ''}
                                onChange={(e) => updateRoute(routeIndex, { distanceKm: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex flex-col flex-1">
                            <label className={labelClassName}>Estimated Duration (minutes)</label>
                            <input
                                type="number"
                                className={inputClassName}
                                value={route.estimatedDurationMinutes || ''}
                                onChange={(e) => updateRoute(routeIndex, { estimatedDurationMinutes: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        </div>
                        <div className="flex-1"></div>
                    </div>
                    <div className="flex flex-col">
                        <label className={labelClassName}>Description</label>
                        <textarea
                            className={`${inputClassName} resize-none`}
                            rows={2}
                            value={route.description || ''}
                            onChange={(e) => updateRoute(routeIndex, { description: e.target.value })}
                            placeholder="Optional description"
                        ></textarea>
                    </div>
                </form>
            </div>

            <RouteStopsEditor routeIndex={routeIndex} />
        </>
    );
}
