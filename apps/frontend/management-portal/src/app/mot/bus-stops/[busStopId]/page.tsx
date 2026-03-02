'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Clock,
  User,
  Check,
  X,
  Navigation,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { useSetPageMetadata, useSetPageActions } from '@/context/PageContext';
import { StopResponse, BusStopManagementService } from '../../../../../generated/api-clients/route-management';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import DeleteBusStopModal from '@/components/mot/bus-stops/DeleteBusStopModal';

interface BusStopDetailsPageProps {
  params: { busStopId: string };
}

// Google Maps Mini Map Component
const BusStopMiniMap = ({ 
  latitude, 
  longitude, 
  name, 
  address,
  onCopyCoordinates 
}: { 
  latitude: number; 
  longitude: number; 
  name: string; 
  address?: string;
  onCopyCoordinates: (text: string, field: string) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // Use centralized Google Maps loader
  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || isMapInitialized) return;

    try {
      const mapOptions: google.maps.MapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DEFAULT,
          position: google.maps.ControlPosition.TOP_RIGHT,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER,
        },
        fullscreenControl: false,
        gestureHandling: 'cooperative',
      };

      // Create map
      googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);

      // Create marker
      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: googleMapRef.current,
        title: name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 600; color: #1f2937;">${name}</h4>
            ${address ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${address}</p>` : ''}
            <div style="margin-top: 8px;">
              <small style="color: #9ca3af;">Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}</small>
            </div>
          </div>
        `,
      });

      // Add click listener to marker
      markerRef.current.addListener('click', () => {
        infoWindow.open(googleMapRef.current, markerRef.current);
      });

      setIsMapInitialized(true);
    } catch (error) {
      console.error('Error creating map:', error);
    }

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [isLoaded, latitude, longitude, name, address, isMapInitialized]);

  // Reset map view
  const resetMapView = useCallback(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: latitude, lng: longitude });
      googleMapRef.current.setZoom(16);
    }
  }, [latitude, longitude]);

  // Open in full screen Google Maps
  const openInFullMaps = useCallback(() => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=16`;
    window.open(url, '_blank');
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-3">Failed to load Google Maps</p>
        <button
          onClick={openInFullMaps}
          className="text-blue-600 hover:text-blue-700 text-sm underline"
        >
          View on Google Maps
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg bg-gray-200"
        style={{ minHeight: '256px' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {isMapInitialized && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={resetMapView}
            className="bg-white hover:bg-gray-50 p-2 rounded-md shadow-md border border-gray-200 transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={openInFullMaps}
            className="bg-white hover:bg-gray-50 p-2 rounded-md shadow-md border border-gray-200 transition-colors"
            title="Open in Google Maps"
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Coordinates overlay - removed from map, will be shown below */}
    </div>
  );
};

function BusStopDetailsContent({ params }: BusStopDetailsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for resolved params
  const [busStopId, setBusStopId] = useState<string>('');
  
  // Resolve params asynchronously
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.busStopId || searchParams.get('id') || '';
      
      // If the busStopId is 'add', redirect to the correct add page
      if (id === 'add') {
        router.replace('/mot/bus-stops/add-new');
        return;
      }
      
      setBusStopId(id);
    };
    
    resolveParams();
  }, [params, searchParams, router]);
  
  // State management
  const [busStop, setBusStop] = useState<StopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeLanguageTab, setActiveLanguageTab] = useState<'english' | 'sinhala' | 'tamil'>('english');

  // Toast for notifications
  const { toast } = useToast();

  // Page metadata and actions (must be called unconditionally - React rules of hooks)
  useSetPageMetadata({
    title: `${busStop?.name || 'Bus Stop'} - Details`,
    description: 'View detailed information about this bus stop',
    activeItem: 'bus-stops',
    showBreadcrumbs: true,
    breadcrumbs: [{ label: 'Bus Stops', href: '/mot/bus-stops' }, { label: busStop?.name || 'Bus Stop Details' }],
  });

  // Load bus stop details
  const loadBusStopDetails = useCallback(async () => {
    if (!busStopId) {
      // Don't show error immediately, busStopId might still be loading
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await BusStopManagementService.getStopById(busStopId);
      if (data) {
        setBusStop(data);
      } else {
        setError('Bus stop not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load bus stop details');
    } finally {
      setLoading(false);
    }
  }, [busStopId]);

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  // Delete handlers
  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!busStop?.id) return;

    setIsDeleting(true);
    try {
      await BusStopManagementService.deleteStop(busStop.id);
      toast({
        title: "Bus Stop Deleted",
        description: `${busStop.name} has been deleted successfully.`,
      });
      setShowDeleteModal(false);
      // Add a small delay to show the modal closing animation
      setTimeout(() => {
        router.push('/mot/bus-stops');
      }, 300);
    } catch (err) {
      console.error('Failed to delete bus stop:', err);
      const errorMessage = 'Failed to delete bus stop';
      setError(errorMessage);
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Keep the modal open on error so user can see what happened
    } finally {
      setIsDeleting(false);
    }
  }, [busStop, router, toast]);

  useSetPageActions(
    busStop ? (
      <>
        <button
          onClick={() => router.push('/mot/bus-stops')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Bus Stops
        </button>
        <button
          onClick={() => router.push(`/mot/bus-stops/${busStop.id}/edit`)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </button>
        <button
          onClick={handleDeleteClick}
          className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </button>
      </>
    ) : null
  );

  // Open in Google Maps
  const openInMaps = useCallback(() => {
    if (busStop?.location?.latitude && busStop?.location?.longitude) {
      const url = `https://www.google.com/maps?q=${busStop.location.latitude},${busStop.location.longitude}`;
      window.open(url, '_blank');
    }
  }, [busStop]);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Load data when busStopId is available
  useEffect(() => {
    if (busStopId) {
      loadBusStopDetails();
    }
  }, [busStopId, loadBusStopDetails]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !busStop) {
    return (
      <div className="mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800">Error Loading Bus Stop</h3>
              <p className="text-red-700 mt-1">{error || 'Bus stop not found'}</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={loadBusStopDetails}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2 inline" />
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/mot/bus-stops')}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 inline" />
                  Back to Bus Stops
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CopyableField = ({ value, field, className = "" }: { value: string; field: string; className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex-1">{value}</span>
      <button
        onClick={() => copyToClipboard(value, field)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Copy to clipboard"
      >
        {copiedField === field ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );

  // Check if coordinates are available for map
  const hasCoordinates = busStop.location?.latitude && busStop.location?.longitude;

  return (
      <div className="mx-auto px-4 space-y-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stop Name
                  </label>
                  <CopyableField 
                    value={busStop.name || 'N/A'} 
                    field="name"
                    className="text-lg font-medium text-gray-900"
                  />
                </div>

                {busStop.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-gray-600 leading-relaxed">{busStop.description}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stop ID
                  </label>
                  <CopyableField 
                    value={busStop.id || 'N/A'} 
                    field="id"
                    className="text-sm font-mono text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accessibility
                  </label>
                  <div className="flex items-center gap-2">
                    {busStop.isAccessible ? (
                      <>
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 font-medium">Accessible</span>
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 font-medium">Not Accessible</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information with Language Tabs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location Details
              </h2>
              
              {/* Language Tabs */}
              <div className="flex gap-1 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveLanguageTab('english')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeLanguageTab === 'english'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setActiveLanguageTab('sinhala')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeLanguageTab === 'sinhala'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  සිංහල
                </button>
                <button
                  onClick={() => setActiveLanguageTab('tamil')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    activeLanguageTab === 'tamil'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              {/* English Tab Content */}
              {activeLanguageTab === 'english' && (
                <div className="space-y-4">
                  {busStop.location?.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <CopyableField 
                        value={busStop.location.address} 
                        field="address"
                        className="text-gray-900"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busStop.location?.city && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <CopyableField 
                          value={busStop.location.city} 
                          field="city"
                          className="text-gray-900"
                        />
                      </div>
                    )}

                    {busStop.location?.state && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <CopyableField 
                          value={busStop.location.state} 
                          field="state"
                          className="text-gray-900"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busStop.location?.zipCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code
                        </label>
                        <CopyableField 
                          value={busStop.location.zipCode} 
                          field="zipCode"
                          className="text-gray-900"
                        />
                      </div>
                    )}

                    {busStop.location?.country && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <CopyableField 
                          value={busStop.location.country} 
                          field="country"
                          className="text-gray-900"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sinhala Tab Content */}
              {activeLanguageTab === 'sinhala' && (
                <div className="space-y-4">
                  {busStop.location?.addressSinhala ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ලිපිනය (Address)
                      </label>
                      <CopyableField 
                        value={busStop.location.addressSinhala} 
                        field="addressSinhala"
                        className="text-gray-900"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No Sinhala address available</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busStop.location?.citySinhala ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          නගරය (City)
                        </label>
                        <CopyableField 
                          value={busStop.location.citySinhala} 
                          field="citySinhala"
                          className="text-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">No city available</div>
                    )}

                    {busStop.location?.stateSinhala ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          පළාත (State/Province)
                        </label>
                        <CopyableField 
                          value={busStop.location.stateSinhala} 
                          field="stateSinhala"
                          className="text-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">No state available</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busStop.location?.zipCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          තැපැල් කේතය (ZIP/Postal Code)
                        </label>
                        <CopyableField 
                          value={busStop.location.zipCode} 
                          field="zipCode-sinhala"
                          className="text-gray-900"
                        />
                      </div>
                    )}

                    {busStop.location?.countrySinhala ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          රට (Country)
                        </label>
                        <CopyableField 
                          value={busStop.location.countrySinhala} 
                          field="countrySinhala"
                          className="text-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">No country available</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tamil Tab Content */}
              {activeLanguageTab === 'tamil' && (
                <div className="space-y-4">
                  {busStop.location?.addressTamil ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        முகவரி (Address)
                      </label>
                      <CopyableField 
                        value={busStop.location.addressTamil} 
                        field="addressTamil"
                        className="text-gray-900"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">No Tamil address available</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busStop.location?.cityTamil ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          நகரம் (City)
                        </label>
                        <CopyableField 
                          value={busStop.location.cityTamil} 
                          field="cityTamil"
                          className="text-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">No city available</div>
                    )}

                    {busStop.location?.stateTamil ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          மாநிலம் (State/Province)
                        </label>
                        <CopyableField 
                          value={busStop.location.stateTamil} 
                          field="stateTamil"
                          className="text-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">No state available</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {busStop.location?.zipCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          அஞ்சல் குறியீடு (ZIP/Postal Code)
                        </label>
                        <CopyableField 
                          value={busStop.location.zipCode} 
                          field="zipCode-tamil"
                          className="text-gray-900"
                        />
                      </div>
                    )}

                    {busStop.location?.countryTamil ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          நாடு (Country)
                        </label>
                        <CopyableField 
                          value={busStop.location.countryTamil} 
                          field="countryTamil"
                          className="text-gray-900"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm">No country available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Map and Metadata */}
          <div className="space-y-6">
            {/* Location Map */}
            {hasCoordinates && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Navigation className="w-5 h-5 mr-2" />
                  Location Map
                </h3>
                <BusStopMiniMap
                  latitude={busStop.location!.latitude!}
                  longitude={busStop.location!.longitude!}
                  name={busStop.name || 'Bus Stop'}
                  address={busStop.location?.address}
                  onCopyCoordinates={copyToClipboard}
                />
                
                {/* Coordinates Display */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">
                      Coordinates
                    </label>
                    <button
                      onClick={openInMaps}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open in Maps
                    </button>
                  </div>
                  <CopyableField 
                    value={`${busStop.location!.latitude!.toFixed(6)}, ${busStop.location!.longitude!.toFixed(6)}`} 
                    field="map-coordinates"
                    className="text-xs font-mono text-gray-900 bg-gray-50 p-2 rounded"
                  />
                  <div className="text-xs text-gray-500">
                    Lat: {busStop.location!.latitude!.toFixed(6)} · Lng: {busStop.location!.longitude!.toFixed(6)}
                  </div>
                </div>
              </div>
            )}

            {/* System Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                System Information
              </h3>
              <div className="space-y-4 text-sm">
                {busStop.createdAt && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Created At
                    </label>
                    <p className="text-gray-600">{formatDate(busStop.createdAt)}</p>
                  </div>
                )}

                {busStop.createdBy && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Created By
                    </label>
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-1" />
                      {busStop.createdBy}
                    </div>
                  </div>
                )}

                {busStop.updatedAt && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-600">{formatDate(busStop.updatedAt)}</p>
                  </div>
                )}

                {busStop.updatedBy && (
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Updated By
                    </label>
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-1" />
                      {busStop.updatedBy}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteBusStopModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          busStop={busStop}
          isDeleting={isDeleting}
        />
      </div>
  );
}

export default function BusStopDetailsPage({ params }: BusStopDetailsPageProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
      <BusStopDetailsContent params={params} />
    </Suspense>
  );
}