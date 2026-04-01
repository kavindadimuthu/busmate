'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapPin, Maximize2, RotateCcw } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

interface BusStopMiniMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
  onCopyCoordinates: (text: string, field: string) => void;
}

export default function BusStopMiniMap({
  latitude,
  longitude,
  name,
  address,
  onCopyCoordinates,
}: BusStopMiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const { isLoaded, loadError } = useGoogleMaps();

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

      googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);

      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: googleMapRef.current,
        title: name,
        icon: {
          url:
            'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
      });

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

      markerRef.current.addListener('click', () => {
        infoWindow.open(googleMapRef.current, markerRef.current);
      });

      setIsMapInitialized(true);
    } catch (error) {
      console.error('Error creating map:', error);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [isLoaded, latitude, longitude, name, address, isMapInitialized]);

  const resetMapView = useCallback(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: latitude, lng: longitude });
      googleMapRef.current.setZoom(16);
    }
  }, [latitude, longitude]);

  const openInFullMaps = useCallback(() => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&z=16`;
    window.open(url, '_blank');
  }, [latitude, longitude]);

  if (loadError) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <MapPin className="w-8 h-8 text-muted-foreground/70 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">Failed to load Google Maps</p>
        <button
          onClick={openInFullMaps}
          className="text-primary hover:text-primary text-sm underline"
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
        className="w-full h-64 rounded-lg bg-secondary"
        style={{ minHeight: '256px' }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {isMapInitialized && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={resetMapView}
            className="bg-card hover:bg-muted p-2 rounded-md shadow-md border border-border transition-colors"
            title="Reset view"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={openInFullMaps}
            className="bg-card hover:bg-muted p-2 rounded-md shadow-md border border-border transition-colors"
            title="Open in Google Maps"
          >
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
