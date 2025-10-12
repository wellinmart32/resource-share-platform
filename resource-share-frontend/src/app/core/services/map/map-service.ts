import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { LocationCoordinates } from '../geolocation/geolocation-service';

export interface MapConfig {
  containerId: string;
  center?: [number, number];
  zoom?: number;
  zoomControl?: boolean;
}

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
  
  private maps = new Map<string, L.Map>();
  private markers = new Map<string, Map<string, L.Marker>>();
  private polylines = new Map<string, Map<string, L.Polyline>>();
  
  // Iconos personalizados para diferentes tipos de marcadores
  private readonly icons = {
    user: L.icon({
      iconUrl: 'assets/icons/marker-user.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    }),
    donor: L.icon({
      iconUrl: 'assets/icons/marker-donor.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    }),
    resource: L.icon({
      iconUrl: 'assets/icons/marker-resource.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })
  };

  constructor() {}

  initMap(config: MapConfig): L.Map | null {
    if (this.maps.has(config.containerId)) {
      console.warn(`Mapa ${config.containerId} ya existe`);
      return this.maps.get(config.containerId) || null;
    }

    try {
      const map = L.map(config.containerId, {
        zoomControl: config.zoomControl ?? true
      }).setView(
        config.center || [-2.1709979, -79.9223592],
        config.zoom || 13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

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

  getMap(mapId: string): L.Map | null {
    return this.maps.get(mapId) || null;
  }

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

  addMarker(mapId: string, markerId: string, config: MarkerConfig): L.Marker | null {
    const map = this.maps.get(mapId);
    if (!map) {
      console.error(`Mapa ${mapId} no encontrado`);
      return null;
    }

    const marker = L.marker(config.coordinates, {
      icon: config.icon || this.icons.resource,
      title: config.title,
      draggable: config.draggable || false
    }).addTo(map);

    if (config.popup) {
      marker.bindPopup(config.popup);
    }

    const mapMarkers = this.markers.get(mapId);
    mapMarkers?.set(markerId, marker);

    return marker;
  }

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

  clearMarkers(mapId: string): void {
    const mapMarkers = this.markers.get(mapId);
    if (mapMarkers) {
      mapMarkers.forEach(marker => marker.remove());
      mapMarkers.clear();
    }
  }

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

    const polyline = L.polyline(coordinates, {
      color: color,
      weight: 4,
      opacity: 0.7
    }).addTo(map);

    const mapPolylines = this.polylines.get(mapId);
    mapPolylines?.set(polylineId, polyline);

    return polyline;
  }

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

  centerMap(mapId: string, coordinates: LocationCoordinates, zoom?: number): void {
    const map = this.maps.get(mapId);
    if (map) {
      map.setView([coordinates.latitude, coordinates.longitude], zoom || map.getZoom());
    }
  }

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

  invalidateSize(mapId: string): void {
    const map = this.maps.get(mapId);
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  }

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
