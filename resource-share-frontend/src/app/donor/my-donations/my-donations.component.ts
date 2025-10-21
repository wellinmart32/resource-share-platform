import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { Resource } from 'src/app/core/models/resource/resource.model';
import { ResourceStatus } from 'src/app/core/enums/resource-status.enum';
import { ResourceCategory } from 'src/app/core/enums/resource-category.enum';

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
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { reload?: boolean; message?: string };
    
    if (state?.reload) {
      console.log('🔄 Detectado reload desde publicación');
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
   * Carga las donaciones del usuario
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
   * Carga datos de prueba
   */
  private loadMockData() {
    this.allResources = [
      {
        id: 1,
        title: 'Ropa de Invierno',
        description: 'Chaquetas y abrigos en buen estado',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.AVAILABLE,
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1709979,
        longitude: -79.9223592,
        address: 'Norte de Guayaquil',
        autoConfirm: false,
        createdAt: new Date('2024-01-15')
      }
    ];
    
    this.filteredResources = this.allResources;
    this.updateFilterCounts();
    this.isLoading = false;
  }

  /**
   * Actualiza contadores
   */
  private updateFilterCounts() {
    this.filters[0].count = this.allResources.length;
    this.filters[1].count = this.allResources.filter(r => r.status === ResourceStatus.AVAILABLE).length;
    this.filters[2].count = this.allResources.filter(r => r.status === ResourceStatus.CLAIMED).length;
    this.filters[3].count = this.allResources.filter(r => r.status === ResourceStatus.IN_TRANSIT).length;
    this.filters[4].count = this.allResources.filter(r => r.status === ResourceStatus.DELIVERED).length;
  }

  /**
   * Filtra por estado
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
   * Cambia el modo de confirmación del recurso
   */
  toggleAutoConfirm(resource: Resource, event: Event) {
    event.stopPropagation();
    
    const newMode = !resource.autoConfirm ? 'Automático' : 'Manual';
    const confirmAction = confirm(
      `¿Cambiar a modo ${newMode}?\n\n` +
      `Recurso: "${resource.title}"\n\n` +
      (newMode === 'Automático' 
        ? 'El recurso pasará directamente a "En Tránsito" cuando sea reclamado.' 
        : 'Deberás confirmar manualmente cuando alguien reclame el recurso.')
    );
    
    if (confirmAction) {
      this.resourceService.toggleAutoConfirm(resource.id).subscribe({
        next: (response: any) => {
          resource.autoConfirm = !resource.autoConfirm;
          this.successMessage = `Modo cambiado a ${newMode}`;
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: any) => {
          console.error('Error cambiando modo:', error);
          
          if (error.status === 0) {
            resource.autoConfirm = !resource.autoConfirm;
            this.successMessage = `Modo cambiado a ${newMode} (demo)`;
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = error.error?.message || 'Error al cambiar el modo';
            
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }
        }
      });
    }
  }

  /**
   * Navega a publicar recurso
   */
  publishNewResource() {
    this.router.navigate(['/donor/publish-resource']);
  }

  /**
   * Navega de regreso
   */
  goBack() {
    this.router.navigate(['/home']);
  }

  /**
   * Muestra detalles del recurso
   */
  viewResourceDetail(resource: Resource) {
    const receiverInfo = resource.receiverName 
      ? `\nReclamado por: ${resource.receiverName}` 
      : '\nDisponible';
    
    const deliveryInfo = resource.deliveredAt 
      ? `\nEntregado: ${this.formatDate(resource.deliveredAt)}` 
      : '';
    
    const autoConfirmInfo = `\nModo: ${resource.autoConfirm ? 'Automático' : 'Manual'}`;
    
    alert(
      `Detalle de la Donación:\n\n` +
      `Título: ${resource.title}\n` +
      `Categoría: ${this.getCategoryLabel(resource.category)}\n` +
      `Estado: ${this.getStatusText(resource.status)}${autoConfirmInfo}\n` +
      `Descripción: ${resource.description}\n` +
      `Ubicación: ${resource.address || 'No especificada'}${receiverInfo}${deliveryInfo}`
    );
  }

  /**
   * Cancela un recurso
   */
  cancelResource(resource: Resource, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de cancelar la donación "${resource.title}"?\n\nEsta acción no se puede deshacer.`)) {
      this.resourceService.cancelResource(resource.id).subscribe({
        next: (response: any) => {
          this.successMessage = `La donación "${resource.title}" ha sido cancelada`;
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
            this.errorMessage = 'Error al cancelar la donación';
          }
          
          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
    }
  }

  /**
   * Verifica si se puede cancelar
   */
  canCancelResource(resource: Resource): boolean {
    return resource.status === ResourceStatus.AVAILABLE || 
           resource.status === ResourceStatus.CLAIMED;
  }

  /**
   * Obtiene texto del estado
   */
  getStatusText(status: ResourceStatus): string {
    const statusMap: { [key: string]: string } = {
      'AVAILABLE': 'Disponible',
      'CLAIMED': 'Reclamado',
      'IN_TRANSIT': 'En Tránsito',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  /**
   * Obtiene label de categoría
   */
  getCategoryLabel(category: ResourceCategory): string {
    const categoryMap: { [key: string]: string } = {
      'CLOTHING': 'Ropa',
      'FOOD': 'Alimentos',
      'TOOLS': 'Herramientas',
      'TOYS': 'Juguetes',
      'FURNITURE': 'Muebles',
      'ELECTRONICS': 'Electrónicos',
      'BOOKS': 'Libros',
      'HYGIENE': 'Higiene',
      'SCHOOL_SUPPLIES': 'Útiles Escolares',
      'OTHERS': 'Otros'
    };
    return categoryMap[category] || category;
  }

  /**
   * Formatea fecha
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /**
   * Obtiene clase de badge
   */
  getStatusBadgeClass(status: ResourceStatus): string {
    const classMap: { [key: string]: string } = {
      'AVAILABLE': 'bg-success',
      'CLAIMED': 'bg-warning',
      'IN_TRANSIT': 'bg-primary',
      'DELIVERED': 'bg-info',
      'CANCELLED': 'bg-secondary'
    };
    return classMap[status] || 'bg-secondary';
  }

  /**
   * Obtiene icono de categoría
   */
  getCategoryIcon(category: ResourceCategory): string {
    const icons: { [key: string]: string } = {
      'CLOTHING': 'bi-bag',
      'FOOD': 'bi-basket',
      'TOOLS': 'bi-wrench',
      'TOYS': 'bi-balloon',
      'FURNITURE': 'bi-house',
      'ELECTRONICS': 'bi-laptop',
      'BOOKS': 'bi-book',
      'HYGIENE': 'bi-droplet',
      'SCHOOL_SUPPLIES': 'bi-pencil',
      'OTHERS': 'bi-box'
    };
    return icons[category] || 'bi-box';
  }
}
