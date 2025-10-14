import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  imports: [CommonModule]
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
    setTimeout(() => {
      this.initMap();
      this.getCurrentLocation();
      this.loadResources();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.mapService.destroyMap('browse-resources-map');
    }
  }

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

  getCurrentLocation() {
    this.isLoadingLocation = true;

    this.geolocationService.getCurrentLocation().subscribe({
      next: (location) => {
        this.userLocation = location;
        this.updateMapWithUserLocation(location);
        this.isLoadingLocation = false;
      },
      error: (error) => {
        console.error('Error obteniendo ubicación:', error);
        this.isLoadingLocation = false;
      }
    });
  }

  private updateMapWithUserLocation(location: LocationCoordinates) {
    if (!this.map) return;

    this.mapService.addMarker('browse-resources-map', 'user-location', {
      coordinates: [location.latitude, location.longitude],
      title: 'Tu ubicación',
      popup: 'Estás aquí'
    });

    this.mapService.centerMap('browse-resources-map', location, 14);
  }

  loadResources() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getAvailableResources().subscribe({
      next: (resources) => {
        this.allResources = resources;
        this.filteredResources = resources;
        this.calculateDistances();
        this.updateMapMarkers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando recursos:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor';
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar los recursos';
        }
      }
    });
  }

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
  }

  private calculateDistances() {
    if (!this.userLocation) return;

    this.filteredResources = this.filteredResources.map(resource => ({
      ...resource,
      distance: this.geolocationService.calculateDistance(
        this.userLocation!.latitude,
        this.userLocation!.longitude,
        resource.latitude,
        resource.longitude
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  private updateMapMarkers() {
    if (!this.map) return;

    this.mapService.clearMarkers('browse-resources-map');

    if (this.userLocation) {
      this.mapService.addMarker('browse-resources-map', 'user-location', {
        coordinates: [this.userLocation.latitude, this.userLocation.longitude],
        title: 'Tu ubicación',
        popup: 'Estás aquí'
      });
    }

    this.filteredResources.forEach((resource, index) => {
      this.mapService.addMarker('browse-resources-map', `resource-${resource.id}`, {
        coordinates: [resource.latitude, resource.longitude],
        title: resource.title,
        popup: `
          <strong>${resource.title}</strong><br>
          ${resource.description}<br>
          <small>Donante: ${resource.donorName}</small>
        `
      });
    });

    this.mapService.fitBounds('browse-resources-map');
  }

  filterByCategory(category: ResourceCategory | 'ALL') {
    this.selectedCategory = category;

    if (category === 'ALL') {
      this.filteredResources = [...this.allResources];
    } else {
      this.filteredResources = this.allResources.filter(r => r.category === category);
    }

    this.calculateDistances();
    this.updateMapMarkers();
  }

  claimResource(resource: Resource, event: Event) {
    event.stopPropagation();

    if (confirm(`¿Deseas reclamar "${resource.title}"?\n\nAl reclamar este recurso, el donante será notificado y deberás coordinar la entrega.`)) {
      this.resourceService.claimResource(resource.id).subscribe({
        next: (response) => {
          this.successMessage = `Has reclamado "${resource.title}" exitosamente`;
          
          setTimeout(() => {
            this.router.navigate(['/receiver/my-received']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error reclamando recurso:', error);
          
          if (error.status === 0) {
            this.successMessage = `Recurso "${resource.title}" reclamado (modo demo)`;
            setTimeout(() => {
              this.router.navigate(['/receiver/my-received']);
            }, 2000);
          } else {
            this.errorMessage = 'Error al reclamar el recurso. Intenta de nuevo';
          }
        }
      });
    }
  }

  viewResourceDetail(resource: Resource) {
    const distanceText = (resource as any).distance 
      ? `\nDistancia: ${((resource as any).distance).toFixed(2)} km` 
      : '';
    
    alert(`${resource.title}\n\n${resource.description}\n\nDonante: ${resource.donorName}\nUbicación: ${resource.address}${distanceText}`);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

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

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDistance(distance: number | undefined): string {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }
}
