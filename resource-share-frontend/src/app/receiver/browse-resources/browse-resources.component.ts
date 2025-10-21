import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { MapService } from '../../core/services/map/map-service';
import { GeolocationService, LocationCoordinates } from '../../core/services/geolocation/geolocation-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceCategory } from '../../core/enums/resource-category.enum';

/**
 * Interfaz extendida de Resource para incluir la distancia calculada
 */
interface ResourceWithDistance extends Resource {
  distance?: number;
}

/**
 * Componente de navegación de recursos disponibles
 * Permite a los receptores ver recursos disponibles en un mapa
 * Incluye filtros por categoría y búsqueda
 */
@Component({
  selector: 'app-browse-resources',
  templateUrl: './browse-resources.component.html',
  styleUrls: ['./browse-resources.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class BrowseResourcesComponent implements OnInit, OnDestroy {

  resources: ResourceWithDistance[] = [];
  filteredResources: ResourceWithDistance[] = [];
  
  isLoading = true;
  isLoadingLocation = false;
  errorMessage = '';
  successMessage = '';
  
  searchTerm = '';
  selectedCategory: ResourceCategory | 'ALL' = 'ALL';
  
  userLocation: LocationCoordinates | null = null;

  categories = [
    { value: 'ALL' as const, label: 'Todas', icon: 'bi-grid' },
    { value: ResourceCategory.CLOTHING, label: 'Ropa', icon: 'bi-bag' },
    { value: ResourceCategory.FOOD, label: 'Alimentos', icon: 'bi-basket' },
    { value: ResourceCategory.TOOLS, label: 'Herramientas', icon: 'bi-wrench' },
    { value: ResourceCategory.TOYS, label: 'Juguetes', icon: 'bi-balloon' },
    { value: ResourceCategory.FURNITURE, label: 'Muebles', icon: 'bi-house' },
    { value: ResourceCategory.ELECTRONICS, label: 'Electrónicos', icon: 'bi-laptop' },
    { value: ResourceCategory.BOOKS, label: 'Libros', icon: 'bi-book' },
    { value: ResourceCategory.HYGIENE, label: 'Higiene', icon: 'bi-droplet' },
    { value: ResourceCategory.SCHOOL_SUPPLIES, label: 'Útiles Escolares', icon: 'bi-pencil' },
    { value: ResourceCategory.OTHERS, label: 'Otros', icon: 'bi-box' }
  ];

  constructor(
    private resourceService: ResourceService,
    private mapService: MapService,
    private geolocationService: GeolocationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initializeMap();
    this.loadResources();
    this.getUserLocation();
  }

  ngOnDestroy() {
    this.mapService.destroyMap('browse-resources-map');
  }

  /**
   * Inicializa el mapa de Leaflet
   * Centra el mapa en Guayaquil por defecto
   */
  initializeMap() {
    setTimeout(() => {
      this.mapService.initMap({
        containerId: 'browse-resources-map',
        center: [-2.1709979, -79.922359],
        zoom: 13
      });
    }, 100);
  }

  /**
   * Carga todos los recursos disponibles desde el backend
   * Si no hay conexión, carga datos de prueba
   */
  loadResources() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getAvailableResources().subscribe({
      next: (resources: Resource[]) => {
        this.resources = resources;
        this.filteredResources = resources;
        this.calculateDistances();
        this.updateMapMarkers();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recursos:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar los recursos. Intenta de nuevo';
        }
      }
    });
  }

  /**
   * Obtiene la ubicación actual del usuario
   * Calcula las distancias a los recursos si se obtiene exitosamente
   */
  getUserLocation() {
    this.isLoadingLocation = true;

    this.geolocationService.getCurrentLocation().subscribe({
      next: (position) => {
        this.userLocation = {
          latitude: position.latitude,
          longitude: position.longitude
        };
        
        this.mapService.addMarker(
          'browse-resources-map',
          'user-location',
          {
            coordinates: [position.latitude, position.longitude],
            title: 'Tu ubicación',
            popup: `Tu ubicación<br>Lat: ${position.latitude.toFixed(6)}<br>Lng: ${position.longitude.toFixed(6)}`
          }
        );
        
        this.calculateDistances();
        this.isLoadingLocation = false;
      },
      error: (error) => {
        console.warn('⚠️ No se pudo obtener la ubicación del usuario:', error);
        this.isLoadingLocation = false;
      }
    });
  }

  /**
   * Alias para getUserLocation() - usado por el botón en el HTML
   * Obtiene nuevamente la ubicación del usuario
   */
  getCurrentLocation() {
    this.getUserLocation();
  }

  /**
   * Centra el mapa en la ubicación actual del usuario
   * Muestra un mensaje si no se ha obtenido la ubicación
   */
  centerOnUserLocation() {
    if (this.userLocation) {
      this.mapService.centerMap(
        'browse-resources-map',
        this.userLocation,
        15
      );
    } else {
      this.errorMessage = 'No se pudo obtener tu ubicación';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }

  /**
   * Calcula las distancias de cada recurso respecto a la ubicación del usuario
   * Solo calcula si hay ubicación del usuario disponible
   */
  calculateDistances() {
    if (!this.userLocation) {
      console.log('ℹ️ No hay ubicación del usuario, no se calcularán distancias');
      return;
    }

    this.filteredResources = this.filteredResources.map(resource => ({
      ...resource,
      distance: this.geolocationService.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        resource.latitude,
        resource.longitude
      )
    }));

    this.filteredResources.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  /**
   * Actualiza los marcadores en el mapa según los recursos filtrados
   * Crea un marcador por cada recurso con su información
   */
  updateMapMarkers() {
    this.mapService.clearMarkers('browse-resources-map');
    
    this.filteredResources.forEach(resource => {
      const popupContent = `
        <div style="min-width: 200px;">
          <h6 style="margin: 0 0 8px 0; font-weight: bold;">${resource.title}</h6>
          <p style="margin: 4px 0; font-size: 0.9em;">
            <i class="${this.getCategoryIcon(resource.category)}"></i> 
            ${this.getCategoryLabel(resource.category)}
          </p>
          <p style="margin: 4px 0; font-size: 0.85em; color: #666;">
            ${resource.description}
          </p>
          <p style="margin: 4px 0; font-size: 0.85em;">
            <strong>Donante:</strong> ${resource.donorName}
          </p>
        </div>
      `;
      
      this.mapService.addMarker(
        'browse-resources-map',
        `resource-${resource.id}`,
        {
          coordinates: [resource.latitude, resource.longitude],
          popup: popupContent,
          title: resource.title
        }
      );
    });
    
    console.log(`✅ ${this.filteredResources.length} marcadores de recursos agregados al mapa`);
  }

  /**
   * Filtra los recursos por categoría seleccionada
   * Actualiza tanto la lista como los marcadores del mapa
   */
  filterByCategory(category: ResourceCategory | 'ALL') {
    this.selectedCategory = category;
    this.applyFilters();
  }

  /**
   * Filtra los recursos por término de búsqueda
   * Busca en título, descripción y nombre del donante
   */
  onSearchChange() {
    this.applyFilters();
  }

  /**
   * Aplica todos los filtros activos (categoría y búsqueda)
   * Recalcula distancias y actualiza el mapa
   */
  applyFilters() {
    let filtered = this.resources;

    if (this.selectedCategory !== 'ALL') {
      filtered = filtered.filter(r => r.category === this.selectedCategory);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.donorName.toLowerCase().includes(term)
      );
    }

    this.filteredResources = filtered;
    this.calculateDistances();
    this.updateMapMarkers();
  }

  /**
   * Limpia todos los filtros aplicados
   * Restaura la vista a todos los recursos disponibles
   */
  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'ALL';
    this.filteredResources = this.resources;
    this.calculateDistances();
    this.updateMapMarkers();
  }

  /**
   * Carga datos de prueba cuando no hay conexión al backend
   * Útil para desarrollo y testing sin backend
   */
  loadMockData() {
    this.resources = [
      {
        id: 1,
        title: 'Ropa de invierno',
        description: 'Chompas y abrigos en buen estado',
        category: ResourceCategory.CLOTHING,
        status: 'AVAILABLE' as any,
        donorId: 1,
        donorName: 'María García',
        latitude: -2.1894128,
        longitude: -79.8886926,
        address: 'Kennedy Norte',
        createdAt: new Date()
      }
    ];
    
    this.filteredResources = this.resources;
    this.calculateDistances();
    this.updateMapMarkers();
    this.isLoading = false;
  }

  /**
   * Centra el mapa en la ubicación de un recurso específico
   * Abre el popup del marcador automáticamente
   */
  viewOnMap(resource: Resource) {
    this.mapService.centerMap(
      'browse-resources-map',
      { latitude: resource.latitude, longitude: resource.longitude },
      16
    );
  }

  /**
   * Muestra los detalles de un recurso en un alert
   * En producción, esto podría abrir un modal o página de detalles
   */
  viewDetails(resource: Resource) {
    const distanceText = (resource as ResourceWithDistance).distance 
      ? `\nDistancia: ${(resource as ResourceWithDistance).distance!.toFixed(2)} km` 
      : '';
    
    alert(
      `${resource.title}\n\n` +
      `Categoría: ${this.getCategoryLabel(resource.category)}\n` +
      `Descripción: ${resource.description}\n` +
      `Donante: ${resource.donorName}\n` +
      `Ubicación: ${resource.address}${distanceText}`
    );
  }

  /**
   * Alias para viewDetails - usado en el HTML cuando se hace clic en una card
   */
  viewResourceDetail(resource: Resource) {
    this.viewDetails(resource);
  }

  /**
   * Permite al receptor reclamar un recurso
   * Envía la solicitud al backend y redirige a "Mis Recursos Reclamados"
   */
  claimResource(resource: Resource, event: Event) {
    event.stopPropagation();
    
    const confirmClaim = confirm(
      `¿Deseas reclamar "${resource.title}"?\n\n` +
      `Donante: ${resource.donorName}\n` +
      `Ubicación: ${resource.address}`
    );
    
    if (confirmClaim) {
      this.resourceService.claimResource(resource.id).subscribe({
        next: (response: any) => {
          this.successMessage = `Has reclamado "${resource.title}" exitosamente`;
          
          // Redirigir a "Mis Recursos Reclamados" después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/receiver/my-claims']);
          }, 2000);
        },
        error: (error: any) => {
          console.error('Error reclamando recurso:', error);
          
          if (error.status === 0) {
            this.successMessage = `Recurso reclamado (modo demo)`;
            this.filteredResources = this.filteredResources.filter(r => r.id !== resource.id);
            this.updateMapMarkers();
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = 'Error al reclamar el recurso. Intenta de nuevo';
          }
        }
      });
    }
  }

  /**
   * Obtiene la etiqueta legible de una categoría
   */
  getCategoryLabel(category: ResourceCategory): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : 'Otro';
  }

  /**
   * Obtiene el icono de una categoría
   */
  getCategoryIcon(category: ResourceCategory): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.icon : 'bi-box';
  }

  /**
   * Navega de regreso a la página principal
   */
  goBack() {
    this.router.navigate(['/home']);
  }
}
