'use client';

import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import { StopTypeEnum, StopExistenceType, createEmptyRouteStop, RouteStop } from '@/types/RouteWorkspaceData';
import {
    GripVertical,
    LocationEditIcon,
    Trash2,
    MoreVertical,
    Loader2,
    Search,
    Copy,
    Plus,
    MapPin,
    Ruler,
    SearchCheck,
    Crosshair,
    Map,
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { fetchRouteDirections, applyDistancesToRouteStops, extractValidStops, fetchAllStopCoordinates, fetchMissingStopCoordinates, applyCoordinatesToRouteStops, extractStopsForCoordinateFetch } from '@/services/routeWorkspaceMap';
import {
    searchStopExistence,
    processStopExistenceResult,
    searchAllStopsExistence,
    applyBulkSearchResultsToRouteStops,
    canSearchStop
} from '@/services/routeWorkspaceValidation';
import { useToast } from '@/hooks/use-toast';
import {
    Button,
    Badge,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@busmate/ui';

interface RouteStopsListProps {
    routeIndex: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getStopTypeBadge = (stopIndex: number, stopsCount: number) => {
    if (stopIndex === 0) return { label: 'Start', className: 'bg-success/15 text-success border-success/20' };
    if (stopIndex === stopsCount - 1) return { label: 'End', className: 'bg-destructive/15 text-destructive border-destructive/20' };
    return { label: `${stopIndex}`, className: 'bg-muted text-muted-foreground border-border' };
};

// ─── SortableStopRow ── extracted & memoized ──────────────────────────────────

interface SortableStopRowProps {
    routeStop: RouteStop;
    actualIndex: number;
    stopsCount: number;
    isSelected: boolean;
    isInCoordinateEditingMode: boolean;
    isSearchingThis: boolean;
    isSearchingAllStops: boolean;
    onSelect: (index: number) => void;
    onCopyRouteStopId: (id: string | undefined, e: React.MouseEvent) => void;
    onCopyStopId: (id: string | undefined, e: React.MouseEvent) => void;
    onSearch: (index: number) => void;
    onFieldChange: (index: number, field: string, value: any) => void;
    onToggleCoordinateEditing: (index: number, e: React.MouseEvent) => void;
    onDelete: (index: number) => void;
}

const SortableStopRow = memo(function SortableStopRow({
    routeStop,
    actualIndex,
    stopsCount,
    isSelected,
    isInCoordinateEditingMode,
    isSearchingThis,
    isSearchingAllStops,
    onSelect,
    onCopyRouteStopId,
    onCopyStopId,
    onSearch,
    onFieldChange,
    onToggleCoordinateEditing,
    onDelete,
}: SortableStopRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `stop-${routeStop.orderNumber}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const badge = getStopTypeBadge(actualIndex, stopsCount);
    const isStartOrEnd = actualIndex === 0 || actualIndex === stopsCount - 1;
    const hasCoords = !!(routeStop.stop?.location?.latitude && routeStop.stop?.location?.longitude);
    const isExisting = !!routeStop.stop.id;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            onClick={() => onSelect(actualIndex)}
            className={`group cursor-pointer transition-colors text-sm ${
                isSelected
                    ? 'bg-primary/10 hover:bg-primary/15 ring-1 ring-inset ring-blue-200'
                    : 'hover:bg-muted'
            } ${isDragging ? 'relative z-50' : ''}`}
        >
            {/* Drag handle */}
            <td className="border-b border-border/50 w-8 pl-1">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Drag to reorder stop: ${routeStop.stop.name || `stop ${routeStop.orderNumber}`}`}
                    aria-roledescription="sortable"
                >
                    <GripVertical className="text-muted-foreground/70" size={14} />
                </button>
            </td>

            {/* Order badge / type */}
            <td className="border-b border-border/50 px-2 py-2 w-16">
                <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 ${badge.className}`}>
                    {badge.label}
                </Badge>
            </td>

            {/* Stop name — controlled input */}
            <td className="border-b border-border/50 px-2 py-1">
                <div className="flex items-center gap-1.5">
                    <input
                        type="text"
                        value={routeStop.stop.name || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onFieldChange(actualIndex, 'stopName', e.target.value)}
                        className="flex-1 px-2 py-1 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-card rounded text-sm"
                        placeholder={isStartOrEnd ? (actualIndex === 0 ? 'Start stop name' : 'End stop name') : 'Stop name'}
                        aria-label={`Stop name for position ${actualIndex}`}
                    />
                    {/* Status indicators */}
                    <div className="flex items-center gap-0.5 shrink-0">
                        {isExisting && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">Existing stop in system</TooltipContent>
                            </Tooltip>
                        )}
                        {!isExisting && routeStop.stop.name && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="h-1.5 w-1.5 rounded-full bg-warning" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">New stop (will be created)</TooltipContent>
                            </Tooltip>
                        )}
                        {hasCoords && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <MapPin className="h-3 w-3 text-primary/70" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    {routeStop.stop.location?.latitude?.toFixed(4)}, {routeStop.stop.location?.longitude?.toFixed(4)}
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </td>

            {/* Distance */}
            <td className="border-b border-border/50 w-24">
                <input
                    type="number"
                    step="0.1"
                    value={routeStop.distanceFromStart ?? ''}
                    placeholder="—"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        const val = e.target.value.trim();
                        if (val === '') {
                            onFieldChange(actualIndex, 'distanceFromStart', null);
                        } else {
                            const numVal = parseFloat(val);
                            onFieldChange(actualIndex, 'distanceFromStart', isNaN(numVal) ? null : numVal);
                        }
                    }}
                    className="w-full px-2 py-1 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-card rounded text-sm text-right tabular-nums"
                    aria-label={`Distance from start for stop at position ${actualIndex} (km)`}
                />
            </td>

            {/* Row actions */}
            <td className="border-b border-border/50 w-24">
                <div className="flex items-center gap-0.5 justify-end pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSearch(actualIndex);
                                }}
                                disabled={isSearchingThis || isSearchingAllStops}
                                className="p-1 text-primary/80 hover:bg-primary/10 rounded transition-colors disabled:opacity-40"
                                aria-label={`Search database for stop: ${routeStop.stop.name || 'unnamed'}`}
                            >
                                {isSearchingThis ? <Loader2 className="animate-spin" size={13} /> : <Search size={13} />}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">Search existing stops</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={(e) => onToggleCoordinateEditing(actualIndex, e)}
                                className={`p-1 rounded transition-colors ${
                                    isInCoordinateEditingMode
                                        ? 'text-primary bg-primary/15'
                                        : 'text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted'
                                }`}
                                aria-label={isInCoordinateEditingMode ? "Deactivate coordinate editing" : "Edit coordinates on map"}
                                aria-pressed={isInCoordinateEditingMode}
                            >
                                <LocationEditIcon size={13} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                            {isInCoordinateEditingMode ? 'Deactivate map editing' : 'Edit coordinates on map'}
                        </TooltipContent>
                    </Tooltip>

                    {!isStartOrEnd && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(actualIndex); }}
                                    className="p-1 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    aria-label={`Delete stop: ${routeStop.stop.name || `stop ${routeStop.orderNumber}`}`}
                                >
                                    <Trash2 size={13} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">Delete stop</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.routeStop === nextProps.routeStop &&
        prevProps.actualIndex === nextProps.actualIndex &&
        prevProps.stopsCount === nextProps.stopsCount &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.isInCoordinateEditingMode === nextProps.isInCoordinateEditingMode &&
        prevProps.isSearchingThis === nextProps.isSearchingThis &&
        prevProps.isSearchingAllStops === nextProps.isSearchingAllStops
    );
});

// ─────────────────────────────────────────────────────────────────────────────

export default function RouteStopsList({ routeIndex }: RouteStopsListProps) {
    const { data, updateRoute, updateRouteStop, addRouteStop, removeRouteStop, reorderRouteStop, setSelectedStop, selectedRouteIndex, selectedStopIndex, coordinateEditingMode, setCoordinateEditingMode, clearCoordinateEditingMode, mapActions } = useRouteWorkspace();
    const route = data.routeGroup.routes[routeIndex];
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isFetchingDistances, setIsFetchingDistances] = useState(false);
    const [isFetchingAllCoordinates, setIsFetchingAllCoordinates] = useState(false);
    const [isFetchingMissingCoordinates, setIsFetchingMissingCoordinates] = useState(false);
    const [coordinateFetchProgress, setCoordinateFetchProgress] = useState<string>('');
    const [isSearchingAllStops, setIsSearchingAllStops] = useState(false);
    const [searchingStopIndex, setSearchingStopIndex] = useState<number | null>(null);
    const [searchProgress, setSearchProgress] = useState<string>('');
    const { toast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCopyRouteStopId = useCallback((routeStopId: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!routeStopId) {
            toast({
                title: "No Route Stop ID",
                description: "This route stop doesn't have an ID yet.",
                variant: "destructive"
            });
            return;
        }
        navigator.clipboard.writeText(routeStopId).then(() => {
            toast({
                title: "Copied!",
                description: "Route Stop ID copied to clipboard."
            });
        }).catch(() => {
            toast({
                title: "Failed to copy",
                description: "Could not copy Route Stop ID to clipboard.",
                variant: "destructive"
            });
        });
    }, [toast]);

    const handleCopyStopId = useCallback((stopId: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!stopId) {
            toast({
                title: "No Stop ID",
                description: "This is a new stop without an ID yet.",
                variant: "destructive"
            });
            return;
        }
        navigator.clipboard.writeText(stopId).then(() => {
            toast({
                title: "Copied!",
                description: "Stop ID copied to clipboard."
            });
        }).catch(() => {
            toast({
                title: "Failed to copy",
                description: "Could not copy Stop ID to clipboard.",
                variant: "destructive"
            });
        });
    }, [toast]);

    if (!route) {
        return (
            <div className="flex flex-col rounded-lg bg-muted p-4">
                <span className="text-sm font-medium text-muted-foreground mb-2">Route Stops List</span>
                <p className="text-sm text-muted-foreground">No route data available</p>
            </div>
        );
    }

    const stops = route.routeStops || [];

    const handleFetchDistancesFromMap = useCallback(async () => {
        // Check if we have enough stops with coordinates
        const validStops = extractValidStops(stops);

        if (validStops.length < 2) {
            toast({
                title: 'Validation Error',
                description: 'At least 2 stops with valid coordinates are required to calculate distances.',
                variant: 'destructive',
            });
            return;
        }

        // Check if start stop (first stop in list) has coordinates
        const firstStopHasCoordinates = stops[0]?.stop?.location?.latitude && stops[0]?.stop?.location?.longitude;
        if (!firstStopHasCoordinates) {
            toast({
                title: 'Validation Error',
                description: 'Start stop coordinates are required to fetch distances.',
                variant: 'destructive',
            });
            return;
        }

        setIsFetchingDistances(true);

        try {
            // Use the shared service to fetch directions and calculate distances
            const result = await fetchRouteDirections(stops, (currentChunk, totalChunks) => {
                console.log(`Fetching distances: chunk ${currentChunk} of ${totalChunks}`);
            });

            // Apply the calculated distances to the route stops
            const updatedStops = applyDistancesToRouteStops(stops, result.distances);

            // Update the route with new distances
            updateRoute(routeIndex, { routeStops: updatedStops });

            toast({
                title: 'Success',
                description: `Distances fetched successfully! Total distance: ${result.totalDistanceKm} km`,
            });
        } catch (error) {
            console.error('Error fetching distances:', error);
            toast({
                title: 'Error',
                description: `Failed to fetch distances: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setIsFetchingDistances(false);
        }
    }, [stops, routeIndex, updateRoute, toast]);

    const handleFetchAllCoordinates = useCallback(async () => {
        // Check if we have at least 2 stops with names
        const stopsWithNames = stops.filter(s => s.stop?.name?.trim());
        if (stopsWithNames.length < 2) {
            toast({
                title: 'Validation Error',
                description: 'At least 2 stops with names are required to fetch coordinates.',
                variant: 'destructive',
            });
            return;
        }

        setIsFetchingAllCoordinates(true);
        setCoordinateFetchProgress('Starting...');

        try {
            const result = await fetchAllStopCoordinates(stops, (currentChunk, totalChunks) => {
                setCoordinateFetchProgress(`Fetching chunk ${currentChunk} of ${totalChunks}...`);
            });

            // Apply the fetched coordinates to the route stops
            const updatedStops = applyCoordinatesToRouteStops(stops, result.coordinates);
            updateRoute(routeIndex, { routeStops: updatedStops });

            if (result.failedStops.length > 0) {
                const failedNames = result.failedStops.map(s => s.name).join(', ');
                toast({
                    title: 'Partial Success',
                    description: `Coordinates fetched for ${result.successCount} stops. Failed: ${failedNames}`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: `Successfully fetched coordinates for all ${result.successCount} stops!`,
                });
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            toast({
                title: 'Error',
                description: `Failed to fetch coordinates. ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setIsFetchingAllCoordinates(false);
            setCoordinateFetchProgress('');
        }
    }, [stops, routeIndex, updateRoute, toast]);

    const handleFetchMissingCoordinates = useCallback(async () => {
        // Check stops info
        const stopsInfo = extractStopsForCoordinateFetch(stops);
        const stopsWithCoordinates = stopsInfo.filter(s => s.hasCoordinates);
        const stopsWithoutCoordinates = stopsInfo.filter(s => !s.hasCoordinates && s.name.trim() !== '');

        if (stopsWithoutCoordinates.length === 0) {
            toast({
                title: 'Nothing to do',
                description: 'All stops already have coordinates.',
            });
            return;
        }

        if (stopsWithCoordinates.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'At least one stop with coordinates is required. Use "Fetch All Coordinates" instead.',
                variant: 'destructive',
            });
            return;
        }

        setIsFetchingMissingCoordinates(true);
        setCoordinateFetchProgress('Starting...');

        try {
            const result = await fetchMissingStopCoordinates(stops, (currentChunk, totalChunks) => {
                setCoordinateFetchProgress(`Fetching chunk ${currentChunk} of ${totalChunks}...`);
            });

            // Apply the fetched coordinates to the route stops
            const updatedStops = applyCoordinatesToRouteStops(stops, result.coordinates);
            updateRoute(routeIndex, { routeStops: updatedStops });

            if (result.failedStops.length > 0) {
                const failedNames = result.failedStops.map(s => s.name).join(', ');
                toast({
                    title: 'Partial Success',
                    description: `Fetched ${result.successCount} of ${result.totalProcessed} missing stops. Failed: ${failedNames}`,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: `Successfully fetched coordinates for all ${result.successCount} missing stops!`,
                });
            }
        } catch (error) {
            console.error('Error fetching missing coordinates:', error);
            toast({
                title: 'Error',
                description: `Failed to fetch coordinates. ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setIsFetchingMissingCoordinates(false);
            setCoordinateFetchProgress('');
        }
    }, [stops, routeIndex, updateRoute, toast]);

    // Handler for searching a single stop's existence
    const handleSearchSingleStopExistence = async (stopIndex: number) => {
        const routeStop = stops[stopIndex];
        if (!routeStop) return;

        // Check if stop can be searched
        if (!canSearchStop(routeStop.stop)) {
            toast({
                title: "Cannot Search",
                description: "Stop has no ID or name to search",
                variant: "destructive"
            });
            return;
        }

        setSearchingStopIndex(stopIndex);

        try {
            const result = await searchStopExistence(routeStop.stop);

            if (result.error) {
                toast({
                    title: "Search Failed",
                    description: result.error,
                    variant: "destructive"
                });
            } else if (result.found && result.stop) {
                // Stop found - update with fetched data
                updateRouteStop(routeIndex, stopIndex, {
                    stop: result.stop
                });

                toast({
                    title: "Stop Found",
                    description: `Loaded: ${result.stop.name}`,
                    variant: "default"
                });
            } else {
                // Stop not found - process result to handle ID clearing
                const processedResult = processStopExistenceResult(routeStop.stop, result);

                // Update the stop with processed data
                updateRouteStop(routeIndex, stopIndex, {
                    stop: processedResult.stop
                });

                const message = processedResult.clearIdIfNotFound
                    ? `Not found. Invalid ID cleared.`
                    : `No stop found with ${result.searchedBy}: ${result.searchValue}`;

                toast({
                    title: "Stop Not Found",
                    description: message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error searching for stop:', error);
            toast({
                title: "Search Failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive"
            });
        } finally {
            setSearchingStopIndex(null);
        }
    };

    // Handler for searching all stops' existence
    const handleSearchAllStopsExistence = async () => {
        if (stops.length === 0) {
            toast({
                title: "No Stops",
                description: "No stops to search for existence",
                variant: "destructive"
            });
            return;
        }

        // Check if any stops can be searched
        const searchableStops = stops.filter(s => canSearchStop(s.stop));
        if (searchableStops.length === 0) {
            toast({
                title: "Cannot Search",
                description: "No stops have ID or name to search",
                variant: "destructive"
            });
            return;
        }

        setIsSearchingAllStops(true);
        setSearchProgress('Starting...');

        try {
            const results = await searchAllStopsExistence(stops, (current, total, stopName) => {
                setSearchProgress(`Searching ${current}/${total}: ${stopName}`);
            });

            // Apply results to route stops
            const updatedStops = applyBulkSearchResultsToRouteStops(stops, results);
            updateRoute(routeIndex, { routeStops: updatedStops });

            // Show summary toast
            toast({
                title: "Search Complete",
                description: `Found: ${results.successCount}, Not Found: ${results.notFoundCount}, Errors: ${results.errorCount}`,
                variant: results.successCount > 0 ? "default" : "destructive"
            });
        } catch (error) {
            console.error('Error searching all stops:', error);
            toast({
                title: "Search Failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive"
            });
        } finally {
            setIsSearchingAllStops(false);
            setSearchProgress('');
        }
    };

    const handleFieldChange = useCallback((stopIndex: number, field: string, value: any) => {
        const currentStop = stops[stopIndex];
        if (field === 'stopName') {
            updateRouteStop(routeIndex, stopIndex, {
                stop: { ...currentStop.stop, name: value }
            });
        } else if (field === 'stopNameSinhala') {
            updateRouteStop(routeIndex, stopIndex, {
                stop: { ...currentStop.stop, nameSinhala: value }
            });
        } else if (field === 'stopNameTamil') {
            updateRouteStop(routeIndex, stopIndex, {
                stop: { ...currentStop.stop, nameTamil: value }
            });
        } else if (field === 'distanceFromStart') {
            updateRouteStop(routeIndex, stopIndex, {
                distanceFromStart: value
            });
        } else if (field === 'isExisting') {
            updateRouteStop(routeIndex, stopIndex, {
                stop: {
                    ...currentStop.stop,
                    type: value ? StopExistenceType.EXISTING : StopExistenceType.NEW
                }
            });
        }
    }, [stops, routeIndex, updateRouteStop]);

    const handleAddIntermediateStop = () => {
        const insertIndex = stops.length - 1;
        const newOrderNumber = insertIndex;
        const newStop = createEmptyRouteStop(newOrderNumber);
        const newStops = [...stops];
        newStops.splice(insertIndex, 0, newStop);
        newStops.forEach((stop, index) => { stop.orderNumber = index; });
        updateRoute(routeIndex, { routeStops: newStops });
    };

    const handleDeleteStop = useCallback((stopIndex: number) => {
        const newStops = stops.filter((_, idx) => idx !== stopIndex);
        newStops.forEach((stop, index) => { stop.orderNumber = index; });
        updateRoute(routeIndex, { routeStops: newStops });
    }, [stops, routeIndex, updateRoute]);

    const handleSelectStop = useCallback((index: number) => {
        setSelectedStop(routeIndex, index);
    }, [routeIndex, setSelectedStop]);

    const handleToggleCoordinateEditingMode = useCallback((stopIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (coordinateEditingMode?.routeIndex === routeIndex && coordinateEditingMode?.stopIndex === stopIndex) {
            clearCoordinateEditingMode();
        } else {
            setCoordinateEditingMode(routeIndex, stopIndex);
        }
    }, [coordinateEditingMode, routeIndex, clearCoordinateEditingMode, setCoordinateEditingMode]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = stops.findIndex(stop => `stop-${stop.orderNumber}` === active.id);
            const newIndex = stops.findIndex(stop => `stop-${stop.orderNumber}` === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderRouteStop(routeIndex, oldIndex, newIndex);
            }
        }
        setActiveId(null);
    };

    const handleDragCancel = () => { setActiveId(null); };

    // Summary counts
    const existingCount = stops.filter(s => !!s.stop.id).length;
    const newCount = stops.length - existingCount;
    const withCoordsCount = stops.filter(s => !!(s.stop?.location?.latitude && s.stop?.location?.longitude)).length;
    const isBusy = isFetchingDistances || isFetchingAllCoordinates || isFetchingMissingCoordinates || isSearchingAllStops;

    const sortableIds = stops.map(stop => `stop-${stop.orderNumber}`);

    return (
        <div className="flex flex-col bg-card">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Stops
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {stops.length}
                    </Badge>
                    {existingCount > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-success/10 text-success border-success/20">
                                    {existingCount} existing
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">{existingCount} stops already in the system</TooltipContent>
                        </Tooltip>
                    )}
                    {newCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-warning/10 text-warning border-warning/20">
                            {newCount} new
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => mapActions.fitBoundsToRoute?.()}
                                disabled={!mapActions.fitBoundsToRoute}
                            >
                                <Map className="h-3.5 w-3.5 mr-1" />
                                View Route
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Fit map to show full route</TooltipContent>
                    </Tooltip>

                    {/* Batch actions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isBusy}>
                                {isBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <MoreVertical className="h-4 w-4" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Coordinates</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={handleFetchAllCoordinates}
                                disabled={isFetchingAllCoordinates || isFetchingMissingCoordinates}
                            >
                                <Crosshair className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Fetch all coordinates</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleFetchMissingCoordinates}
                                disabled={isFetchingAllCoordinates || isFetchingMissingCoordinates}
                            >
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Fetch missing only</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Distances</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={handleFetchDistancesFromMap}
                                disabled={isBusy}
                            >
                                <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Calculate distances</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Validate</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={handleSearchAllStopsExistence}
                                disabled={isBusy}
                            >
                                <SearchCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Verify all stops exist</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Progress indicator for batch operations */}
            {isBusy && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border-b border-primary/10 text-xs text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>
                        {isFetchingDistances && 'Calculating distances...'}
                        {isFetchingAllCoordinates && (coordinateFetchProgress || 'Fetching all coordinates...')}
                        {isFetchingMissingCoordinates && (coordinateFetchProgress || 'Fetching missing coordinates...')}
                        {isSearchingAllStops && (searchProgress || 'Verifying stops...')}
                    </span>
                </div>
            )}

            {/* Unified Stop Table */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className="overflow-x-auto">
                    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted/80 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                    <th className="w-8 py-2"></th>
                                    <th className="w-16 py-2 px-2 text-left">#</th>
                                    <th className="py-2 px-2 text-left">Stop Name</th>
                                    <th className="w-24 py-2 px-2 text-right">Dist (km)</th>
                                    <th className="w-24 py-2 pr-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stops.map((routeStop, idx) => {
                                    const isSelected = selectedRouteIndex === routeIndex && selectedStopIndex === idx;
                                    const isInCoordMode = coordinateEditingMode?.routeIndex === routeIndex && coordinateEditingMode?.stopIndex === idx;
                                    const isSearchingThis = searchingStopIndex === idx;
                                    return (
                                        <SortableStopRow
                                            key={routeStop.orderNumber}
                                            routeStop={routeStop}
                                            actualIndex={idx}
                                            stopsCount={stops.length}
                                            isSelected={isSelected}
                                            isInCoordinateEditingMode={isInCoordMode}
                                            isSearchingThis={isSearchingThis}
                                            isSearchingAllStops={isSearchingAllStops}
                                            onSelect={handleSelectStop}
                                            onCopyRouteStopId={handleCopyRouteStopId}
                                            onCopyStopId={handleCopyStopId}
                                            onSearch={handleSearchSingleStopExistence}
                                            onFieldChange={handleFieldChange}
                                            onToggleCoordinateEditing={handleToggleCoordinateEditingMode}
                                            onDelete={handleDeleteStop}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </SortableContext>
                </div>

                {/* Add stop button */}
                <div className="p-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddIntermediateStop}
                        className="w-full border-dashed text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/40"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Intermediate Stop
                    </Button>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="bg-card border-2 border-primary/40 rounded-lg shadow-lg opacity-95 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                                <GripVertical className="text-muted-foreground/70 h-4 w-4" />
                                <span className="text-sm font-medium">
                                    {stops.find(s => `stop-${s.orderNumber}` === activeId)?.stop.name || 'Moving...'}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}