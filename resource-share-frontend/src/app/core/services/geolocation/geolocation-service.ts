import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  userMessage: string;
}

export interface LocationMode {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  
  private readonly DEFAULT_LOCATION: LocationCoordinates = {
    latitude: -2.1709979,
    longitude: -79.9223592
  };

  private readonly staticMode: LocationMode = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000
  };

  private readonly dynamicMode: LocationMode = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  };

  private staticLocation: LocationCoordinates | null = null;
  private staticLocationTime: number = 0;
  private dynamicLocation: LocationCoordinates | null = null;
  private dynamicLocationTime: number = 0;

  private isInDynamicMode = false;

  constructor() {
    console.log('🌍 GeolocationService inicializado');
  }

  /**
   * Verifica el estado de los permisos de geolocalización
   * Retorna 'granted', 'denied', 'prompt' o 'unavailable'
   */
  checkPermissions(): Observable<PermissionState | 'unavailable'> {
    if (!this.isGeolocationAvailable()) {
      return of('unavailable' as const);
    }

    if (!('permissions' in navigator)) {
      return of('unavailable' as const);
    }

    return from(
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
    ).pipe(
      map(result => result.state),
      catchError(() => of('unavailable' as const))
    );
  }

  /**
   * Obtener ubicación estática (para búsqueda de recursos)
   * Cache de 5 minutos
   */
  getStaticLocation(): Observable<LocationCoordinates> {
    console.log('📍 Solicitando ubicación estática');

    if (this.hasValidStaticCache()) {
      console.log('⚡ Usando ubicación estática desde cache');
      return new Observable(observer => {
        observer.next(this.staticLocation!);
        observer.complete();
      });
    }

    return this.getCurrentLocation(this.staticMode).pipe(
      map((coordinates) => {
        this.staticLocation = coordinates;
        this.staticLocationTime = Date.now();
        console.log('💾 Ubicación estática guardada en cache (5 minutos)');
        return coordinates;
      })
    );
  }

  /**
   * Obtener ubicación dinámica (para tracking en tiempo real)
   * Cache de 5 segundos
   */
  getDynamicLocation(): Observable<LocationCoordinates> {
    console.log('🎯 Solicitando ubicación dinámica');

    if (this.hasValidDynamicCache()) {
      console.log('⚡ Usando ubicación dinámica desde cache');
      return new Observable(observer => {
        observer.next(this.dynamicLocation!);
        observer.complete();
      });
    }

    return this.getCurrentLocation(this.dynamicMode).pipe(
      map((coordinates) => {
        this.dynamicLocation = coordinates;
        this.dynamicLocationTime = Date.now();
        console.log('💾 Ubicación dinámica guardada en cache (5 segundos)');
        return coordinates;
      })
    );
  }

  /**
   * Forzar obtención de GPS fresco (sin cache)
   */
  getFreshLocation(mode: 'static' | 'dynamic' = 'static'): Observable<LocationCoordinates> {
    console.log(`🔄 Forzando GPS fresco (modo: ${mode})`);
    
    const locationMode = mode === 'static' ? this.staticMode : this.dynamicMode;
    
    return this.getCurrentLocation(locationMode).pipe(
      map((coordinates) => {
        if (mode === 'static') {
          this.staticLocation = coordinates;
          this.staticLocationTime = Date.now();
        } else {
          this.dynamicLocation = coordinates;
          this.dynamicLocationTime = Date.now();
        }
        console.log(`✅ GPS fresco obtenido y cache ${mode} actualizado`);
        return coordinates;
      })
    );
  }

  /**
   * Activar modo dinámico para tracking
   */
  enableDynamicMode(): void {
    console.log('🚀 Activando modo dinámico para tracking');
    this.isInDynamicMode = true;
  }

  /**
   * Desactivar modo dinámico (volver a modo estático)
   */
  disableDynamicMode(): void {
    console.log('🛑 Desactivando modo dinámico');
    this.isInDynamicMode = false;
    this.dynamicLocation = null;
    this.dynamicLocationTime = 0;
  }

  /**
   * Obtener ubicación basada en el modo activo
   */
  getCurrentActiveLocation(): Observable<LocationCoordinates> {
    return this.isInDynamicMode ? this.getDynamicLocation() : this.getStaticLocation();
  }

  /**
   * Obtener ubicación actual con opciones personalizadas
   */
  getCurrentLocation(options?: PositionOptions): Observable<LocationCoordinates> {
    console.log('📍 Solicitando ubicación actual');

    if (!this.isGeolocationAvailable()) {
      console.error('❌ Geolocalización no soportada');
      return throwError(() => this.createError(
        0, 
        'Geolocation not supported', 
        'Tu navegador no soporta geolocalización'
      ));
    }

    const finalOptions = options || this.staticMode;
    console.log('⚙️ Opciones GPS:', finalOptions);

    return from(new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Ubicación obtenida exitosamente');
          resolve(position);
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error);
          reject(error);
        },
        finalOptions
      );
    })).pipe(
      timeout(finalOptions.timeout! + 2000),
      
      map((position: GeolocationPosition) => {
        const coordinates: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        console.log(`📍 Coordenadas: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`);
        
        if (!this.isValidCoordinates(coordinates)) {
          throw new Error('Coordenadas inválidas recibidas');
        }
        
        return coordinates;
      }),
      
      catchError((error) => {
        console.error('💥 Error en obtención de ubicación:', error);
        return throwError(() => this.handleGeolocationError(error));
      })
    );
  }

  /**
   * Obtiene ubicación o retorna ubicación por defecto si falla
   */
  getCurrentLocationOrDefault(): Observable<LocationCoordinates> {
    return this.getStaticLocation().pipe(
      catchError(error => {
        console.warn('⚠️ Usando ubicación predeterminada (Guayaquil)');
        return of(this.DEFAULT_LOCATION);
      })
    );
  }

  /**
   * Observa cambios en la ubicación en tiempo real
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

      return () => {
        console.log('🛑 Deteniendo watchPosition');
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Limpiar cache de ubicaciones
   */
  clearCache(mode: 'static' | 'dynamic' | 'all' = 'all'): void {
    switch (mode) {
      case 'static':
        console.log('🧹 Limpiando cache estático');
        this.staticLocation = null;
        this.staticLocationTime = 0;
        break;
      case 'dynamic':
        console.log('🧹 Limpiando cache dinámico');
        this.dynamicLocation = null;
        this.dynamicLocationTime = 0;
        break;
      case 'all':
      default:
        console.log('🧹 Limpiando todos los caches');
        this.staticLocation = null;
        this.staticLocationTime = 0;
        this.dynamicLocation = null;
        this.dynamicLocationTime = 0;
        break;
    }
  }

  /**
   * Obtener última ubicación conocida
   */
  getLastKnownLocation(): LocationCoordinates | null {
    console.log('💾 Obteniendo última ubicación conocida');
    
    const staticAge = this.staticLocationTime;
    const dynamicAge = this.dynamicLocationTime;
    
    if (staticAge > dynamicAge && this.staticLocation) {
      return this.staticLocation;
    } else if (this.dynamicLocation) {
      return this.dynamicLocation;
    } else if (this.staticLocation) {
      return this.staticLocation;
    }
    
    return null;
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
    const R = 6371;
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
    
    return Math.round(distance * 100) / 100;
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
    const { latitude, longitude } = coords;
    
    return latitude !== null && 
           longitude !== null &&
           latitude >= -90 && 
           latitude <= 90 &&
           longitude >= -180 && 
           longitude <= 180 &&
           !(latitude === 0 && longitude === 0);
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
   * Verificar si hay cache estático válido
   */
  private hasValidStaticCache(): boolean {
    if (!this.staticLocation) return false;
    
    const age = Date.now() - this.staticLocationTime;
    const isValid = age < this.staticMode.maximumAge!;
    
    console.log(`📅 Cache estático: ${Math.round(age/1000)}s, válido: ${isValid}`);
    return isValid;
  }

  /**
   * Verificar si hay cache dinámico válido
   */
  private hasValidDynamicCache(): boolean {
    if (!this.dynamicLocation) return false;
    
    const age = Date.now() - this.dynamicLocationTime;
    const isValid = age < this.dynamicMode.maximumAge!;
    
    console.log(`📅 Cache dinámico: ${Math.round(age/1000)}s, válido: ${isValid}`);
    return isValid;
  }

  /**
   * Crear objeto de error personalizado
   */
  private createError(code: number, message: string, userMessage: string): GeolocationError {
    return { code, message, userMessage };
  }

  /**
   * Manejar errores de geolocalización
   */
  private handleGeolocationError(error: any): GeolocationError {
    if (error.code !== undefined) {
      switch (error.code) {
        case 1:
          return this.createError(
            1,
            'Permission denied',
            'Permiso de ubicación denegado. Por favor habilita el GPS en tu navegador.'
          );
        case 2:
          return this.createError(
            2,
            'Position unavailable',
            'No se pudo obtener tu ubicación. Verifica tu conexión GPS.'
          );
        case 3:
          return this.createError(
            3,
            'Timeout',
            'Tiempo de espera agotado. Intenta nuevamente.'
          );
        default:
          return this.createError(
            error.code,
            'Unknown error',
            'Error desconocido al obtener ubicación.'
          );
      }
    }
    
    return this.createError(
      0,
      error.message || 'Unknown error',
      'Error al obtener ubicación. Intenta nuevamente.'
    );
  }

  /**
   * Debug del estado completo del servicio
   */
  debugState(): void {
    console.log('\n🌍 === GEOLOCATION DEBUG ===');
    console.log('Estado del servicio:');
    console.log(`  Geolocation disponible: ${!!navigator.geolocation}`);
    console.log(`  Modo dinámico activo: ${this.isInDynamicMode}`);
    console.log(`  Ubicación estática:`, this.staticLocation);
    console.log(`  Cache estático válido: ${this.hasValidStaticCache()}`);
    console.log(`  Ubicación dinámica:`, this.dynamicLocation);
    console.log(`  Cache dinámico válido: ${this.hasValidDynamicCache()}`);
    console.log('🌍 === END DEBUG ===\n');
  }
}
