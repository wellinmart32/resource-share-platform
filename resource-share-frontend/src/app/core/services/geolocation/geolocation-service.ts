import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

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

  constructor() {
    console.log('🌍 GeolocationService inicializado');
  }

  /**
   * Obtiene la ubicación actual del usuario usando la Geolocation API
   * Intenta primero con alta precisión, si falla intenta con baja precisión
   */
  getCurrentLocation(): Observable<LocationCoordinates> {
    if (!this.isGeolocationAvailable()) {
      console.error('❌ Geolocation no disponible en este navegador');
      return throwError(() => new Error('Geolocation no soportado'));
    }

    // Primero intenta con alta precisión
    return this.tryGetLocation(true).pipe(
      catchError(error => {
        console.warn('⚠️ Alta precisión falló, intentando con baja precisión');
        // Si falla, intenta con baja precisión
        return this.tryGetLocation(false);
      })
    );
  }

  /**
   * Intenta obtener la ubicación con configuración específica
   */
  private tryGetLocation(highAccuracy: boolean): Observable<LocationCoordinates> {
    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: highAccuracy ? 15000 : 10000,
      maximumAge: highAccuracy ? 0 : 30000
    };

    console.log(`📍 Intentando obtener ubicación (Alta precisión: ${highAccuracy})`);

    const timeoutMs = options.timeout || 10000;

    return from(
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Ubicación obtenida:', {
              lat: position.coords.latitude.toFixed(6),
              lng: position.coords.longitude.toFixed(6),
              accuracy: Math.round(position.coords.accuracy) + 'm'
            });
            resolve(position);
          },
          (error) => {
            console.error('❌ Error de geolocalización:', {
              code: error.code,
              message: this.getErrorMessage(error.code)
            });
            reject(error);
          },
          options
        );
      })
    ).pipe(
      timeout(timeoutMs + 1000),
      map(position => ({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      })),
      catchError(error => {
        console.error('Error en tryGetLocation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene ubicación o retorna ubicación por defecto si falla
   * Útil cuando la ubicación es opcional
   */
  getCurrentLocationOrDefault(): Observable<LocationCoordinates> {
    return this.getCurrentLocation().pipe(
      catchError(error => {
        console.warn('⚠️ Usando ubicación predeterminada (Guayaquil)');
        return of(this.DEFAULT_LOCATION);
      })
    );
  }

  /**
   * Observa cambios en la ubicación en tiempo real
   * Útil para tracking del usuario en movimiento
   */
  watchPosition(): Observable<LocationCoordinates> {
    if (!this.isGeolocationAvailable()) {
      return throwError(() => new Error('Geolocation no soportado'));
    }

    console.log('👀 Iniciando watchPosition para tracking en tiempo real');

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
          console.error('❌ Error en watchPosition:', error.message);
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
        console.log('🛑 Deteniendo watchPosition');
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
   * Obtiene ubicación predeterminada (Guayaquil)
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
   * threshold en kilómetros (por defecto 100 metros)
   */
  isNearLocation(
    userLocation: LocationCoordinates,
    targetLocation: LocationCoordinates,
    threshold: number = 0.1
  ): boolean {
    const distance = this.getDistanceBetween(userLocation, targetLocation);
    return distance <= threshold;
  }

  /**
   * Obtiene un mensaje de error legible según el código
   */
  private getErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'Permiso denegado por el usuario';
      case 2:
        return 'Posición no disponible';
      case 3:
        return 'Tiempo de espera agotado';
      default:
        return 'Error desconocido';
    }
  }
}
