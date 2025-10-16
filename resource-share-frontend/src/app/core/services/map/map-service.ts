import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { LocationCoordinates } from '../geolocation/geolocation-service';

// Configuración para inicializar un mapa
export interface MapConfig {
  containerId: string;
  center?: [number, number];
  zoom?: number;
  zoomControl?: boolean;
}

// Configuración para crear marcadores en el mapa
export interface MarkerConfig {
  coordinates: [number, number];
  title?: string;
  icon?: L.Icon;
  popup?: string;
  draggable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  
  // Colecciones para gestionar múltiples mapas y sus elementos
  private maps = new Map<string, L.Map>();
  private markers = new Map<string, Map<string, L.Marker>>();
  private polylines = new Map<string, Map<string, L.Polyline>>();
  
  // Iconos predeterminados de Leaflet con colores personalizados
  private readonly icons = {
    // Icono azul para el usuario
    user: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    // Icono verde para donantes
    donor: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    }),
    // Icono rojo para recursos
    resource: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  };

  constructor() {}

  /**
   * Inicializa un nuevo mapa de Leaflet en el contenedor especificado
   * Configura el tile layer de OpenStreetMap y los controles básicos
   */
  initMap(config: MapConfig): L.Map | null {
    // Verificar si el mapa ya existe
    if (this.maps.has(config.containerId)) {
      console.warn(`Mapa ${config.containerId} ya existe`);
      return this.maps.get(config.containerId) || null;
    }

    try {
      // Crear instancia del mapa
      const map = L.map(config.containerId, {
        zoomControl: config.zoomControl ?? true
      }).setView(
        config.center || [-2.1709979, -79.9223592], // Default: Guayaquil
        config.zoom || 13
      );

      // Agregar capa de tiles de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Registrar el mapa y sus colecciones
      this.maps.set(config.containerId, map);
      this.markers.set(config.containerId, new Map());
      this.polylines.set(config.containerId, new Map());

      console.log(`Mapa ${config.containerId} inicializado`);
      return map;
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      return null;
    }
  }

  /**
   * Obtiene la instancia de un mapa por su ID
   */
  getMap(mapId: string): L.Map | null {
    return this.maps.get(mapId) || null;
  }

  /**
   * Destruye un mapa y limpia todos sus recursos
   * Importante llamar este método en ngOnDestroy para evitar memory leaks
   */
  destroyMap(mapId: string): void {
    const map = this.maps.get(mapId);
    if (map) {
      map.remove();
      this.maps.delete(mapId);
      this.markers.delete(mapId);
      this.polylines.delete(mapId);
      console.log(`Mapa ${mapId} destruido`);
    }
  }

  /**
   * Agrega un marcador al mapa especificado
   * Soporta iconos personalizados, popups y marcadores arrastrables
   */
  addMarker(mapId: string, markerId: string, config: MarkerConfig): L.Marker | null {
    const map = this.maps.get(mapId);
    if (!map) {
      console.error(`Mapa ${mapId} no encontrado`);
      return null;
    }

    // Crear marcador con configuración (usa icono resource por defecto)
    const marker = L.marker(config.coordinates, {
      icon: config.icon || this.icons.resource,
      title: config.title,
      draggable: config.draggable || false
    }).addTo(map);

    // Agregar popup si existe
    if (config.popup) {
      marker.bindPopup(config.popup);
    }

    // Guardar referencia del marcador
    const mapMarkers = this.markers.get(mapId);
    mapMarkers?.set(markerId, marker);

    return marker;
  }

  /**
   * Actualiza la posición de un marcador existente
   */
  updateMarkerPosition(mapId: string, markerId: string, coordinates: LocationCoordinates): boolean {
    const mapMarkers = this.markers.get(mapId);
    if (!mapMarkers) {
      console.warn(`Mapa ${mapId} no encontrado`);
      return false;
    }

    const marker = mapMarkers.get(markerId);
    if (marker) {
      marker.setLatLng([coordinates.latitude, coordinates.longitude]);
      return true;
    }

    console.warn(`Marcador ${markerId} no encontrado`);
    return false;
  }

  /**
   * Elimina un marcador específico del mapa
   */
  removeMarker(mapId: string, markerId: string): boolean {
    const mapMarkers = this.markers.get(mapId);
    if (!mapMarkers) return false;

    const marker = mapMarkers.get(markerId);
    if (marker) {
      marker.remove();
      mapMarkers.delete(markerId);
      return true;
    }

    return false;
  }

  /**
   * Elimina todos los marcadores de un mapa
   */
  clearMarkers(mapId: string): void {
    const mapMarkers = this.markers.get(mapId);
    if (mapMarkers) {
      mapMarkers.forEach(marker => marker.remove());
      mapMarkers.clear();
    }
  }

  /**
   * Agrega una polilínea (línea) al mapa
   * Útil para mostrar rutas o conexiones entre puntos
   */
  addPolyline(
    mapId: string,
    polylineId: string,
    coordinates: [number, number][],
    color: string = '#3b82f6'
  ): L.Polyline | null {
    const map = this.maps.get(mapId);
    if (!map) {
      console.error(`Mapa ${mapId} no encontrado`);
      return null;
    }

    // Crear polilínea con estilo
    const polyline = L.polyline(coordinates, {
      color: color,
      weight: 4,
      opacity: 0.7
    }).addTo(map);

    // Guardar referencia
    const mapPolylines = this.polylines.get(mapId);
    mapPolylines?.set(polylineId, polyline);

    return polyline;
  }

  /**
   * Elimina una polilínea específica del mapa
   */
  removePolyline(mapId: string, polylineId: string): boolean {
    const mapPolylines = this.polylines.get(mapId);
    if (!mapPolylines) return false;

    const polyline = mapPolylines.get(polylineId);
    if (polyline) {
      polyline.remove();
      mapPolylines.delete(polylineId);
      return true;
    }

    return false;
  }

  /**
   * Centra el mapa en una ubicación específica
   * Opcionalmente ajusta el nivel de zoom
   */
  centerMap(mapId: string, coordinates: LocationCoordinates, zoom?: number): void {
    const map = this.maps.get(mapId);
    if (map) {
      map.setView([coordinates.latitude, coordinates.longitude], zoom || map.getZoom());
    }
  }

  /**
   * Ajusta el mapa para mostrar todos los marcadores
   * Útil cuando hay múltiples puntos de interés
   */
  fitBounds(mapId: string): void {
    const map = this.maps.get(mapId);
    const mapMarkers = this.markers.get(mapId);

    if (map && mapMarkers && mapMarkers.size > 0) {
      const bounds = L.latLngBounds([]);
      mapMarkers.forEach(marker => {
        bounds.extend(marker.getLatLng());
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Agrega múltiples marcadores de recursos al mapa
   * Automáticamente ajusta el zoom para mostrar todos
   */
  addResourceMarkers(mapId: string, resources: any[]): void {
    resources.forEach(resource => {
      this.addMarker(mapId, `resource-${resource.id}`, {
        coordinates: [resource.latitude, resource.longitude],
        icon: this.icons.resource,
        popup: `
          <strong>${resource.title}</strong><br>
          ${resource.description}<br>
          <small>Categoría: ${resource.category}</small>
        `,
        title: resource.title
      });
    });

    this.fitBounds(mapId);
  }

  /**
   * Dibuja una ruta entre dos ubicaciones
   * Útil para mostrar la dirección desde el usuario hasta el recurso
   */
  drawRoute(
    mapId: string,
    from: LocationCoordinates,
    to: LocationCoordinates,
    color: string = '#10b981'
  ): void {
    this.addPolyline(
      mapId,
      'route',
      [
        [from.latitude, from.longitude],
        [to.latitude, to.longitude]
      ],
      color
    );
  }

  /**
   * Invalida y recalcula el tamaño del mapa
   * Necesario después de cambios en el contenedor (resize, show/hide)
   */
  invalidateSize(mapId: string): void {
    const map = this.maps.get(mapId);
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  }

  /**
   * Obtiene los límites geográficos actuales del mapa visible
   */
  getMapBounds(mapId: string): { north: number; south: number; east: number; west: number } | null {
    const map = this.maps.get(mapId);
    if (map) {
      const bounds = map.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      };
    }
    return null;
  }
}
