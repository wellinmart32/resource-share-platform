import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceStatus } from '../../core/enums/resource-status.enum';
import { ResourceCategory } from '../../core/enums/resource-category.enum';

@Component({
  selector: 'app-my-donations',
  templateUrl: './my-donations.component.html',
  styleUrls: ['./my-donations.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MyDonationsComponent implements OnInit {

  // Listas de recursos
  allResources: Resource[] = [];
  filteredResources: Resource[] = [];
  
  // Estados de carga
  isLoading = true;
  errorMessage = '';

  // Filtro seleccionado
  selectedFilter: ResourceStatus | 'ALL' = 'ALL';
  
  // Configuración de filtros con contadores
  filters: { value: ResourceStatus | 'ALL', label: string, count: number, class: string }[] = [
    { value: 'ALL', label: 'Todas', count: 0, class: 'btn-outline-primary' },
    { value: ResourceStatus.AVAILABLE, label: 'Disponibles', count: 0, class: 'btn-outline-success' },
    { value: ResourceStatus.CLAIMED, label: 'Reclamadas', count: 0, class: 'btn-outline-warning' },
    { value: ResourceStatus.IN_TRANSIT, label: 'En Tránsito', count: 0, class: 'btn-outline-primary' },
    { value: ResourceStatus.DELIVERED, label: 'Entregadas', count: 0, class: 'btn-outline-info' }
  ];

  constructor(
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDonations();
  }

  /**
   * Carga las donaciones del usuario desde el backend
   * Si hay error de conexión, carga datos de prueba
   */
  loadDonations() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getMyDonorResources().subscribe({
      next: (resources: Resource[]) => {
        this.allResources = resources;
        this.filteredResources = resources;
        this.updateFilterCounts();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando donaciones:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor';
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar tus donaciones';
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
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1709979,
        longitude: -79.9223592,
        address: 'Norte de Guayaquil',
        createdAt: new Date('2024-01-12')
      },
      {
        id: 2,
        title: 'Juguetes Didácticos',
        description: 'Set completo de bloques de construcción',
        category: ResourceCategory.TOYS,
        status: ResourceStatus.CLAIMED,
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1609979,
        longitude: -79.9123592,
        address: 'Urdesa',
        receiverId: 3,
        receiverName: 'Ana Pérez',
        claimedAt: new Date('2024-01-11'),
        createdAt: new Date('2024-01-10')
      },
      {
        id: 3,
        title: 'Mesa de Comedor',
        description: 'Mesa de madera con 4 sillas',
        category: ResourceCategory.FURNITURE,
        status: ResourceStatus.IN_TRANSIT,
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1750979,
        longitude: -79.9423592,
        address: 'Kennedy',
        receiverId: 4,
        receiverName: 'Luis Torres',
        claimedAt: new Date('2024-01-10'),
        createdAt: new Date('2024-01-09')
      },
      {
        id: 4,
        title: 'Libros de Cocina',
        description: 'Colección de 5 libros de recetas',
        category: ResourceCategory.BOOKS,
        status: ResourceStatus.DELIVERED,
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1550979,
        longitude: -79.9523592,
        address: 'Alborada',
        receiverId: 5,
        receiverName: 'María González',
        claimedAt: new Date('2024-01-08'),
        deliveredAt: new Date('2024-01-10'),
        createdAt: new Date('2024-01-07')
      }
    ];
    
    this.filteredResources = this.allResources;
    this.updateFilterCounts();
    this.isLoading = false;
  }

  /**
   * Actualiza los contadores de cada filtro según el estado de los recursos
   */
  private updateFilterCounts() {
    this.filters[0].count = this.allResources.length;
    this.filters[1].count = this.allResources.filter(r => r.status === ResourceStatus.AVAILABLE).length;
    this.filters[2].count = this.allResources.filter(r => r.status === ResourceStatus.CLAIMED).length;
    this.filters[3].count = this.allResources.filter(r => r.status === ResourceStatus.IN_TRANSIT).length;
    this.filters[4].count = this.allResources.filter(r => r.status === ResourceStatus.DELIVERED).length;
  }

  /**
   * Filtra los recursos según el estado seleccionado
   */
  filterByStatus(status: ResourceStatus | 'ALL') {
    this.selectedFilter = status;
    
    if (status === 'ALL') {
      this.filteredResources = this.allResources;
    } else {
      this.filteredResources = this.allResources.filter(r => r.status === status);
    }
  }

  /**
   * Navega a la página para publicar un nuevo recurso
   */
  publishNewResource() {
    this.router.navigate(['/donor/publish-resource']);
  }

  /**
   * Navega de regreso a la página principal
   */
  goBack() {
    this.router.navigate(['/home']);
  }

  /**
   * Muestra los detalles de un recurso en un alert
   * En producción, esto podría abrir un modal o página de detalles
   */
  viewResourceDetail(resource: Resource) {
    const receiverInfo = resource.receiverName 
      ? `\nReclamado por: ${resource.receiverName}` 
      : '\nDisponible';
    
    const deliveryInfo = resource.deliveredAt 
      ? `\nEntregado: ${this.formatDate(resource.deliveredAt)}` 
      : '';
    
    alert(`Detalle de la Donación:\n\nTítulo: ${resource.title}\nCategoría: ${this.getCategoryLabel(resource.category)}\nEstado: ${this.getStatusText(resource.status)}\nDescripción: ${resource.description}\nUbicación: ${resource.address || 'No especificada'}${receiverInfo}${deliveryInfo}`);
  }

  /**
   * Cancela una donación que aún no ha sido reclamada
   * Envía la solicitud al backend y actualiza la lista
   */
  cancelResource(resource: Resource, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de cancelar la donación "${resource.title}"?\n\nEsta acción no se puede deshacer.`)) {
      console.log('Cancelando recurso:', resource.id);
      // TODO: Implementar llamada al backend cuando esté disponible
      alert('La funcionalidad de cancelar será implementada próximamente');
    }
  }

  /**
   * Verifica si un recurso puede ser cancelado
   * Solo se pueden cancelar recursos disponibles o reclamados
   */
  canCancelResource(resource: Resource): boolean {
    return resource.status === ResourceStatus.AVAILABLE || 
           resource.status === ResourceStatus.CLAIMED;
  }

  /**
   * Obtiene la clase CSS del badge según el estado del recurso
   */
  getStatusBadgeClass(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'bg-success';
      case ResourceStatus.CLAIMED:
        return 'bg-warning text-dark';
      case ResourceStatus.IN_TRANSIT:
        return 'bg-info';
      case ResourceStatus.DELIVERED:
        return 'bg-secondary';
      case ResourceStatus.CANCELLED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * Obtiene el texto en español para mostrar el estado del recurso
   */
  getStatusText(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'Disponible';
      case ResourceStatus.CLAIMED:
        return 'Reclamado';
      case ResourceStatus.IN_TRANSIT:
        return 'En Tránsito';
      case ResourceStatus.DELIVERED:
        return 'Entregado';
      case ResourceStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  }

  /**
   * Obtiene el icono de Bootstrap Icons según la categoría del recurso
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

  /**
   * Formatea una fecha en formato legible en español
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
