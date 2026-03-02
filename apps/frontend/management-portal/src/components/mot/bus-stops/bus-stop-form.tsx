'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  X,
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { StopRequest, StopResponse, LocationDto, BusStopManagementService } from '../../../../generated/api-clients/route-management';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface BusStopFormProps {
  busStopId?: string;
  onSuccess?: (busStop: StopResponse) => void;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  nameSinhala?: string;
  nameTamil?: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    addressSinhala?: string;
    citySinhala?: string;
    stateSinhala?: string;
    countrySinhala?: string;
    addressTamil?: string;
    cityTamil?: string;
    stateTamil?: string;
    countryTamil?: string;
  };
  isAccessible: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: string;
  general?: string;
}

// Google Maps Address Picker Component
const AddressPicker = ({
  onLocationSelect,
  initialLocation,
}: {
  onLocationSelect: (location: { address: string; lat: number; lng: number; city?: string; state?: string; country?: string; zipCode?: string }) => void;
  initialLocation?: { lat: number; lng: number; address?: string };
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // Use centralized Google Maps loader
  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize Google Maps when loaded
  useEffect(() => {
    if (!isLoaded || isMapInitialized) return;

    const initializeMap = () => {
      try {
        createMap();
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const createMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        const defaultLat = initialLocation?.lat || 6.9271; // Default to Colombo, Sri Lanka
        const defaultLng = initialLocation?.lng || 79.8612;

        const mapOptions: google.maps.MapOptions = {
          center: { lat: defaultLat, lng: defaultLng },
          zoom: initialLocation ? 16 : 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: true,
          zoomControl: true,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
        };

        googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);

        // Create marker
        markerRef.current = new google.maps.Marker({
          position: { lat: defaultLat, lng: defaultLng },
          map: googleMapRef.current,
          draggable: true,
          title: 'Bus Stop Location',
        });

        // Initialize autocomplete
        if (searchInputRef.current) {
          autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'LK' }, // Restrict to Sri Lanka
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current!.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              updateMapLocation(lat, lng, place.formatted_address || '');
              extractLocationDetails(place);
            }
          });
        }

        // Add click listener to map
        googleMapRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            updateMapLocation(lat, lng);
            reverseGeocode(lat, lng);
          }
        });

        // Add drag listener to marker
        markerRef.current.addListener('dragend', () => {
          if (markerRef.current) {
            const position = markerRef.current.getPosition();
            if (position) {
              const lat = position.lat();
              const lng = position.lng();
              reverseGeocode(lat, lng);
            }
          }
        });

        setIsMapInitialized(true);
      } catch (error) {
        console.error('Error creating map:', error);
      }
    };

    initializeMap();

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [isLoaded, initialLocation, isMapInitialized]);

  const updateMapLocation = useCallback((lat: number, lng: number, address?: string) => {
    if (googleMapRef.current && markerRef.current) {
      const position = { lat, lng };
      googleMapRef.current.setCenter(position);
      markerRef.current.setPosition(position);
      
      if (address) {
        onLocationSelect({ address, lat, lng });
      }
    }
  }, [onLocationSelect]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const locationData = {
          address: result.formatted_address || '',
          lat,
          lng,
          city: '',
          state: '',
          country: '',
          zipCode: '',
        };

        // Extract address components
        result.address_components?.forEach((component) => {
          const types = component.types;
          if (types.includes('locality')) {
            locationData.city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            locationData.state = component.long_name;
          } else if (types.includes('country')) {
            locationData.country = component.long_name;
          } else if (types.includes('postal_code')) {
            locationData.zipCode = component.long_name;
          }
        });

        onLocationSelect(locationData);
      } else {
        onLocationSelect({ address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng });
      }
    });
  }, [onLocationSelect]);

  const extractLocationDetails = useCallback((place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const locationData = {
      address: place.formatted_address || '',
      lat,
      lng,
      city: '',
      state: '',
      country: '',
      zipCode: '',
    };

    place.address_components?.forEach((component) => {
      const types = component.types;
      if (types.includes('locality')) {
        locationData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationData.state = component.long_name;
      } else if (types.includes('country')) {
        locationData.country = component.long_name;
      } else if (types.includes('postal_code')) {
        locationData.zipCode = component.long_name;
      }
    });

    onLocationSelect(locationData);
  }, [onLocationSelect]);

  const resetMapView = useCallback(() => {
    if (googleMapRef.current && initialLocation) {
      googleMapRef.current.setCenter({ lat: initialLocation.lat, lng: initialLocation.lng });
      googleMapRef.current.setZoom(16);
    }
  }, [initialLocation]);

  if (loadError) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">{loadError.message || 'Failed to load map'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for an address or place..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Map Container */}
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
        {isLoaded && initialLocation && (
          <div className="absolute top-2 right-2">
            <button
              onClick={resetMapView}
              className="bg-white hover:bg-gray-50 p-2 rounded-md shadow-md border border-gray-200 transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Click on the map or drag the marker to set the bus stop location. You can also search for an address above.
      </p>
    </div>
  );
};

