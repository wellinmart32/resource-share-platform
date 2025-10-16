import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { GeolocationService, LocationCoordinates } from '../../core/services/geolocation/geolocation-service';
import { MapService } from '../../core/services/map/map-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceCategory } from '../../core/enums/resource-category.enum';
import { ResourceStatus } from '../../core/enums/resource-status.enum';
import * as L from 'leaflet';

// Extiende el modelo Resource para incluir la distancia calculada
interface ResourceWithDistance extends Resource {
  distance?: number;
}

@Component({
  selector: 'app-browse-resources',
  templateUrl: './browse-resources.component.html',
  styleUrls: ['./browse-resources.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BrowseResourcesComponent implements OnInit, OnDestroy {

  // Listas de recursos
  allResources: ResourceWithDistance[] = [];
  filteredResources: ResourceWithDistance[] = [];
  
  // Estados de carga
  isLoading = true;
  isLoadingLocation = false;
  errorMessage = '';
  successMessage = '';

  // Filtros y ubicación
  selectedCategory: ResourceCategory | 'ALL' = 'ALL';
  userLocation: LocationCoordinates | null = null;
  
  // Variables del mapa
  map: L.Map | null = null;
  mapInitialized = false;

  // Categorías disponibles para filtrar
  categories: { value: ResourceCategory | 'ALL', label: string, icon: string }[] = [
    { value: 'ALL', label: 'Todas', icon: 'bi-grid' },
    { value: ResourceCategory.CLOTHING, label: 'Ropa', icon: 'bi-bag' },
    { value: ResourceCategory.FOOD, label: 'Alimentos', icon: 'bi-basket' },
    { value: ResourceCategory.TOOLS, label: 'Herramientas', icon: 'bi-wrench' },
    { value: ResourceCategory.TOYS, label: 'Juguetes', icon: 'bi-balloon' },
    { value: ResourceCategory.FURNITURE, label: 'Muebles', icon: 'bi-house' },
    { value: ResourceCategory.ELECTRONICS, label: 'Electrónicos', icon: 'bi-laptop' },
    { value: ResourceCategory.BOOKS, label: 'Libros', icon: 'bi-book' },
    { value: ResourceCategory.HYGIENE, label: 'Higiene', icon: 'bi-droplet' },
    { value: ResourceCategory.SCHOOL_SUPPLIES, label: 'Útiles', icon: 'bi-pencil' },
    { value: ResourceCategory.OTHERS, label: 'Otros', icon: 'bi-box' }
  ];

  constructor(
    private resourceService: ResourceService,
    private geolocationService: GeolocationService,
    private mapService: MapService,
    private router: Router
  ) {}

  ngOnInit() {
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.initMap();
      this.getCurrentLocation();
      this.loadResources();
    }, 100);
  }

  ngOnDestroy() {
    // Limpiar el mapa al destruir el componente
    if (this.map) {
      this.mapService.destroyMap('browse-resources-map');
    }
  }

  /**
   * Inicializa el mapa de Leaflet centrado en Guayaquil
   */
  initMap() {
    this.map = this.mapService.initMap({
      containerId: 'browse-resources-map',
      center: [-2.1709979, -79.9223592],
      zoom: 13
    });

    if (this.map) {
      this.mapInitialized = true;
    }
  }

  /**
   * Obtiene la ubicación actual del usuario mediante GPS
   * Actualiza el mapa con un marcador en la ubicación del usuario
   * Si falla, continúa sin mostrar error (la ubicación es opcional)
   */
  getCurrentLocation() {
    this.isLoadingLocation = true;

    this.geolocationService.getCurrentLocation().subscribe({
      next: (location: LocationCoordinates) => {
        console.log('✅ Ubicación obtenida:', location);
        this.userLocation = location;
        this.updateMapWithUserLocation(location);
        this.calculateDistances();
        this.isLoadingLocation = false;
      },
      error: (error: any) => {
        console.warn('⚠️ No se pudo obtener la ubicación del usuario:', error);
        this.isLoadingLocation = false;
        
        // No mostrar mensaje de error al usuario, la ubicación es opcional
        // El mapa seguirá funcionando con la vista por defecto
        console.info('ℹ️ El mapa continuará sin la ubicación del usuario');
      }
    });
  }

  /**
   * Actualiza el mapa con la ubicación del usuario
   * Agrega un marcador y centra el mapa en la ubicación
   */
  private updateMapWithUserLocation(location: LocationCoordinates) {
    if (!this.map) return;

    try {
      // Agregar marcador de ubicación del usuario (icono azul)
      this.mapService.addMarker('browse-resources-map', 'user-location', {
        coordinates: [location.latitude, location.longitude],
        title: 'Tu ubicación',
        popup: 'Estás aquí'
      });

      // Centrar el mapa en la ubicación del usuario
      this.mapService.centerMap('browse-resources-map', location, 14);
      
      console.log('✅ Marcador de usuario agregado al mapa');
    } catch (error) {
      console.error('Error agregando marcador de usuario:', error);
    }
  }

  /**
   * Carga los recursos disponibles desde el backend
   * Si hay error de conexión, carga datos de prueba
   */
  loadResources() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getAvailableResources().subscribe({
      next: (resources: Resource[]) => {
        this.allResources = resources;
        this.filteredResources = resources;
        this.calculateDistances();
        this.updateMapMarkers();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recursos:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          console.warn('⚠️ Backend no disponible, cargando datos de prueba');
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar los recursos';
        }
      }
    });
  }

  /**
   * Carga datos de prueba cuando no hay conexión al backend
   */
  private loadMockData() {
    this.allResources = [
      {
        id: 1,
        title: 'Ropa de Invierno',
        description: 'Chaquetas y abrigos en buen estado para adultos',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.AVAILABLE,
        donorId: 2,
        donorName: 'María López',
        latitude: -2.1850979,
        longitude: -79.9323592,
        address: 'Norte de Guayaquil',
        createdAt: new Date('2024-01-12')
      },
      {
        id: 2,
        title: 'Libros de Cocina',
        description: 'Colección de 5 libros de recetas internacionales',
        category: ResourceCategory.BOOKS,
        status: ResourceStatus.AVAILABLE,
        donorId: 3,
        donorName: 'Carlos Mendoza',
        latitude: -2.1609979,
        longitude: -79.9123592,
        address: 'Urdesa',
        createdAt: new Date('2024-01-11')
      },
      {
        id: 3,
        title: 'Juguetes Didácticos',
        description: 'Set completo de bloques de construcción para niños',
        category: ResourceCategory.TOYS,
        status: ResourceStatus.AVAILABLE,
        donorId: 4,
        donorName: 'Ana Pérez',
        latitude: -2.1750979,
        longitude: -79.9423592,
        address: 'Alborada',
        createdAt: new Date('2024-01-10')
      },
      {
        id: 4,
        title: 'Mesa de Comedor',
        description: 'Mesa de madera con 4 sillas en excelente estado',
        category: ResourceCategory.FURNITURE,
        status: ResourceStatus.AVAILABLE,
        donorId: 5,
        donorName: 'Luis Torres',
        latitude: -2.1550979,
        longitude: -79.9523592,
        address: 'Kennedy',
        createdAt: new Date('2024-01-09')
      },
      {
        id: 5,
        title: 'Útiles Escolares',
        description: 'Cuadernos, lápices, borradores y más',
        category: ResourceCategory.SCHOOL_SUPPLIES,
        status: ResourceStatus.AVAILABLE,
        donorId: 6,
        donorName: 'Patricia Silva',
        latitude: -2.1909979,
        longitude: -79.9223592,
        address: 'Centro',
        createdAt: new Date('2024-01-08')
      }
    ];
    
    this.filteredResources = this.allResources;
    this.calculateDistances();
    this.updateMapMarkers();
    this.isLoading = false;
    
    console.log('✅ Datos de prueba cargados');
  }

  /**
   * Calcula la distancia entre el usuario y cada recurso
   * Ordena los recursos por distancia (más cercano primero)
   * Solo funciona si se obtuvo la ubicación del usuario
   */
  private calculateDistances() {
    if (!this.userLocation) {
      console.info('ℹ️ No hay ubicación del usuario, no se calcularán distancias');
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
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    console.log('✅ Distancias calculadas y recursos ordenados');
  }

  /**
   * Actualiza los marcadores en el mapa con los recursos filtrados
   * Cada marcador muestra información del recurso en un popup
   */
  private updateMapMarkers() {
    if (!this.map) return;

    // Limpiar marcadores anteriores de recursos (no eliminar el marcador del usuario)
    this.filteredResources.forEach((_, index) => {
      this.mapService.removeMarker('browse-resources-map', `resource-${index}`);
    });

    // Agregar nuevos marcadores (iconos rojos para recursos)
    this.filteredResources.forEach((resource, index) => {
      const popupContent = `
        <div class="text-center">
          <strong>${resource.title}</strong><br>
          <small>${this.getCategoryLabel(resource.category)}</small><br>
          <small>Donante: ${resource.donorName}</small>
        </div>
      `;

      this.mapService.addMarker('browse-resources-map', `resource-${index}`, {
        coordinates: [resource.latitude, resource.longitude],
        title: resource.title,
        popup: popupContent
      });
    });
    
    console.log(`✅ ${this.filteredResources.length} marcadores de recursos agregados al mapa`);
  }

  /**
   * Filtra los recursos según la categoría seleccionada
   * Actualiza el mapa con los nuevos marcadores filtrados
   */
  filterByCategory(category: ResourceCategory | 'ALL') {
    this.selectedCategory = category;
    
    if (category === 'ALL') {
      this.filteredResources = this.allResources;
    } else {
      this.filteredResources = this.allResources.filter(r => r.category === category);
    }

    this.calculateDistances();
    this.updateMapMarkers();
  }

  /**
   * Muestra los detalles de un recurso en un alert
   * En producción, esto podría abrir un modal o página de detalles
   */
  viewResourceDetail(resource: Resource) {
    const distanceText = (resource as ResourceWithDistance).distance 
      ? `\nDistancia: ${(resource as ResourceWithDistance).distance!.toFixed(2)} km` 
      : '';
    
    alert(`Detalle del Recurso:\n\nTítulo: ${resource.title}\nCategoría: ${this.getCategoryLabel(resource.category)}\nDescripción: ${resource.description}\nDonante: ${resource.donorName}\nUbicación: ${resource.address || 'No especificada'}${distanceText}`);
  }

  /**
   * Reclama un recurso para el usuario actual
   * Envía la solicitud al backend y actualiza la lista
   */
  claimResource(resource: Resource, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Deseas reclamar "${resource.title}"?\n\nEl donante será notificado de tu solicitud.`)) {
      this.resourceService.claimResource(resource.id).subscribe({
        next: (response: any) => {
          this.successMessage = `Has reclamado "${resource.title}" exitosamente`;
          this.loadResources();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
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
   * Navega de regreso a la página principal
   */
  goBack() {
    this.router.navigate(['/home']);
  }

  /**
   * Obtiene el icono de Bootstrap Icons según la categoría
   */
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      CLOTHING: 'bi-bag',
      FOOD: 'bi-basket',
      TOOLS: 'bi-wrench',
      TOYS: 'bi-balloon',
      FURNITURE: 'bi-house',
      ELECTRONICS: 'bi-laptop',
      BOOKS: 'bi-book',
      HYGIENE: 'bi-droplet',
      SCHOOL_SUPPLIES: 'bi-pencil',
      OTHERS: 'bi-box'
    };
    return icons[category] || 'bi-box';
  }

  /**
   * Obtiene la etiqueta en español de la categoría
   */
  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      CLOTHING: 'Ropa',
      FOOD: 'Alimentos',
      TOOLS: 'Herramientas',
      TOYS: 'Juguetes',
      FURNITURE: 'Muebles',
      ELECTRONICS: 'Electrónicos',
      BOOKS: 'Libros',
      HYGIENE: 'Higiene',
      SCHOOL_SUPPLIES: 'Útiles Escolares',
      OTHERS: 'Otros'
    };
    return labels[category] || category;
  }
}
