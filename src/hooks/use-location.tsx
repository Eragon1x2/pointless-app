import { useState, useEffect } from 'react';

interface LocationState {
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  error: string | null;
  loading: boolean;
}

const isSupported = typeof navigator !== 'undefined' && "geolocation" in navigator;

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    coordinates: null,
    error: isSupported ? null : "Geolocation is not supported by your browser",
    loading: isSupported,
  });

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = error.message;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "You denied permission to access your location.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable (your browser/OS might not have location services enabled).";
          break;
        case error.TIMEOUT:
          errorMessage = "The request to get your location timed out.";
          break;
        default:
          errorMessage = error.message || "An unknown error occurred while getting location.";
      }

      setLocation({
        coordinates: null,
        error: errorMessage,
        loading: false,
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }, []);

  return location;
};
