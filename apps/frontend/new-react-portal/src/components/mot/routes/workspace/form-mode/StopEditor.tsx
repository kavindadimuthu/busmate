'use client';

import { useState } from "react";
import { useRouteWorkspace } from "@/context/RouteWorkspace/useRouteWorkspace";
import { StopExistenceType, Location } from "@/types/RouteWorkspaceData";
import { useToast } from "@/hooks/use-toast";
import {
    searchStopExistence,
    processStopExistenceResult,
    canSearchStop
} from "@/services/routeWorkspaceValidation";
import { BusStopManagementService } from '@busmate/api-client-route';
import type { StopRequest } from '@busmate/api-client-route';

import {
    Input,
    Label,
    Textarea,
    Button,
    Badge,
    ScrollArea,
    Separator,
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@busmate/ui';
import {
    X, ChevronDown, MapPin, Search, Plus, Save,
    Loader2, Accessibility, Type, Navigation, Globe,
} from "lucide-react";

/* ─── Fields that update stop.location rather than stop directly ─── */
const LOCATION_FIELDS = new Set([
    'latitude', 'longitude',
    'address', 'addressSinhala', 'addressTamil',
    'city', 'citySinhala', 'cityTamil',
    'state', 'stateSinhala', 'stateTamil',
    'zipCode',
    'country', 'countrySinhala', 'countryTamil',
]);

/* ─── Collapsible section for the editor ─── */
function EditorSection({ title, icon, defaultOpen = false, badge, children }: {
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full py-2 px-3 hover:bg-muted rounded-md transition-colors text-left">
                    <div className="flex items-center gap-2">
                        {icon}
                        <span className="text-sm font-medium text-muted-foreground">{title}</span>
                        {badge}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="px-3 pt-1 pb-3 space-y-3">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

/* ─── Compact form field wrapper ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

export default function StopEditor() {
    const { data, selectedRouteIndex, selectedStopIndex, updateRouteStop, clearSelectedStop } = useRouteWorkspace();
    const { toast } = useToast();
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const open = selectedStopIndex !== null && selectedRouteIndex !== null;

    // Get selected stop data
    const selectedStop =
        selectedRouteIndex !== null &&
            selectedStopIndex !== null &&
            data.routeGroup.routes[selectedRouteIndex]?.routeStops[selectedStopIndex]
            ? data.routeGroup.routes[selectedRouteIndex].routeStops[selectedStopIndex]
            : null;

    /* ─── Generic field change handler (replaces long if-else chain) ─── */
    const handleFieldChange = (field: string, value: any) => {
        if (selectedRouteIndex === null || selectedStopIndex === null) return;
        const currentStop = selectedStop?.stop;
        if (!currentStop) return;

        const ensureValidLocation = (partial: Partial<Location>): Location => {
            const loc = currentStop.location;
            return {
                latitude: partial.latitude ?? loc?.latitude ?? 0,
                longitude: partial.longitude ?? loc?.longitude ?? 0,
                address: partial.address ?? loc?.address,
                city: partial.city ?? loc?.city,
                state: partial.state ?? loc?.state,
                zipCode: partial.zipCode ?? loc?.zipCode,
                country: partial.country ?? loc?.country,
                addressSinhala: partial.addressSinhala ?? loc?.addressSinhala,
                citySinhala: partial.citySinhala ?? loc?.citySinhala,
                stateSinhala: partial.stateSinhala ?? loc?.stateSinhala,
                countrySinhala: partial.countrySinhala ?? loc?.countrySinhala,
                addressTamil: partial.addressTamil ?? loc?.addressTamil,
                cityTamil: partial.cityTamil ?? loc?.cityTamil,
                stateTamil: partial.stateTamil ?? loc?.stateTamil,
                countryTamil: partial.countryTamil ?? loc?.countryTamil,
            };
        };

        if (LOCATION_FIELDS.has(field)) {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, location: ensureValidLocation({ [field]: value }) }
            });
        } else {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, [field]: value }
            });
        }
    };

    const handleSearchExistingStop = async () => {
        if (selectedRouteIndex === null || selectedStopIndex === null || !selectedStop) {
            toast({
                title: "Error",
                description: "No stop selected",
                variant: "destructive"
            });
            return;
        }

        const currentStop = selectedStop.stop;

        // Check if stop can be searched
        if (!canSearchStop(currentStop)) {
            toast({
                title: "Search Criteria Missing",
                description: "Please enter either a Stop ID or Name to search",
                variant: "destructive"
            });
            return;
        }

        setIsSearching(true);

        try {
            const result = await searchStopExistence(currentStop);

            if (result.error) {
                toast({
                    title: "Search Failed",
                    description: result.error,
                    variant: "destructive"
                });
            } else if (result.found && result.stop) {
                // Stop found - update with fetched data
                updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                    stop: result.stop
                });

                toast({
                    title: "Stop Found",
                    description: `Successfully loaded: ${result.stop.name}`,
                    variant: "default"
                });
            } else {
                // Stop not found - process result to handle ID clearing
                const processedResult = processStopExistenceResult(currentStop, result);

                // Update the stop with processed data (clears ID if searched by ID and not found)
                updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                    stop: processedResult.stop
                });

                const message = processedResult.clearIdIfNotFound
                    ? `No stop found with ${result.searchedBy}: ${result.searchValue}. Invalid ID has been cleared.`
                    : `No stop found with ${result.searchedBy}: ${result.searchValue}`;

                toast({
                    title: "Stop Not Found",
                    description: message,
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            console.error('Error searching for stop:', error);
            toast({
                title: "Search Failed",
                description: error.message || "Failed to search for existing stop",
                variant: "destructive"
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleCreateStop = async () => {
        if (selectedRouteIndex === null || selectedStopIndex === null || !selectedStop) {
            toast({
                title: "Error",
                description: "No stop selected",
                variant: "destructive"
            });
            return;
        }

        const currentStop = selectedStop.stop;

        // Check if stop already has an ID (might be existing)
        if (currentStop.id && currentStop.id.trim() !== '') {
            toast({
                title: "Cannot Create",
                description: "This stop already has an ID. It might be an existing stop. Use Update instead.",
                variant: "destructive"
            });
            return;
        }

        // Check if stop name is provided
        if (!currentStop.name || currentStop.name.trim() === '') {
            toast({
                title: "Validation Error",
                description: "Stop name is required to create a stop",
                variant: "destructive"
            });
            return;
        }

        // Check if stop exists by name
        setIsCreating(true);
        try {
            // First check if stop exists by name
            const existsResult = await searchStopExistence(currentStop);

            if (existsResult.found) {
                toast({
                    title: "Stop Already Exists",
                    description: `A stop with name "${currentStop.name}" already exists in the system. Use Search to load it.`,
                    variant: "destructive"
                });
                setIsCreating(false);
                return;
            }

            // Validate location data
            if (!currentStop.location ||
                currentStop.location.latitude === 0 ||
                currentStop.location.longitude === 0) {
                toast({
                    title: "Validation Error",
                    description: "Valid coordinates (latitude and longitude) are required to create a stop",
                    variant: "destructive"
                });
                setIsCreating(false);
                return;
            }

            // Prepare stop request
            const stopRequest: StopRequest = {
                name: currentStop.name,
                nameSinhala: currentStop.nameSinhala,
                nameTamil: currentStop.nameTamil,
                description: currentStop.description,
                location: {
                    latitude: currentStop.location.latitude,
                    longitude: currentStop.location.longitude,
                    address: currentStop.location.address,
                    city: currentStop.location.city,
                    state: currentStop.location.state,
                    zipCode: currentStop.location.zipCode,
                    country: currentStop.location.country,
                    addressSinhala: currentStop.location.addressSinhala,
                    citySinhala: currentStop.location.citySinhala,
                    stateSinhala: currentStop.location.stateSinhala,
                    countrySinhala: currentStop.location.countrySinhala,
                    addressTamil: currentStop.location.addressTamil,
                    cityTamil: currentStop.location.cityTamil,
                    stateTamil: currentStop.location.stateTamil,
                    countryTamil: currentStop.location.countryTamil,
                },
                isAccessible: currentStop.isAccessible
            };

            // Create the stop
            const createdStop = await BusStopManagementService.createStop(stopRequest);

            // Update the stop with created data (including ID)
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    id: createdStop.id ?? '',
                    name: createdStop.name ?? '',
                    nameSinhala: createdStop.nameSinhala,
                    nameTamil: createdStop.nameTamil,
                    description: createdStop.description,
                    location: {
                        latitude: createdStop.location?.latitude ?? 0,
                        longitude: createdStop.location?.longitude ?? 0,
                        address: createdStop.location?.address,
                        city: createdStop.location?.city,
                        state: createdStop.location?.state,
                        zipCode: createdStop.location?.zipCode,
                        country: createdStop.location?.country,
                        addressSinhala: createdStop.location?.addressSinhala,
                        citySinhala: createdStop.location?.citySinhala,
                        stateSinhala: createdStop.location?.stateSinhala,
                        countrySinhala: createdStop.location?.countrySinhala,
                        addressTamil: createdStop.location?.addressTamil,
                        cityTamil: createdStop.location?.cityTamil,
                        stateTamil: createdStop.location?.stateTamil,
                        countryTamil: createdStop.location?.countryTamil,
                    },
                    isAccessible: createdStop.isAccessible,
                    type: StopExistenceType.EXISTING
                }
            });

            toast({
                title: "Stop Created",
                description: `Stop "${createdStop.name}" created successfully with ID: ${createdStop.id}`,
                variant: "default"
            });
        } catch (error: any) {
            console.error('Error creating stop:', error);
            const errorMessage = error.body?.message || error.message || "Failed to create stop";
            toast({
                title: "Creation Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateStop = async () => {
        if (selectedRouteIndex === null || selectedStopIndex === null || !selectedStop) {
            toast({
                title: "Error",
                description: "No stop selected",
                variant: "destructive"
            });
            return;
        }

        const currentStop = selectedStop.stop;

        // Check if stop has an ID
        if (!currentStop.id || currentStop.id.trim() === '') {
            toast({
                title: "Cannot Update",
                description: "This stop doesn't have an ID. Create it first before updating.",
                variant: "destructive"
            });
            return;
        }

        // Check if stop name is provided
        if (!currentStop.name || currentStop.name.trim() === '') {
            toast({
                title: "Validation Error",
                description: "Stop name is required to update a stop",
                variant: "destructive"
            });
            return;
        }

        // Validate location data
        if (!currentStop.location ||
            currentStop.location.latitude === 0 ||
            currentStop.location.longitude === 0) {
            toast({
                title: "Validation Error",
                description: "Valid coordinates (latitude and longitude) are required to update a stop",
                variant: "destructive"
            });
            return;
        }

        setIsUpdating(true);
        try {
            // Prepare stop request
            const stopRequest: StopRequest = {
                name: currentStop.name,
                nameSinhala: currentStop.nameSinhala,
                nameTamil: currentStop.nameTamil,
                description: currentStop.description,
                location: {
                    latitude: currentStop.location.latitude,
                    longitude: currentStop.location.longitude,
                    address: currentStop.location.address,
                    city: currentStop.location.city,
                    state: currentStop.location.state,
                    zipCode: currentStop.location.zipCode,
                    country: currentStop.location.country,
                    addressSinhala: currentStop.location.addressSinhala,
                    citySinhala: currentStop.location.citySinhala,
                    stateSinhala: currentStop.location.stateSinhala,
                    countrySinhala: currentStop.location.countrySinhala,
                    addressTamil: currentStop.location.addressTamil,
                    cityTamil: currentStop.location.cityTamil,
                    stateTamil: currentStop.location.stateTamil,
                    countryTamil: currentStop.location.countryTamil,
                },
                isAccessible: currentStop.isAccessible
            };

            // Update the stop
            const updatedStop = await BusStopManagementService.updateStop(currentStop.id, stopRequest);

            // Update the stop with updated data
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    id: updatedStop.id ?? '',
                    name: updatedStop.name ?? '',
                    nameSinhala: updatedStop.nameSinhala,
                    nameTamil: updatedStop.nameTamil,
                    description: updatedStop.description,
                    location: {
                        latitude: updatedStop.location?.latitude ?? 0,
                        longitude: updatedStop.location?.longitude ?? 0,
                        address: updatedStop.location?.address,
                        city: updatedStop.location?.city,
                        state: updatedStop.location?.state,
                        zipCode: updatedStop.location?.zipCode,
                        country: updatedStop.location?.country,
                        addressSinhala: updatedStop.location?.addressSinhala,
                        citySinhala: updatedStop.location?.citySinhala,
                        stateSinhala: updatedStop.location?.stateSinhala,
                        countrySinhala: updatedStop.location?.countrySinhala,
                        addressTamil: updatedStop.location?.addressTamil,
                        cityTamil: updatedStop.location?.cityTamil,
                        stateTamil: updatedStop.location?.stateTamil,
                        countryTamil: updatedStop.location?.countryTamil,
                    },
                    isAccessible: updatedStop.isAccessible,
                    type: StopExistenceType.EXISTING
                }
            });

            toast({
                title: "Stop Updated",
                description: `Stop "${updatedStop.name}" updated successfully`,
                variant: "default"
            });
        } catch (error: any) {
            console.error('Error updating stop:', error);
            const errorMessage = error.body?.message || error.message || "Failed to update stop";
            toast({
                title: "Update Failed",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const isBusy = isSearching || isCreating || isUpdating;

    return (
        <TooltipProvider>
            {/* Backdrop — click to close */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 transition-opacity"
                    onClick={clearSelectedStop}
                />
            )}

            {/* Slide-over panel */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-card border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="text-sm font-semibold text-muted-foreground truncate">
                            {selectedStop?.stop.name || 'Stop Editor'}
                        </h3>
                        {selectedStop && (
                            <Badge
                                variant={selectedStop.stop.type === StopExistenceType.EXISTING ? 'default' : 'secondary'}
                                className="text-[10px] px-1.5 py-0 shrink-0"
                            >
                                {selectedStop.stop.type === StopExistenceType.EXISTING ? 'Existing' : 'New'}
                            </Badge>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearSelectedStop}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {selectedStop ? (
                    <>
                        {/* ── Action bar ── */}
                        <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2 shrink-0">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSearchExistingStop}
                                        disabled={isBusy}
                                        className="h-8 text-xs gap-1.5"
                                    >
                                        {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                        Search
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Search for this stop in the database</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        onClick={handleCreateStop}
                                        disabled={isBusy}
                                        className="h-8 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700"
                                    >
                                        {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                        Create
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Create a new stop in the database</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        onClick={handleUpdateStop}
                                        disabled={isBusy}
                                        className="h-8 text-xs gap-1.5 bg-success hover:bg-success"
                                    >
                                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        Update
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Update this stop in the database</TooltipContent>
                            </Tooltip>
                        </div>

                        {/* ── Scrollable form ── */}
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {/* Basic Info */}
                                <EditorSection
                                    title="Basic Info"
                                    icon={<Type className="h-4 w-4 text-muted-foreground/70" />}
                                    defaultOpen
                                    badge={
                                        selectedStop.stop.id ? (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                                                {selectedStop.stop.id.length > 12
                                                    ? `${selectedStop.stop.id.substring(0, 12)}…`
                                                    : selectedStop.stop.id}
                                            </Badge>
                                        ) : null
                                    }
                                >
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground/70">ID:</span>
                                        <span className="font-mono text-muted-foreground">
                                            {selectedStop.stop.id || <span className="text-muted-foreground/50 italic">Not assigned</span>}
                                        </span>
                                    </div>

                                    <Field label="Name (English)">
                                        <Input
                                            value={selectedStop.stop.name || ''}
                                            onChange={(e) => handleFieldChange('name', e.target.value)}
                                            placeholder="Enter stop name"
                                            className="h-8 text-sm"
                                        />
                                    </Field>

                                    <Field label="Description">
                                        <Textarea
                                            value={selectedStop.stop.description || ''}
                                            onChange={(e) => handleFieldChange('description', e.target.value)}
                                            placeholder="Optional description"
                                            rows={2}
                                            className="text-sm resize-none"
                                        />
                                    </Field>
                                </EditorSection>

                                <Separator />

                                {/* Translations */}
                                <EditorSection
                                    title="Translations"
                                    icon={<Globe className="h-4 w-4 text-muted-foreground/70" />}
                                >
                                    <Field label="Name (Sinhala)">
                                        <Input
                                            value={selectedStop.stop.nameSinhala || ''}
                                            onChange={(e) => handleFieldChange('nameSinhala', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </Field>
                                    <Field label="Name (Tamil)">
                                        <Input
                                            value={selectedStop.stop.nameTamil || ''}
                                            onChange={(e) => handleFieldChange('nameTamil', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </Field>
                                </EditorSection>

                                <Separator />

                                {/* Coordinates */}
                                <EditorSection
                                    title="Coordinates"
                                    icon={<Navigation className="h-4 w-4 text-muted-foreground/70" />}
                                    defaultOpen
                                >
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label="Latitude">
                                            <Input
                                                type="number"
                                                step="any"
                                                value={selectedStop.stop.location?.latitude || ''}
                                                onChange={(e) => handleFieldChange('latitude', parseFloat(e.target.value) || 0)}
                                                className="h-8 text-sm font-mono"
                                            />
                                        </Field>
                                        <Field label="Longitude">
                                            <Input
                                                type="number"
                                                step="any"
                                                value={selectedStop.stop.location?.longitude || ''}
                                                onChange={(e) => handleFieldChange('longitude', parseFloat(e.target.value) || 0)}
                                                className="h-8 text-sm font-mono"
                                            />
                                        </Field>
                                    </div>
                                </EditorSection>

                                <Separator />

                                {/* Address */}
                                <EditorSection
                                    title="Address"
                                    icon={<MapPin className="h-4 w-4 text-muted-foreground/70" />}
                                >
                                    <Field label="Address (English)">
                                        <Input
                                            value={selectedStop.stop.location?.address || ''}
                                            onChange={(e) => handleFieldChange('address', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </Field>
                                    <Field label="Address (Sinhala)">
                                        <Input
                                            value={selectedStop.stop.location?.addressSinhala || ''}
                                            onChange={(e) => handleFieldChange('addressSinhala', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </Field>
                                    <Field label="Address (Tamil)">
                                        <Input
                                            value={selectedStop.stop.location?.addressTamil || ''}
                                            onChange={(e) => handleFieldChange('addressTamil', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </Field>

                                    <div className="grid grid-cols-3 gap-2">
                                        <Field label="City (Eng)">
                                            <Input
                                                value={selectedStop.stop.location?.city || ''}
                                                onChange={(e) => handleFieldChange('city', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                        <Field label="City (Sin)">
                                            <Input
                                                value={selectedStop.stop.location?.citySinhala || ''}
                                                onChange={(e) => handleFieldChange('citySinhala', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                        <Field label="City (Tam)">
                                            <Input
                                                value={selectedStop.stop.location?.cityTamil || ''}
                                                onChange={(e) => handleFieldChange('cityTamil', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <Field label="State (Eng)">
                                            <Input
                                                value={selectedStop.stop.location?.state || ''}
                                                onChange={(e) => handleFieldChange('state', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                        <Field label="State (Sin)">
                                            <Input
                                                value={selectedStop.stop.location?.stateSinhala || ''}
                                                onChange={(e) => handleFieldChange('stateSinhala', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                        <Field label="State (Tam)">
                                            <Input
                                                value={selectedStop.stop.location?.stateTamil || ''}
                                                onChange={(e) => handleFieldChange('stateTamil', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Zip Code">
                                        <Input
                                            value={selectedStop.stop.location?.zipCode || ''}
                                            onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                                            className="h-8 text-sm w-1/3"
                                        />
                                    </Field>

                                    <div className="grid grid-cols-3 gap-2">
                                        <Field label="Country (Eng)">
                                            <Input
                                                value={selectedStop.stop.location?.country || ''}
                                                onChange={(e) => handleFieldChange('country', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                        <Field label="Country (Sin)">
                                            <Input
                                                value={selectedStop.stop.location?.countrySinhala || ''}
                                                onChange={(e) => handleFieldChange('countrySinhala', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                        <Field label="Country (Tam)">
                                            <Input
                                                value={selectedStop.stop.location?.countryTamil || ''}
                                                onChange={(e) => handleFieldChange('countryTamil', e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </Field>
                                    </div>
                                </EditorSection>

                                <Separator />

                                {/* Options */}
                                <EditorSection
                                    title="Options"
                                    icon={<Accessibility className="h-4 w-4 text-muted-foreground/70" />}
                                >
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedStop.stop.isAccessible || false}
                                            onChange={(e) => handleFieldChange('isAccessible', e.target.checked)}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-muted-foreground">Wheelchair accessible</span>
                                    </label>
                                </EditorSection>
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    /* Empty state when panel is open but no stop selected */
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center text-muted-foreground/70">
                            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Select a stop from the list to edit its details</p>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