export default function BusStopForm({ busStopId, onSuccess, onCancel }: BusStopFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    nameSinhala: undefined,
    nameTamil: undefined,
    description: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka',
      latitude: null,
      longitude: null,
      addressSinhala: undefined,
      citySinhala: undefined,
      stateSinhala: undefined,
      countrySinhala: undefined,
      addressTamil: undefined,
      cityTamil: undefined,
      stateTamil: undefined,
      countryTamil: undefined,
    },
    isAccessible: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!busStopId);
  const [isDirty, setIsDirty] = useState(false);

  const isEditMode = !!busStopId;

  // Load existing bus stop data
  useEffect(() => {
    if (busStopId) {
      loadExistingBusStop();
    }
  }, [busStopId]);

  const loadExistingBusStop = async () => {
    if (!busStopId) return;

    setInitialLoading(true);
    try {
      const busStop = await BusStopManagementService.getStopById(busStopId);
      if (busStop) {
        setFormData({
          name: busStop.name || '',
          nameSinhala: busStop.nameSinhala,
          nameTamil: busStop.nameTamil,
          description: busStop.description || '',
          location: {
            address: busStop.location?.address || '',
            city: busStop.location?.city || '',
            state: busStop.location?.state || '',
            zipCode: busStop.location?.zipCode || '',
            country: busStop.location?.country || 'Sri Lanka',
            latitude: busStop.location?.latitude || null,
            longitude: busStop.location?.longitude || null,
            addressSinhala: busStop.location?.addressSinhala,
            citySinhala: busStop.location?.citySinhala,
            stateSinhala: busStop.location?.stateSinhala,
            countrySinhala: busStop.location?.countrySinhala,
            addressTamil: busStop.location?.addressTamil,
            cityTamil: busStop.location?.cityTamil,
            stateTamil: busStop.location?.stateTamil,
            countryTamil: busStop.location?.countryTamil,
          },
          isAccessible: busStop.isAccessible || false,
        });
      }
    } catch (error) {
      console.error('Error loading bus stop:', error);
      setErrors({ general: 'Failed to load bus stop data' });
    } finally {
      setInitialLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setIsDirty(true);
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));

    if (field.startsWith('location.')) {
      const locationField = field.replace('location.', '');
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  }, []);

  // Handle location selection from map
  const handleLocationSelect = useCallback((location: {
    address: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }) => {
    setIsDirty(true);
    setErrors(prev => ({ ...prev, coordinates: undefined, address: undefined }));

    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: location.address,
        latitude: location.lat,
        longitude: location.lng,
        city: location.city || prev.location.city,
        state: location.state || prev.location.state,
        country: location.country || prev.location.country,
        zipCode: location.zipCode || prev.location.zipCode,
      },
    }));
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Bus stop name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Bus stop name must be at least 2 characters';
    }

    if (!formData.location.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.location.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.location.state.trim()) {
      newErrors.state = 'State/Province is required';
    }

    if (!formData.location.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (formData.location.latitude === null || formData.location.longitude === null) {
      newErrors.coordinates = 'Please select a location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const stopData: StopRequest = {
        name: formData.name.trim(),
        nameSinhala: formData.nameSinhala,
        nameTamil: formData.nameTamil,
        description: formData.description.trim() || undefined,
        location: {
          address: formData.location.address.trim(),
          city: formData.location.city.trim(),
          state: formData.location.state.trim(),
          zipCode: formData.location.zipCode.trim() || undefined,
          country: formData.location.country.trim(),
          latitude: formData.location.latitude!,
          longitude: formData.location.longitude!,
          addressSinhala: formData.location.addressSinhala?.trim() || undefined,
          citySinhala: formData.location.citySinhala?.trim() || undefined,
          stateSinhala: formData.location.stateSinhala?.trim() || undefined,
          countrySinhala: formData.location.countrySinhala?.trim() || undefined,
          addressTamil: formData.location.addressTamil?.trim() || undefined,
          cityTamil: formData.location.cityTamil?.trim() || undefined,
          stateTamil: formData.location.stateTamil?.trim() || undefined,
          countryTamil: formData.location.countryTamil?.trim() || undefined,
        },
        isAccessible: formData.isAccessible,
      };

      let result: StopResponse | undefined;

      if (isEditMode && busStopId) {
        result = await BusStopManagementService.updateStop(busStopId, stopData);
      } else {
        result = await BusStopManagementService.createStop(stopData);
      }

      if (result) {
        toast({
          title: isEditMode ? "Bus Stop Updated" : "Bus Stop Created",
          description: `${result.name} has been ${isEditMode ? 'updated' : 'created'} successfully.`,
        });
        if (onSuccess) {
          onSuccess(result);
        } else {
          router.push('/mot/bus-stops');
        }
      } else {
        setErrors({ general: `Failed to ${isEditMode ? 'update' : 'create'} bus stop` });
      }
    } catch (error: any) {
      const errorMessage = error?.message || `Failed to ${isEditMode ? 'update' : 'create'} bus stop`;
      setErrors({ general: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/mot/bus-stops');
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Alert */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bus Stop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter bus stop name"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bus stop description (optional)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAccessible}
                onChange={(e) => handleInputChange('isAccessible', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">This bus stop is wheelchair accessible</span>
            </label>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Location Information
        </h3>

        {/* Address Picker Map */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Location on Map <span className="text-red-500">*</span>
          </label>
          <AddressPicker
            onLocationSelect={handleLocationSelect}
            initialLocation={
              formData.location.latitude && formData.location.longitude
                ? {
                    lat: formData.location.latitude,
                    lng: formData.location.longitude,
                    address: formData.location.address,
                  }
                : undefined
            }
          />
          {errors.coordinates && (
            <p className="text-red-600 text-sm mt-1">{errors.coordinates}</p>
          )}
        </div>

        {/* Address Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location.address}
              onChange={(e) => handleInputChange('location.address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter street address"
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location.city}
              onChange={(e) => handleInputChange('location.city', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter city"
            />
            {errors.city && (
              <p className="text-red-600 text-sm mt-1">{errors.city}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State/Province <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location.state}
              onChange={(e) => handleInputChange('location.state', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.state ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter state or province"
            />
            {errors.state && (
              <p className="text-red-600 text-sm mt-1">{errors.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP/Postal Code
            </label>
            <input
              type="text"
              value={formData.location.zipCode}
              onChange={(e) => handleInputChange('location.zipCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter ZIP or postal code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location.country}
              onChange={(e) => handleInputChange('location.country', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.country ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter country"
            />
            {errors.country && (
              <p className="text-red-600 text-sm mt-1">{errors.country}</p>
            )}
          </div>
        </div>

        {/* Coordinates Display */}
        {formData.location.latitude && formData.location.longitude && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Coordinates</h4>
                <p className="text-sm text-gray-600 font-mono">
                  {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>
        )}
      </div>

      {/* Multi-Language Location Information - Sinhala */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">සිංහල ස්ථාන තොරතුරු (Sinhala Location Information)</h3>
        <p className="text-sm text-gray-600 mb-4">Optional: Provide location information in Sinhala</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ලිපිනය (Address in Sinhala)
            </label>
            <input
              type="text"
              value={formData.location.addressSinhala || ''}
              onChange={(e) => handleInputChange('location.addressSinhala', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="සිංහලෙන් ලිපිනය ඇතුළත් කරන්න"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              නගරය (City in Sinhala)
            </label>
            <input
              type="text"
              value={formData.location.citySinhala || ''}
              onChange={(e) => handleInputChange('location.citySinhala', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="සිංහලෙන් නගරය ඇතුළත් කරන්න"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              පළාත (State/Province in Sinhala)
            </label>
            <input
              type="text"
              value={formData.location.stateSinhala || ''}
              onChange={(e) => handleInputChange('location.stateSinhala', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="සිංහලෙන් පළාත ඇතුළත් කරන්න"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              රට (Country in Sinhala)
            </label>
            <input
              type="text"
              value={formData.location.countrySinhala || ''}
              onChange={(e) => handleInputChange('location.countrySinhala', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="සිංහලෙන් රට ඇතුළත් කරන්න"
            />
          </div>
        </div>
      </div>

      {/* Multi-Language Location Information - Tamil */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">தமிழ் இடம் தகவல் (Tamil Location Information)</h3>
        <p className="text-sm text-gray-600 mb-4">Optional: Provide location information in Tamil</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              முகவரி (Address in Tamil)
            </label>
            <input
              type="text"
              value={formData.location.addressTamil || ''}
              onChange={(e) => handleInputChange('location.addressTamil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="தமிழில் முகவரியை உள்ளிடவும்"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              நகரம் (City in Tamil)
            </label>
            <input
              type="text"
              value={formData.location.cityTamil || ''}
              onChange={(e) => handleInputChange('location.cityTamil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="தமிழில் நகரத்தை உள்ளிடவும்"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              மாநிலம் (State/Province in Tamil)
            </label>
            <input
              type="text"
              value={formData.location.stateTamil || ''}
              onChange={(e) => handleInputChange('location.stateTamil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="தமிழில் மாநிலத்தை உள்ளிடவும்"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              நாடு (Country in Tamil)
            </label>
            <input
              type="text"
              value={formData.location.countryTamil || ''}
              onChange={(e) => handleInputChange('location.countryTamil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="தமிழில் நாட்டை உள்ளிடவும்"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditMode ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? 'Update Bus Stop' : 'Create Bus Stop'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}