/**
 * Geolocation service adapter — wraps react-native-geolocation-service.
 * Implements IGeolocationService port.
 */
import Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import type { IGeolocationService } from '../../domain/ports';
import type { GeoLocation } from '../../domain/entities/InstallationReport';

export class GeolocationAdapter implements IGeolocationService {
  async requestPermission(): Promise<boolean> {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }

  getCurrentLocation(): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? undefined,
            altitude: position.coords.altitude ?? undefined,
            timestamp: new Date(position.timestamp),
          });
        },
        error => reject(new Error(`Geolocation error (${error.code}): ${error.message}`)),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }
}
