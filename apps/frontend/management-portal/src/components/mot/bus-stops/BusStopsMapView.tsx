'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Locate,
  AlertTriangle,
} from 'lucide-react';
import type { StopResponse } from '../../../../generated/api-clients/route-management';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
// import { useGoogleMaps } from '@/hooks/useGoogleMaps';

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface BusStopsMapViewProps {
  busStops: StopResponse[];
  loading: boolean;
  onDelete?: (busStop: StopResponse) => void;
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const MARKER_COLORS = {
  accessible:    { fill: '#10B981', stroke: '#059669' },
  nonAccessible: { fill: '#EF4444', stroke: '#DC2626' },
  unknown:       { fill: '#6B7280', stroke: '#4B5563' },
} as const;

const DEFAULT_CENTER  = { lat: 7.8731, lng: 80.7718 }; // Sri Lanka
const DEFAULT_ZOOM    = 8;
const MAX_DETAIL_ZOOM = 14;

const LEGEND_ITEMS = [
  { color: '#10B981', label: 'Accessible' },
  { color: '#EF4444', label: 'Not Accessible' },
  { color: '#6B7280', label: 'Unknown' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Build a data-URI for a teardrop SVG pin marker */
function pinSvgUri(fill: string, stroke: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
          fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="5.5" fill="white" opacity="0.92"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Build an enlarged SVG pin for the active / selected marker */
function pinActiveSvgUri(fill: string, stroke: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 0C7.611 0 0 7.611 0 17c0 11.375 17 27 17 27S34 28.375 34 17C34 7.611 26.389 0 17 0z"
          fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <circle cx="17" cy="17" r="6.5" fill="white" opacity="0.92"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Collapse location fields into a single readable string */
function formatLocation(location: StopResponse['location']): string {
  if (!location) return 'No address';
  return [location.address, location.city, location.state].filter(Boolean).join(', ') || 'No address';
}

/** Build the HTML string rendered inside a Google Maps InfoWindow */
function buildInfoWindowContent(stop: StopResponse): string {
  const loc  = stop.location;
  const addr = formatLocation(loc);
  const lat  = loc?.latitude  != null ? Number(loc.latitude).toFixed(5)  : '—';
  const lng  = loc?.longitude != null ? Number(loc.longitude).toFixed(5) : '—';

  const badge =
    stop.isAccessible === true
      ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#15803d;
              padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;">✓&nbsp;Accessible</span>`
      : stop.isAccessible === false
      ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#fee2e2;color:#b91c1c;
              padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;">✗&nbsp;Not Accessible</span>`
      : `<span style="display:inline-flex;align-items:center;gap:4px;background:#f3f4f6;color:#6b7280;
              padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;">?&nbsp;Unknown</span>`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                min-width:220px;max-width:280px;padding:2px 2px 0;">
      <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 7px;line-height:1.35;">
        ${stop.name ?? 'Unnamed Stop'}
      </p>
      ${badge}
      <div style="margin:10px 0 4px;font-size:12px;color:#6b7280;line-height:1.55;">
        <div style="display:flex;gap:5px;align-items:flex-start;margin-bottom:2px;">
          <span style="margin-top:1px;">📍</span>
          <span>${addr}</span>
        </div>
        <div style="font-size:11px;color:#9ca3af;padding-left:20px;">${lat}, ${lng}</div>
      </div>
      <div style="height:1px;background:#f3f4f6;margin:10px 0;"></div>
      <div style="display:flex;gap:6px;">
        <button
          onclick="window.busStopMapActions?.viewDetails('${stop.id}')"
          style="flex:1;padding:7px 0;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;
                 border:1px solid #e5e7eb;background:#fff;color:#374151;"
          onmouseover="this.style.background='#f9fafb'"
          onmouseout="this.style.background='#fff'"
        >View Details</button>
        <button
          onclick="window.busStopMapActions?.editStop('${stop.id}')"
          style="flex:1;padding:7px 0;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
                 border:none;background:#2563eb;color:#fff;"
          onmouseover="this.style.background='#1d4ed8'"
          onmouseout="this.style.background='#2563eb'"
        >Edit</button>
      </div>
    </div>
  `;
}

/* ─── Global action bridge ───────────────────────────────────────────────── */

declare global {
  interface Window {
    google: typeof google;
    busStopMapActions?: {
      viewDetails: (id: string) => void;
      editStop:    (id: string) => void;
    };
  }
}

/* ─── Component ──────────────────────────────────────────────────────────── */

/** Return the marker icon config for a given stop and active state */
function buildMarkerIcon(
  stop: StopResponse,
  active: boolean,
): { url: string; scaledSize: google.maps.Size; anchor: google.maps.Point } {
  const cfg =
    stop.isAccessible === true
      ? MARKER_COLORS.accessible
      : stop.isAccessible === false
      ? MARKER_COLORS.nonAccessible
      : MARKER_COLORS.unknown;
  const uri    = active ? pinActiveSvgUri(cfg.fill, cfg.stroke) : pinSvgUri(cfg.fill, cfg.stroke);
  const [w, h] = active ? [34, 44] : [28, 36];
  return {
    url:        uri,
    scaledSize: new window.google.maps.Size(w, h),
    anchor:     new window.google.maps.Point(w / 2, h),
  };
}

export function BusStopsMapView({ busStops, loading, onDelete }: BusStopsMapViewProps) {
  const router = useRouter();

  /* refs */
  const mapRef          = useRef<HTMLDivElement>(null);
  const googleMapRef    = useRef<google.maps.Map | null>(null);
  const markersRef      = useRef<google.maps.Marker[]>([]);
  const infoWindowRef   = useRef<google.maps.InfoWindow | null>(null);
  const activeMarkerRef = useRef<google.maps.Marker | null>(null);

  /* Use centralized Google Maps loader */
  const { isLoaded, loadError } = useGoogleMaps();
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const mapError = loadError ? 'Google Maps failed to load. Check your API key.' : null;

  /* derived */
  const validBusStops = useMemo(
    () =>
      busStops.filter(
        (s) =>
          s.location?.latitude  != null &&
          s.location?.longitude != null &&
          !isNaN(Number(s.location.latitude)) &&
          !isNaN(Number(s.location.longitude)),
      ),
    [busStops],
  );

  const invalidCount = busStops.length - validBusStops.length;

  /* ── compute bounds ──────────────────────────────────────────────────────── */
  const getMapBounds = useCallback(() => {
    if (validBusStops.length === 0 || typeof window === 'undefined' || !window.google) return null;
    const bounds = new window.google.maps.LatLngBounds();
    validBusStops.forEach((s) => {
      bounds.extend(
        new window.google.maps.LatLng(
          Number(s.location!.latitude),
          Number(s.location!.longitude),
        ),
      );
    });
    return bounds;
  }, [validBusStops]);

  /* ── initialise Google Maps once ─────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoaded || isMapInitialized) return;

    const createMap = () => {
      if (!mapRef.current || !window.google) return;
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          styles: [
            { featureType: 'poi',     elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
          ],
          mapTypeControl:    false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl:       false,
          gestureHandling:  'greedy',
          clickableIcons:    false,
        });

        googleMapRef.current  = map;
        infoWindowRef.current = new window.google.maps.InfoWindow({ maxWidth: 300 });

        // Dismiss the popup when clicking blank map area
        map.addListener('click', () => {
          infoWindowRef.current?.close();
          if (activeMarkerRef.current) {
            const prevTitle = activeMarkerRef.current.getTitle();
            const prev = markersRef.current.find((m) => m.getTitle() === prevTitle);
            if (prev) {
              const prevStop = validBusStops.find((s) => s.name === prevTitle);
              if (prevStop) prev.setIcon(buildMarkerIcon(prevStop, false));
            }
            activeMarkerRef.current = null;
          }
        });

        setIsMapInitialized(true);
      } catch {
        console.error('Failed to create the map. Please refresh the page.');
      }
    };

    createMap();

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isMapInitialized]);

  /* ── refresh markers whenever the stops list changes ────────────────────── */
  useEffect(() => {
    if (!isMapInitialized || !googleMapRef.current || !window.google) return;

    // Close any open popup and reset active marker
    infoWindowRef.current?.close();
    activeMarkerRef.current = null;

    // Remove old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (validBusStops.length === 0) return;

    // Create markers
    const newMarkers = validBusStops.map((stop) => {
      const marker = new window.google.maps.Marker({
        position: {
          lat: Number(stop.location!.latitude),
          lng: Number(stop.location!.longitude),
        },
        map:       googleMapRef.current,
        title:     stop.name ?? 'Unnamed Stop',
        icon:      buildMarkerIcon(stop, false),
        optimized: false,
      });

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return;

        // Reset the previously active marker icon
        if (activeMarkerRef.current && activeMarkerRef.current !== marker) {
          const prevTitle = activeMarkerRef.current.getTitle();
          const prevStop  = validBusStops.find((s) => s.name === prevTitle);
          if (prevStop) activeMarkerRef.current.setIcon(buildMarkerIcon(prevStop, false));
        }

        // Elevate this marker visually
        marker.setIcon(buildMarkerIcon(stop, true));
        activeMarkerRef.current = marker;

        infoWindowRef.current.setContent(buildInfoWindowContent(stop));
        infoWindowRef.current.open(googleMapRef.current, marker);
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Fit the map to the current set of markers
    const bounds = getMapBounds();
    if (bounds && googleMapRef.current) {
      googleMapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
      window.google.maps.event.addListenerOnce(googleMapRef.current, 'bounds_changed', () => {
        const zoom = googleMapRef.current?.getZoom() ?? 0;
        if (zoom > MAX_DETAIL_ZOOM) googleMapRef.current!.setZoom(MAX_DETAIL_ZOOM);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapInitialized, validBusStops]);

  /* ── wire global action bridge (View Details / Edit popup buttons) ───────── */
  useEffect(() => {
    window.busStopMapActions = {
      viewDetails: (id) => router.push(`/mot/bus-stops/${id}`),
      editStop:    (id) => router.push(`/mot/bus-stops/${id}/edit`),
    };
    return () => { delete window.busStopMapActions; };
  }, [router]);

  /* ── map control handlers ──────────────────────────────────────────────── */
  const handleZoomIn  = () => {
    const z = googleMapRef.current?.getZoom() ?? DEFAULT_ZOOM;
    googleMapRef.current?.setZoom(z + 1);
  };
  const handleZoomOut = () => {
    const z = googleMapRef.current?.getZoom() ?? DEFAULT_ZOOM;
    googleMapRef.current?.setZoom(Math.max(z - 1, 1));
  };
  const handleResetView = useCallback(() => {
    if (!googleMapRef.current) return;
    const bounds = getMapBounds();
    if (bounds && validBusStops.length > 0) {
      googleMapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 80, left: 60 });
    } else {
      googleMapRef.current.setCenter(DEFAULT_CENTER);
      googleMapRef.current.setZoom(DEFAULT_ZOOM);
    }
  }, [getMapBounds, validBusStops.length]);

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      googleMapRef.current?.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      googleMapRef.current?.setZoom(13);
    });
  };

  const mapControls = [
    { icon: <ZoomIn  className="w-4 h-4" />, onClick: handleZoomIn,         title: 'Zoom in'       },
    { icon: <ZoomOut className="w-4 h-4" />, onClick: handleZoomOut,        title: 'Zoom out'      },
    { icon: <RotateCcw className="w-4 h-4" />, onClick: handleResetView,    title: 'Reset view'    },
    { icon: <Locate  className="w-4 h-4" />, onClick: handleFindMyLocation, title: 'My location'   },
  ];

  /* ── error state ─────────────────────────────────────────────────────────── */
  if (mapError) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Map Unavailable</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">{mapError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ── main render ─────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Map canvas ─────────────────────────────────────────────────── */}
      <div
        className="relative"
        style={{ height: 'calc(100vh - 400px)', minHeight: '480px', maxHeight: '700px' }}
      >
        {/* Google Maps mount point */}
        <div ref={mapRef} className="absolute inset-0" />

        {/* ── Top-left: live stop count badge ──────────────────────── */}
        {isMapInitialized && !loading && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5
                          bg-white/90 backdrop-blur-sm border border-gray-100
                          rounded-xl shadow-md px-3 py-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-700">
              {validBusStops.length} {validBusStops.length === 1 ? 'stop' : 'stops'}
            </span>
          </div>
        )}

        {/* ── Top-right: zoom / reset / locate ─────────────────────── */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
          {mapControls.map(({ icon, onClick, title }) => (
            <button
              key={title}
              onClick={onClick}
              title={title}
              className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-100
                         flex items-center justify-center text-gray-500
                         hover:text-gray-900 hover:bg-gray-50 hover:shadow-lg
                         active:scale-95 transition-all duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {icon}
            </button>
          ))}
        </div>

        {/* ── Bottom-left: colour legend ────────────────────────────── */}
        <div className="absolute bottom-4 left-4 z-10
                        bg-white/90 backdrop-blur-sm border border-gray-100
                        rounded-xl shadow-md px-3 py-2.5 pointer-events-none">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Accessibility
          </p>
          <div className="flex flex-col gap-1.5">
            {LEGEND_ITEMS.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Loading / initialising overlay ────────────────────────── */}
        {(loading || !isMapInitialized) && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px]
                          flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-blue-100 border-t-blue-600 animate-spin" />
            <p className="text-sm font-medium text-gray-500">
              {!isMapInitialized ? 'Loading map…' : 'Updating stops…'}
            </p>
          </div>
        )}

        {/* ── Empty state: stops exist but none have coords ─────────── */}
        {isMapInitialized && !loading && busStops.length > 0 && validBusStops.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-lg px-8 py-6 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No map coordinates</p>
              <p className="text-xs text-gray-400 mt-1">None of these stops have valid location data.</p>
            </div>
          </div>
        )}

        {/* ── Empty state: no stops on this page ───────────────────── */}
        {isMapInitialized && !loading && busStops.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-lg px-8 py-6 text-center">
              <p className="text-sm font-semibold text-gray-700">No stops on this page</p>
              <p className="text-xs text-gray-400 mt-1">Try a different page or adjust your filters.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Warning: stops with missing coordinates ─────────────────────── */}
      {invalidCount > 0 && (
        <div className="flex items-center gap-2.5 px-5 py-3 bg-amber-50 border-t border-amber-100">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            {invalidCount} {invalidCount === 1 ? 'stop has' : 'stops have'} missing or invalid
            coordinates and {invalidCount === 1 ? 'is' : 'are'} not shown on the map.
          </p>
        </div>
      )}
    </div>
  );
}