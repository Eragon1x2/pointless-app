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
    if (!isSupported) return;

    // Функция обработки успеха
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

    // Функция обработки ошибок
    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = "An unknown error occurred.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Please enable location access in your settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location signal is weak or unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage = "GPS request timed out.";
          break;
      }
      setLocation(prev => ({ ...prev, error: errorMessage, loading: false }));
    };

    // ГЛАВНОЕ ИЗМЕНЕНИЕ: watchPosition вместо getCurrentPosition
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true, // Максимальная точность для игры
      timeout: 15000,           // Ждем ответ от GPS чуть дольше
      maximumAge: 0             // Не берем координаты из кэша
    });

    // Очистка при размонтировании компонента (важно для батареи!)
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return location;
};
