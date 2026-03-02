"use client";

import { GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { useState, useCallback } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

const containerStyle = {
  width: '100vw',
  height: '100vh',
};

const galle = { lat: 6.0328, lng: 80.217 }; // Galle, Sri Lanka
const matara = { lat: 5.9485, lng: 80.5353 }; // Matara, Sri Lanka
const center = {
  lat: (galle.lat + matara.lat) / 2,
  lng: (galle.lng + matara.lng) / 2,
};


export default function GoogleMapComponent() {
  const { isLoaded } = useGoogleMaps();
  const [directions, setDirections] = useState(null);

  const directionsCallback = useCallback((result: any, status: string) => {
    if (status === 'OK') {
      setDirections(result);
    }
  }, []);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
      {/* Markers for Galle and Matara */}
      <Marker position={galle}  />
      <Marker position={matara} />

      {/* Directions Service and Renderer */}
      {!directions && (
        <DirectionsService
          options={{
            origin: galle,
            destination: matara,
            travelMode: google.maps.TravelMode.DRIVING,
          }}
          callback={directionsCallback}
        />
      )}
      {directions && (
        <DirectionsRenderer directions={directions} />
      )}
    </GoogleMap>
  );
}