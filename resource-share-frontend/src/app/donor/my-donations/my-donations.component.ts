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

  allResources: Resource[] = [];
  filteredResources: Resource[] = [];
  
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  selectedFilter: ResourceStatus | 'ALL' = 'ALL';
  
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
  ) {
    // Detectar si venimos de publicar un recurso
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { reload?: boolean; message?: string };
    
    if (state?.reload) {
      console.log('🔄 Detectado reload desde publicación de recurso');
      if (state.message) {
        this.successMessage = state.message;
        setTimeout(() => this.successMessage = '', 4000);
      }
    }
  }

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
        createdAt: new Date('2024-01-15')
      },
      {
        id: 2,
        title: 'Juguetes Educativos',
        description: 'Set de bloques y rompecabezas para niños de 3 a 7 años',
        category: ResourceCategory.TOYS,
        status: ResourceStatus.CLAIMED,
        donorId: 1,
        donorName: 'Usuario Actual',
        receiverName: 'Pedro González',
        latitude: -2.1609979,
        longitude: -79.9323592,
        address: 'Sur de Guayaquil',
        createdAt: new Date('2024-01-10'),
        claimedAt: new Date('2024-01-12')
      },
      {
        id: 3,
        title: 'Alimentos No Perecibles',
        description: 'Arroz, fideos, aceite y enlatados varios',
        category: ResourceCategory.FOOD,
        status: ResourceStatus.DELIVERED,
        donorId: 1,
        donorName: 'Usuario Actual',
        receiverName: 'María López',
        latitude: -2.1809979,
        longitude: -79.9123592,
        address: 'Centro de Guayaquil',
        createdAt: new Date('2024-01-05'),
        claimedAt: new Date('2024-01-06'),
        deliveredAt: new Date('2024-01-08')
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
    
    alert(
      `Detalle de la Donación:\n\n` +
      `Título: ${resource.title}\n` +
      `Categoría: ${this.getCategoryLabel(resource.category)}\n` +
      `Estado: ${this.getStatusText(resource.status)}\n` +
      `Descripción: ${resource.description}\n` +
      `Ubicación: ${resource.address || 'No especificada'}${receiverInfo}${deliveryInfo}`
    );
  }

  /**
   * Cancela una donación que aún no ha sido reclamada
   * Envía la solicitud al backend y actualiza la lista
   */
  cancelResource(resource: Resource, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de cancelar la donación "${resource.title}"?\n\nEsta acción no se puede deshacer.`)) {
      this.resourceService.cancelResource(resource.id).subscribe({
        next: (response: any) => {
          this.successMessage = `La donación "${resource.title}" ha sido cancelada exitosamente`;
          this.loadDonations();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: any) => {
          console.error('Error cancelando recurso:', error);
          
          if (error.status === 0) {
            this.successMessage = `Donación cancelada (modo demo)`;
            this.allResources = this.allResources.filter(r => r.id !== resource.id);
            this.filterByStatus(this.selectedFilter);
            this.updateFilterCounts();
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else if (error.status === 400) {
            this.errorMessage = error.error.message || 'No se puede cancelar este recurso';
          } else {
            this.errorMessage = 'Error al cancelar la donación. Intenta de nuevo';
          }
        }
      });
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
