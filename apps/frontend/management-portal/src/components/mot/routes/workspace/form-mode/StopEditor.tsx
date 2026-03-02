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
import { BusStopManagementService } from "../../../../../../generated/api-clients/route-management";
import type { StopRequest } from "../../../../../../generated/api-clients/route-management";

interface StopEditorProps {
    onToggle: () => void;
    collapsed: boolean;
}

export default function StopEditor({ onToggle, collapsed }: StopEditorProps) {
    const { data, selectedRouteIndex, selectedStopIndex, updateRouteStop } = useRouteWorkspace();
    const { toast } = useToast();
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);    // Get selected stop data
    const selectedStop =
        selectedRouteIndex !== null &&
            selectedStopIndex !== null &&
            data.routeGroup.routes[selectedRouteIndex]?.routeStops[selectedStopIndex]
            ? data.routeGroup.routes[selectedRouteIndex].routeStops[selectedStopIndex]
            : null;

    const handleFieldChange = (field: string, value: any) => {
        if (selectedRouteIndex === null || selectedStopIndex === null) return;

        const currentStop = selectedStop?.stop;
        if (!currentStop) return;

        // Helper to ensure location has required fields
        const ensureValidLocation = (partialLocation: Partial<Location>): Location => {
            const existingLocation = currentStop.location;
            return {
                latitude: partialLocation.latitude ?? existingLocation?.latitude ?? 0,
                longitude: partialLocation.longitude ?? existingLocation?.longitude ?? 0,
                address: partialLocation.address ?? existingLocation?.address,
                city: partialLocation.city ?? existingLocation?.city,
                state: partialLocation.state ?? existingLocation?.state,
                zipCode: partialLocation.zipCode ?? existingLocation?.zipCode,
                country: partialLocation.country ?? existingLocation?.country,
                addressSinhala: partialLocation.addressSinhala ?? existingLocation?.addressSinhala,
                citySinhala: partialLocation.citySinhala ?? existingLocation?.citySinhala,
                stateSinhala: partialLocation.stateSinhala ?? existingLocation?.stateSinhala,
                countrySinhala: partialLocation.countrySinhala ?? existingLocation?.countrySinhala,
                addressTamil: partialLocation.addressTamil ?? existingLocation?.addressTamil,
                cityTamil: partialLocation.cityTamil ?? existingLocation?.cityTamil,
                stateTamil: partialLocation.stateTamil ?? existingLocation?.stateTamil,
                countryTamil: partialLocation.countryTamil ?? existingLocation?.countryTamil,
            };
        };

        // Update specific fields in the context
        if (field === 'name') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, name: value }
            });
        } else if (field === 'nameSinhala') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, nameSinhala: value }
            });
        } else if (field === 'nameTamil') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, nameTamil: value }
            });
        } else if (field === 'description') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, description: value }
            });
        } else if (field === 'latitude') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ latitude: value })
                }
            });
        } else if (field === 'longitude') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ longitude: value })
                }
            });
        } else if (field === 'address') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ address: value })
                }
            });
        } else if (field === 'addressSinhala') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ addressSinhala: value })
                }
            });
        } else if (field === 'addressTamil') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ addressTamil: value })
                }
            });
        } else if (field === 'city') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ city: value })
                }
            });
        } else if (field === 'citySinhala') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ citySinhala: value })
                }
            });
        } else if (field === 'cityTamil') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ cityTamil: value })
                }
            });
        } else if (field === 'state') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ state: value })
                }
            });
        } else if (field === 'stateSinhala') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ stateSinhala: value })
                }
            });
        } else if (field === 'stateTamil') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ stateTamil: value })
                }
            });
        } else if (field === 'zipCode') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ zipCode: value })
                }
            });
        } else if (field === 'country') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ country: value })
                }
            });
        } else if (field === 'countrySinhala') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ countrySinhala: value })
                }
            });
        } else if (field === 'countryTamil') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: {
                    ...currentStop,
                    location: ensureValidLocation({ countryTamil: value })
                }
            });
        } else if (field === 'isAccessible') {
            updateRouteStop(selectedRouteIndex, selectedStopIndex, {
                stop: { ...currentStop, isAccessible: value }
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

    return (
        <div className={`flex flex-col border-r-3 border-gray-300 px-2 py-2 ${collapsed ? 'w-12 overflow-hidden' : ''}`}>
            <div className={`flex ${collapsed ? 'flex-col items-center py-3' : 'justify-between items-center px-3 py-2'}`}>
                {collapsed ? (
                    <div className="flex flex-col gap-8">
                        <button onClick={onToggle} className="p-1.5 hover:bg-slate-200 rounded transition-colors flex items-center justify-center">
                            <img src="/icons/Sidebar-Collapse--Streamline-Iconoir.svg" className="w-4 h-4 rotate-180 opacity-60" alt="Expand" />
                        </button>
                        <span className="transform -rotate-90 origin-center whitespace-nowrap text-xs font-medium text-slate-600">Stop Editor</span>
                    </div>
                ) : (
                    <>
                        <span className="text-sm font-medium text-slate-700">Stop Editor</span>
                        <button onClick={onToggle} className="p-1.5 hover:bg-slate-200 rounded transition-colors flex items-center justify-center">
                            <img src="/icons/Sidebar-Collapse--Streamline-Iconoir.svg" className="w-4 h-4 opacity-60" alt="Collapse" />
                        </button>
                    </>
                )}
            </div>
            {!collapsed && (
                <div className="px-3 pb-3">
                    {!selectedStop ? (
                        <div className="text-center text-slate-400 py-8">
                            <p className="text-xs">Select a route stop from the list to edit</p>
                        </div>
                    ) : (
                        <form className="space-y-3">
                            {/* Top action bar for stop tasks */}
                            <div className="bg-white border border-slate-200 px-2 py-1.5 rounded-lg flex gap-2 justify-between">
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleCreateStop}
                                        disabled={isCreating || isUpdating || isSearching}
                                        className="px-2.5 py-1 bg-violet-600 text-xs font-medium text-white rounded-md hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                    >
                                        {isCreating ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating...
                                            </>
                                        ) : (
                                            'Create'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdateStop}
                                        disabled={isUpdating || isCreating || isSearching}
                                        className="px-2.5 py-1 bg-emerald-600 text-xs font-medium text-white rounded-md hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : (
                                            'Update'
                                        )}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSearchExistingStop}
                                    disabled={isSearching || isCreating || isUpdating}
                                    className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                                >
                                    {isSearching ? (
                                        <>
                                            <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Search
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="flex gap-3 items-center">
                                <label className="text-xs font-medium text-slate-600">Id:</label>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedStop.stop.type === StopExistenceType.EXISTING ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {selectedStop.stop.id || 'new'}
                                </span>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Name (Eng)</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={selectedStop.stop.name || ''}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Name (Sin)</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={selectedStop.stop.nameSinhala || ''}
                                    onChange={(e) => handleFieldChange('nameSinhala', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Name (Tam)</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={selectedStop.stop.nameTamil || ''}
                                    onChange={(e) => handleFieldChange('nameTamil', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                    rows={2}
                                    value={selectedStop.stop.description || ''}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        value={selectedStop.stop.location?.latitude || ''}
                                        onChange={(e) => handleFieldChange('latitude', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        value={selectedStop.stop.location?.longitude || ''}
                                        onChange={(e) => handleFieldChange('longitude', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Address (Eng)</label>
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={selectedStop.stop.location?.address || ''}
                                    onChange={(e) => handleFieldChange('address', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Address (Sin)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                    value={selectedStop.stop.location?.addressSinhala || ''}
                                    onChange={(e) => handleFieldChange('addressSinhala', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Address (Tam)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                    value={selectedStop.stop.location?.addressTamil || ''}
                                    onChange={(e) => handleFieldChange('addressTamil', e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">City (Eng)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.city || ''}
                                        onChange={(e) => handleFieldChange('city', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">City (Sin)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.citySinhala || ''}
                                        onChange={(e) => handleFieldChange('citySinhala', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">City (Tam)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.cityTamil || ''}
                                        onChange={(e) => handleFieldChange('cityTamil', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">State (Eng)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.state || ''}
                                        onChange={(e) => handleFieldChange('state', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">State (Sin)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.stateSinhala || ''}
                                        onChange={(e) => handleFieldChange('stateSinhala', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">State (Tam)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.stateTamil || ''}
                                        onChange={(e) => handleFieldChange('stateTamil', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Zip Code</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.zipCode || ''}
                                        onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Country (Eng)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.country || ''}
                                        onChange={(e) => handleFieldChange('country', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Country (Sin)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.countrySinhala || ''}
                                        onChange={(e) => handleFieldChange('countrySinhala', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Country (Tam)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-400 rounded px-2 py-1 bg-white"
                                        value={selectedStop.stop.location?.countryTamil || ''}
                                        onChange={(e) => handleFieldChange('countryTamil', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="accessible"
                                    checked={selectedStop.stop.isAccessible || false}
                                    onChange={(e) => handleFieldChange('isAccessible', e.target.checked)}
                                />
                                <label htmlFor="accessible" className="ml-2 text-sm">Accessible</label>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}
