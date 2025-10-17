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

  allResources: ResourceWithDistance[] = [];
  filteredResources: ResourceWithDistance[] = [];
  
  isLoading = true;
  isLoadingLocation = false;
  errorMessage = '';
  successMessage = '';

  selectedCategory: ResourceCategory | 'ALL' = 'ALL';
  userLocation: LocationCoordinates | null = null;
  
  map: L.Map | null = null;
  mapInitialized = false;

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
   * Verifica permisos antes de solicitar ubicación
   * Si no hay permisos, muestra mensaje y redirige a home
   */
  getCurrentLocation() {
    this.isLoadingLocation = true;

    // Verificar si el navegador soporta Permissions API
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(result => {
          // Si los permisos están denegados, manejar el caso especial
          if (result.state === 'denied') {
            this.handlePermissionDenied();
            return;
          }
          // Si los permisos están granted o prompt, intentar obtener ubicación
          this.requestLocation();
        })
        .catch(() => {
          // Si falla la consulta de permisos, intentar de todas formas
          this.requestLocation();
        });
    } else {
      // Si el navegador no soporta Permissions API, intentar directamente
      this.requestLocation();
    }
  }

  /**
   * Solicita la ubicación usando el servicio de geolocalización
   * Usa getStaticLocation() para mejor compatibilidad con caché
   */
  private requestLocation() {
    this.geolocationService.getStaticLocation().subscribe({
      next: (location: LocationCoordinates) => {
        console.log('✅ Ubicación obtenida:', location);
        this.userLocation = location;
        this.updateMapWithUserLocation(location);
        this.calculateDistances();
        this.isLoadingLocation = false;
        this.successMessage = 'Ubicación detectada correctamente';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.warn('⚠️ No se pudo obtener la ubicación del usuario:', error);
        this.isLoadingLocation = false;
        
        // Si el error es por permisos denegados (code 1), manejar especialmente
        if (error.code === 1) {
          this.handlePermissionDenied();
        } else {
          // Para otros errores, continuar sin ubicación
          console.info('ℹ️ El mapa continuará sin la ubicación del usuario');
        }
      }
    });
  }

  /**
   * Maneja el caso cuando los permisos de ubicación son denegados
   * Muestra un mensaje al usuario y redirige a home después de 4 segundos
   */
  private handlePermissionDenied() {
    this.isLoadingLocation = false;
    this.errorMessage = 'No tienes permisos de ubicación habilitados. Por favor habilítalos en la configuración de tu navegador. Redirigiendo...';
    
    // Redirigir automáticamente después de 4 segundos
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 4000);
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
      
      console.log('✅ Mapa actualizado con ubicación del usuario');
    } catch (error) {
      console.error('Error actualizando mapa con ubicación:', error);
    }
  }

  /**
   * Carga los recursos disponibles desde el backend
   * Si no hay conexión, utiliza datos de prueba
   */
  loadResources() {
    this.isLoading = true;
    
    this.resourceService.getAvailableResources().subscribe({
      next: (resources: Resource[]) => {
        this.allResources = resources;
        this.filteredResources = this.allResources;
        this.calculateDistances();
        this.updateMapMarkers();
        this.isLoading = false;
        
        console.log(`✅ ${resources.length} recursos cargados desde el servidor`);
      },
      error: (error: any) => {
        console.error('Error cargando recursos:', error);
        
        if (error.status === 0) {
          console.warn('⚠️ Sin conexión al servidor, usando datos de prueba');
          this.loadMockData();
        } else {
          this.isLoading = false;
          this.errorMessage = 'Error al cargar los recursos. Intenta de nuevo.';
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
        description: 'Chaquetas, pantalones y bufandas en muy buen estado',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.AVAILABLE,
        donorId: 1,
        donorName: 'María García',
        latitude: -2.1709979,
        longitude: -79.9223592,
        address: 'Urdesa Central',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 2,
        title: 'Alimentos No Perecibles',
        description: 'Arroz, fideo, aceite y enlatados',
        category: ResourceCategory.FOOD,
        status: ResourceStatus.AVAILABLE,
        donorId: 2,
        donorName: 'Carlos Mendoza',
        latitude: -2.1609979,
        longitude: -79.9323592,
        address: 'Centenario',
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
    
    alert(
      `${resource.title}\n\n` +
      `Categoría: ${this.getCategoryLabel(resource.category)}\n` +
      `Descripción: ${resource.description}\n` +
      `Donante: ${resource.donorName}\n` +
      `Ubicación: ${resource.address}${distanceText}`
    );
  }

  /**
   * Permite al receptor reclamar un recurso
   * Envía la solicitud al backend y actualiza la lista
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
