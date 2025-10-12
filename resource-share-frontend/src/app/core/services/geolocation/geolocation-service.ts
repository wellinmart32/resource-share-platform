import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  
  // Ubicación predeterminada: Centro de Guayaquil, Ecuador
  private readonly DEFAULT_LOCATION: LocationCoordinates = {
    latitude: -2.1709979,
    longitude: -79.9223592
  };

  constructor() {}

  /**
   * Obtiene la ubicación actual del usuario usando la Geolocation API
   * Solicita permisos si es necesario
   */
  getCurrentLocation(): Observable<LocationCoordinates> {
    if (!this.isGeolocationAvailable()) {
      console.error('Geolocation no disponible en este navegador');
      return throwError(() => new Error('Geolocation no soportado'));
    }

    return from(
      new Promise<LocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: LocationCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            resolve(location);
          },
          (error) => {
            console.error('Error obteniendo ubicación:', error.message);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      })
    ).pipe(
      catchError(error => {
        console.error('Error en getCurrentLocation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene ubicación o retorna ubicación por defecto si falla
   */
  getCurrentLocationOrDefault(): Observable<LocationCoordinates> {
    return this.getCurrentLocation().pipe(
      catchError(() => {
        console.warn('Usando ubicación predeterminada');
        return from([this.DEFAULT_LOCATION]);
      })
    );
  }

  /**
   * Observa cambios en la ubicación en tiempo real
   * Útil para tracking del RECEIVER en camino
   */
  watchPosition(): Observable<LocationCoordinates> {
    if (!this.isGeolocationAvailable()) {
      return throwError(() => new Error('Geolocation no soportado'));
    }

    return new Observable(observer => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          observer.next(location);
        },
        (error) => {
          console.error('Error en watchPosition:', error.message);
          observer.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

      // Limpieza cuando se desuscribe
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula Haversine
   * Retorna distancia en kilómetros
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Calcula distancia entre dos coordenadas
   */
  getDistanceBetween(from: LocationCoordinates, to: LocationCoordinates): number {
    return this.calculateDistance(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude
    );
  }

  /**
   * Verifica si las coordenadas son válidas
   */
  isValidCoordinates(coords: LocationCoordinates): boolean {
    return (
      coords.latitude >= -90 &&
      coords.latitude <= 90 &&
      coords.longitude >= -180 &&
      coords.longitude <= 180
    );
  }

  /**
   * Verifica si Geolocation API está disponible
   */
  isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Obtiene ubicación predeterminada
   */
  getDefaultLocation(): LocationCoordinates {
    return { ...this.DEFAULT_LOCATION };
  }

  /**
   * Convierte grados a radianes
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Formatea coordenadas para mostrar (6 decimales)
   */
  formatCoordinates(coords: LocationCoordinates): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }

  /**
   * Verifica si el usuario está cerca de una ubicación
   * threshold en kilómetros
   */
  isNearLocation(
    userLocation: LocationCoordinates,
    targetLocation: LocationCoordinates,
    threshold: number = 0.1
  ): boolean {
    const distance = this.getDistanceBetween(userLocation, targetLocation);
    return distance <= threshold;
  }
}
