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
    // Inicialización del formulario con validaciones
    this.resourceForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      category: [ResourceCategory.OTHERS, Validators.required],
      address: ['']
    });
  }

  ngOnInit() {
    // Pequeño delay para asegurar que el DOM esté listo antes de inicializar el mapa
    setTimeout(() => {
      this.initMap();
      this.getCurrentLocation();
    }, 100);
  }

  ngOnDestroy() {
    // Limpieza: destruir el mapa al salir del componente
    if (this.map) {
      this.mapService.destroyMap('publish-resource-map');
    }
  }

  /**
   * Inicializa el mapa de Leaflet en el contenedor especificado
   * Configura el centro en Guayaquil y habilita eventos de clic
   */
  initMap() {
    this.map = this.mapService.initMap({
      containerId: 'publish-resource-map',
      center: [-2.1709979, -79.9223592],
      zoom: 13
    });

    if (this.map) {
      this.mapInitialized = true;
      // Escuchar clics en el mapa para seleccionar ubicación
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e);
      });
    }
  }

  /**
   * Obtiene la ubicación actual del usuario usando el GPS del dispositivo
   * Verifica permisos antes de solicitar ubicación
   * Si no hay permisos, muestra mensaje y redirige a home
   */
  getCurrentLocation() {
    this.isLoadingLocation = true;
    this.errorMessage = '';

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
        console.log('✅ Ubicación del donante obtenida:', location);
        this.currentLocation = location;
        this.updateMapLocation(location);
        this.isLoadingLocation = false;
        this.successMessage = 'Ubicación detectada correctamente';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        console.error('Error obteniendo ubicación:', error);
        this.isLoadingLocation = false;
        
        // Si el error es por permisos denegados (code 1), manejar especialmente
        if (error.code === 1) {
          this.handlePermissionDenied();
        } else {
          // Para otros errores, mostrar mensaje pero permitir selección manual
          this.errorMessage = 'No se pudo obtener tu ubicación. Selecciona una ubicación en el mapa.';
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
   * Maneja el evento de clic en el mapa
   * Permite al usuario seleccionar manualmente la ubicación del recurso
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
   * Si ya existe un marcador, lo elimina y crea uno nuevo
   * El marcador es arrastrable para ajustar la ubicación con precisión
   */
  updateMapLocation(location: LocationCoordinates) {
    if (!this.map) return;

    // Eliminar marcador anterior si existe
    if (this.locationMarker) {
      this.mapService.removeMarker('publish-resource-map', 'location');
    }

    // Crear nuevo marcador en la ubicación seleccionada
    this.locationMarker = this.mapService.addMarker('publish-resource-map', 'location', {
      coordinates: [location.latitude, location.longitude],
      title: 'Ubicación del recurso',
      popup: 'Ubicación seleccionada',
      draggable: true
    });

    // Escuchar cuando el usuario arrastra el marcador
    if (this.locationMarker) {
      this.locationMarker.on('dragend', () => {
        const position = this.locationMarker!.getLatLng();
        this.currentLocation = {
          latitude: position.lat,
          longitude: position.lng
        };
      });
    }

    // Centrar el mapa en la nueva ubicación
    this.mapService.centerMap('publish-resource-map', location, 15);
  }

  /**
   * Procesa el envío del formulario y publica el recurso
   * Valida que todos los campos requeridos estén completos
   * Valida que se haya seleccionado una ubicación en el mapa
   */
  onSubmit() {
    // Validar formulario
    if (this.resourceForm.invalid) {
      this.markFormGroupTouched(this.resourceForm);
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    // Validar que se haya seleccionado ubicación
    if (!this.currentLocation) {
      this.errorMessage = 'Por favor selecciona una ubicación en el mapa';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preparar datos del recurso
    const resourceRequest: ResourceRequest = {
      title: this.resourceForm.value.title,
      description: this.resourceForm.value.description,
      category: this.resourceForm.value.category,
      latitude: this.currentLocation.latitude,
      longitude: this.currentLocation.longitude,
      address: this.resourceForm.value.address
    };

    // Enviar recurso al backend
    this.resourceService.publishResource(resourceRequest).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = 'Recurso publicado exitosamente';
        
        // Redirigir a "Mis Donaciones" después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/donor/my-donations']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error publicando recurso:', error);
        this.isLoading = false;
        
        // Manejo de errores según el código de respuesta
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Usando datos de prueba...';
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 2000);
        } else {
          this.errorMessage = 'Error al publicar el recurso. Intenta de nuevo.';
        }
      }
    });
  }

  /**
   * Marca todos los campos del formulario como tocados
   * Útil para mostrar errores de validación
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Verifica si un campo tiene un error específico
   */
  hasError(fieldName: string, errorName: string): boolean {
    const field = this.resourceForm.get(fieldName);
    return !!(field && field.errors && field.errors[errorName] && field.touched);
  }

  /**
   * Navega de regreso a la página anterior
   */
  goBack() {
    this.router.navigate(['/home']);
  }
}
