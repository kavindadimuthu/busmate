'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import RouteStopsEditor from "./RouteStopsEditor";
import { useRouteWorkspace } from "@/context/RouteWorkspace/useRouteWorkspace";
import { createEmptyRoute, RoadTypeEnum, DirectionEnum } from "@/types/RouteWorkspaceData";
import {
    Wand2,
    ArrowRightLeft,
    ArrowUpFromLine,
    ArrowDownToLine,
    ChevronDown,
    Ruler,
    Clock,
    Languages,
    MapPin,
    Info,
} from "lucide-react";
import { canGenerateRouteFromCorresponding, findRouteByDirection } from "@/services/routeAutoGeneration";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// ─── Collapsible Form Section ───────────────────────────────────────────────

function FormSection({
    title,
    icon: Icon,
    defaultOpen = true,
    children,
    badge,
}: {
    title: string;
    icon: React.ElementType;
    defaultOpen?: boolean;
    children: React.ReactNode;
    badge?: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors group">
                    <Icon className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{title}</span>
                    {badge}
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 ml-auto transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="p-4 space-y-4">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

// ─── Form Field Wrapper ─────────────────────────────────────────────────────

function FormField({
    label,
    required,
    hint,
    children,
    className = 'flex-1',
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <div className="flex items-center gap-1">
                <Label className="text-xs font-medium text-slate-600">
                    {label}
                    {required && <span className="text-rose-500 ml-0.5">*</span>}
                </Label>
                {hint && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="text-xs max-w-[200px]">{hint}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            {children}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────

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
        clearSelectedStop();
    }, [activeRouteIndex, setActiveRouteIndex, clearSelectedStop]);

    // Check if the source route exists for auto-generation
    const sourceDirection = activeTab === 'outbound' ? DirectionEnum.INBOUND : DirectionEnum.OUTBOUND;
    const sourceRoute = findRouteByDirection(data.routeGroup.routes, sourceDirection);
    const canAutoGenerate = canGenerateRouteFromCorresponding(sourceRoute);

    const handleTabSwitch = useCallback((tab: 'outbound' | 'inbound') => {
        const targetDirection = tab === 'outbound' ? DirectionEnum.OUTBOUND : DirectionEnum.INBOUND;
        const existingIndex = getRouteIndexByDirection(targetDirection);
        if (existingIndex < 0) {
            const newRoute = createEmptyRoute();
            newRoute.direction = targetDirection;
            addRoute(newRoute);
        }
        setActiveTab(tab);
    }, [getRouteIndexByDirection, addRoute]);

    const handleAutoGenerate = useCallback(() => {
        const targetDirection = activeTab === 'outbound' ? DirectionEnum.OUTBOUND : DirectionEnum.INBOUND;
        const result = generateRouteFromCorresponding(targetDirection);

        if (result.success) {
            toast({ title: "Route Generated", description: result.message, duration: 5000 });
            result.warnings.forEach(warning => {
                toast({ title: "Warning", description: warning, variant: "destructive", duration: 7000 });
            });
        } else {
            toast({ title: "Generation Failed", description: result.message, variant: "destructive", duration: 5000 });
        }
    }, [activeTab, generateRouteFromCorresponding, toast]);

    // Count stops per direction for badges
    const outboundRoute = findRouteByDirection(data.routeGroup.routes, DirectionEnum.OUTBOUND);
    const inboundRoute = findRouteByDirection(data.routeGroup.routes, DirectionEnum.INBOUND);
    const outboundStopCount = outboundRoute?.routeStops?.length ?? 0;
    const inboundStopCount = inboundRoute?.routeStops?.length ?? 0;

    return (
        <div className="space-y-4">
            <RouteGroupInfo />

            {/* Direction Tabs — underline style to distinguish from outer pill tabs */}
            <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4">
                    <div className="flex items-center" role="tablist">
                        <button
                            role="tab"
                            aria-selected={activeTab === 'outbound'}
                            onClick={() => handleTabSwitch('outbound')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
                                activeTab === 'outbound'
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <ArrowUpFromLine className="h-4 w-4" />
                            Outbound
                            {outboundStopCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 ml-1">
                                    {outboundStopCount} stops
                                </Badge>
                            )}
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeTab === 'inbound'}
                            onClick={() => handleTabSwitch('inbound')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 -mb-px ${
                                activeTab === 'inbound'
                                    ? 'border-blue-600 text-blue-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <ArrowDownToLine className="h-4 w-4" />
                            Inbound
                            {inboundStopCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 ml-1">
                                    {inboundStopCount} stops
                                </Badge>
                            )}
                        </button>
                    </div>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAutoGenerate}
                                    disabled={!canAutoGenerate}
                                    className="gap-1.5 text-violet-700 border-violet-200 hover:bg-violet-50 disabled:opacity-40"
                                >
                                    <Wand2 className="h-3.5 w-3.5" />
                                    <span className="hidden md:inline">Auto-Generate from {activeTab === 'outbound' ? 'Inbound' : 'Outbound'}</span>
                                    <ArrowRightLeft className="h-3.5 w-3.5 md:hidden" />
                                </Button>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {canAutoGenerate
                                ? `Reverse the ${activeTab === 'outbound' ? 'inbound' : 'outbound'} route stops to generate this route`
                                : `No ${activeTab === 'outbound' ? 'inbound' : 'outbound'} route available to generate from`
                            }
                        </TooltipContent>
                    </Tooltip>
                </div>

                <CardContent className="p-0">
                    <RouteInfo routeIndex={activeRouteIndex} />
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Route Group Info ───────────────────────────────────────────────────────

function RouteGroupInfo() {
    const { data, updateRouteGroup, mode } = useRouteWorkspace();

    return (
        <Card className="overflow-hidden">
            <FormSection title="Route Group" icon={MapPin} defaultOpen={true}
                badge={
                    <Badge variant={data.routeGroup.id ? 'outline' : 'secondary'} className="text-[10px] ml-2">
                        {data.routeGroup.id ? 'Existing' : 'New'}
                    </Badge>
                }
            >
                {/* Primary fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Name (English)" required hint="The primary display name for this route group">
                        <Input
                            value={data.routeGroup.name || ''}
                            onChange={(e) => updateRouteGroup({ name: e.target.value })}
                            placeholder="Enter route group name"
                        />
                    </FormField>
                    <FormField label="Name (Sinhala)">
                        <Input
                            value={data.routeGroup.nameSinhala || ''}
                            onChange={(e) => updateRouteGroup({ nameSinhala: e.target.value })}
                            placeholder="සිංහල නම"
                        />
                    </FormField>
                    <FormField label="Name (Tamil)">
                        <Input
                            value={data.routeGroup.nameTamil || ''}
                            onChange={(e) => updateRouteGroup({ nameTamil: e.target.value })}
                            placeholder="தமிழ் பெயர்"
                        />
                    </FormField>
                </div>
                <FormField label="Description" className="w-full">
                    <Textarea
                        rows={2}
                        value={data.routeGroup.description || ''}
                        onChange={(e) => updateRouteGroup({ description: e.target.value })}
                        placeholder="Optional description"
                        className="resize-none"
                    />
                </FormField>
            </FormSection>
        </Card>
    );
}

// ─── Route Info ─────────────────────────────────────────────────────────────

function RouteInfo({ routeIndex }: { routeIndex: number }) {
    const { data, updateRoute } = useRouteWorkspace();
    const route = data.routeGroup.routes[routeIndex];

    if (!route) {
        return (
            <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No route data available. Paste YAML in Textual Mode to load route data.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100">
            {/* Basic Info section */}
            <FormSection title="Basic Info" icon={Info} defaultOpen={true}
                badge={
                    <Badge variant={route.id ? 'outline' : 'secondary'} className="text-[10px] ml-2">
                        {route.id ? 'Existing' : 'New'}
                    </Badge>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Route Name (English)" required>
                        <Input
                            value={route.name || ''}
                            onChange={(e) => updateRoute(routeIndex, { name: e.target.value })}
                            placeholder="Enter route name"
                        />
                    </FormField>
                    <FormField label="Route Number" hint="e.g., 1, 138, 240">
                        <Input
                            value={route.routeNumber || ''}
                            onChange={(e) => updateRoute(routeIndex, { routeNumber: e.target.value })}
                            placeholder="e.g., 138"
                        />
                    </FormField>
                    <FormField label="Road Type">
                        <Select
                            value={route.roadType || ''}
                            onValueChange={(value) => updateRoute(routeIndex, { roadType: value as RoadTypeEnum })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select road type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={RoadTypeEnum.NORMALWAY}>Normal Road</SelectItem>
                                <SelectItem value={RoadTypeEnum.EXPRESSWAY}>Expressway</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </div>
                <FormField label="Description" className="w-full">
                    <Textarea
                        rows={2}
                        value={route.description || ''}
                        onChange={(e) => updateRoute(routeIndex, { description: e.target.value })}
                        placeholder="Optional description"
                        className="resize-none"
                    />
                </FormField>
            </FormSection>

            {/* Distances & Duration */}
            <FormSection title="Distance & Duration" icon={Ruler} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Distance (km)" hint="Total route distance">
                        <Input
                            type="number"
                            step="0.01"
                            value={route.distanceKm || ''}
                            onChange={(e) => updateRoute(routeIndex, { distanceKm: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                        />
                    </FormField>
                    <FormField label="Estimated Duration" hint="Approximate travel time in minutes">
                        <div className="relative">
                            <Input
                                type="number"
                                value={route.estimatedDurationMinutes || ''}
                                onChange={(e) => updateRoute(routeIndex, { estimatedDurationMinutes: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">min</span>
                        </div>
                    </FormField>
                    <FormField label="Route Through (English)" hint="Places the route passes through">
                        <Input
                            value={route.routeThrough || ''}
                            onChange={(e) => updateRoute(routeIndex, { routeThrough: e.target.value })}
                            placeholder="Via places"
                        />
                    </FormField>
                </div>
            </FormSection>

            {/* Translations */}
            <FormSection title="Translations" icon={Languages} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Route Name (Sinhala)">
                        <Input
                            value={route.nameSinhala || ''}
                            onChange={(e) => updateRoute(routeIndex, { nameSinhala: e.target.value })}
                            placeholder="සිංහල නම"
                        />
                    </FormField>
                    <FormField label="Route Name (Tamil)">
                        <Input
                            value={route.nameTamil || ''}
                            onChange={(e) => updateRoute(routeIndex, { nameTamil: e.target.value })}
                            placeholder="தமிழ் பெயர்"
                        />
                    </FormField>
                    <FormField label="Route Through (Sinhala)">
                        <Input
                            value={route.routeThroughSinhala || ''}
                            onChange={(e) => updateRoute(routeIndex, { routeThroughSinhala: e.target.value })}
                            placeholder="හරහා ස්ථාන"
                        />
                    </FormField>
                    <FormField label="Route Through (Tamil)">
                        <Input
                            value={route.routeThroughTamil || ''}
                            onChange={(e) => updateRoute(routeIndex, { routeThroughTamil: e.target.value })}
                            placeholder="வழியாக இடங்கள்"
                        />
                    </FormField>
                </div>
            </FormSection>

            {/* Stops Editor */}
            <RouteStopsEditor routeIndex={routeIndex} />
        </div>
    );
}
