import { useState, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';

interface Location {
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        });
      });
      const loc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(loc);
      return loc;
    } catch (err: any) {
      const message = 'Unable to get your location. Please enable location services.';
      setError(message);
      Alert.alert(
        'Location Error',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { location, isLoading, error, getCurrentLocation };
};
