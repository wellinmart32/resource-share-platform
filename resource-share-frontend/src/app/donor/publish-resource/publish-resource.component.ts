import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { GeolocationService, LocationCoordinates } from '../../core/services/geolocation/geolocation-service';
import { MapService } from '../../core/services/map/map-service';
import { ResourceRequest } from '../../core/models/resource/resource-request.model';
import { ResourceCategory } from '../../core/enums/resource-category.enum';
import * as L from 'leaflet';

@Component({
  selector: 'app-publish-resource',
  templateUrl: './publish-resource.component.html',
  styleUrls: ['./publish-resource.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class PublishResourceComponent implements OnInit, OnDestroy {

  resourceForm: FormGroup;
  isLoading = false;
  isLoadingLocation = false;
  errorMessage = '';
  successMessage = '';

  // Categorías disponibles con sus iconos
  categories = [
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

  // Variables para el mapa
  currentLocation: LocationCoordinates | null = null;
  map: L.Map | null = null;
  locationMarker: L.Marker | null = null;
  mapInitialized = false;

  constructor(
    private formBuilder: FormBuilder,
    private resourceService: ResourceService,
    private geolocationService: GeolocationService,
    private mapService: MapService,
    private router: Router
  ) {
    this.resourceForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: [ResourceCategory.OTHERS, Validators.required],
      address: ['']
    });
  }

  ngOnInit() {
    setTimeout(() => {
      this.initMap();
      this.getCurrentLocation();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.mapService.destroyMap('publish-resource-map');
    }
  }

  /**
   * Inicializa el mapa de Leaflet
   */
  initMap() {
    this.map = this.mapService.initMap({
      containerId: 'publish-resource-map',
      center: [-2.1709979, -79.9223592],
      zoom: 13
    });

    if (this.map) {
      this.mapInitialized = true;
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e);
      });
    }
  }

  /**
   * Obtiene la ubicación actual del usuario mediante GPS
   */
  getCurrentLocation() {
    this.isLoadingLocation = true;
    this.errorMessage = '';

    this.geolocationService.getCurrentLocation().subscribe({
      next: (location: LocationCoordinates) => {
        this.currentLocation = location;
        this.updateMapLocation(location);
        this.isLoadingLocation = false;
      },
      error: (error: any) => {
        console.error('Error obteniendo ubicación:', error);
        this.isLoadingLocation = false;
        this.errorMessage = 'No se pudo obtener tu ubicación. Selecciona una ubicación en el mapa.';
      }
    });
  }

  /**
   * Maneja el clic en el mapa para seleccionar ubicación manualmente
   */
  onMapClick(e: L.LeafletMouseEvent) {
    const location: LocationCoordinates = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng
    };
    
    this.currentLocation = location;
    this.updateMapLocation(location);
  }

  /**
   * Actualiza el marcador en el mapa con la ubicación seleccionada
   */
  updateMapLocation(location: LocationCoordinates) {
    if (!this.map) return;

    if (this.locationMarker) {
      this.mapService.removeMarker('publish-resource-map', 'location');
    }

    this.locationMarker = this.mapService.addMarker('publish-resource-map', 'location', {
      coordinates: [location.latitude, location.longitude],
      title: 'Ubicación del recurso',
      popup: 'Ubicación seleccionada',
      draggable: true
    });

    // Actualizar ubicación cuando el marcador se arrastra
    if (this.locationMarker) {
      this.locationMarker.on('dragend', () => {
        const position = this.locationMarker!.getLatLng();
        this.currentLocation = {
          latitude: position.lat,
          longitude: position.lng
        };
      });
    }

    this.mapService.centerMap('publish-resource-map', location, 15);
  }

  /**
   * Publica el recurso enviándolo al backend
   */
  onSubmit() {
    if (this.resourceForm.invalid) {
      this.markFormGroupTouched(this.resourceForm);
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    if (!this.currentLocation) {
      this.errorMessage = 'Por favor selecciona una ubicación en el mapa';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const resourceRequest: ResourceRequest = {
      title: this.resourceForm.value.title,
      description: this.resourceForm.value.description,
      category: this.resourceForm.value.category,
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      address: this.resourceForm.value.address
    };

    this.resourceService.publishResource(resourceRequest).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'Recurso publicado exitosamente';
        
        setTimeout(() => {
          this.router.navigate(['/donor/my-donations']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error publicando recurso:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Usando datos de prueba...';
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        } else {
          this.errorMessage = 'Error al publicar el recurso. Intenta de nuevo';
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.resourceForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  getFieldError(field: string): string {
    const control = this.resourceForm.get(field);
    if (!control?.errors || !control.touched) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  }
}
