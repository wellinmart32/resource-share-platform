import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ResourceService } from '../../core/services/resource/resource-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceStatus } from '../../core/enums/resource-status.enum';
import { ResourceCategory } from '../../core/enums/resource-category.enum';

@Component({
  selector: 'app-my-donations',
  templateUrl: './my-donations.component.html',
  styleUrls: ['./my-donations.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MyDonationsComponent implements OnInit {

  allResources: Resource[] = [];
  filteredResources: Resource[] = [];
  isLoading = true;
  errorMessage = '';

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
  ) {}

  ngOnInit() {
    this.loadDonations();
  }

  loadDonations() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getMyDonorResources().subscribe({
      next: (resources) => {
        this.allResources = resources;
        this.filteredResources = resources;
        this.updateFilterCounts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando donaciones:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor';
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar las donaciones';
        }
      }
    });
  }

  private loadMockData() {
    this.allResources = [
      {
        id: 1,
        title: 'Ropa de Niño',
        description: 'Conjunto de ropa para niño de 5-7 años en buen estado',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.AVAILABLE,
        donorId: 1,
        donorName: 'Juan Pérez',
        latitude: -2.1709979,
        longitude: -79.9223592,
        address: 'Centro de Guayaquil',
        createdAt: new Date('2024-01-10')
      },
      {
        id: 2,
        title: 'Juguetes Educativos',
        description: 'Set de juguetes didácticos para niños de 3-6 años',
        category: ResourceCategory.TOYS,
        status: ResourceStatus.CLAIMED,
        donorId: 1,
        donorName: 'Juan Pérez',
        latitude: -2.1709979,
        longitude: -79.9223592,
        receiverId: 2,
        receiverName: 'María González',
        claimedAt: new Date('2024-01-11'),
        createdAt: new Date('2024-01-09')
      },
      {
        id: 3,
        title: 'Mesa de Estudio',
        description: 'Mesa de madera en buen estado, ideal para estudio',
        category: ResourceCategory.FURNITURE,
        status: ResourceStatus.DELIVERED,
        donorId: 1,
        donorName: 'Juan Pérez',
        latitude: -2.1709979,
        longitude: -79.9223592,
        receiverId: 3,
        receiverName: 'Carlos Ramírez',
        claimedAt: new Date('2024-01-08'),
        deliveredAt: new Date('2024-01-10'),
        createdAt: new Date('2024-01-07')
      }
    ];
    
    this.filteredResources = this.allResources;
    this.updateFilterCounts();
    this.isLoading = false;
  }

  private updateFilterCounts() {
    this.filters[0].count = this.allResources.length;
    this.filters[1].count = this.allResources.filter(r => r.status === ResourceStatus.AVAILABLE).length;
    this.filters[2].count = this.allResources.filter(r => r.status === ResourceStatus.CLAIMED).length;
    this.filters[3].count = this.allResources.filter(r => r.status === ResourceStatus.IN_TRANSIT).length;
    this.filters[4].count = this.allResources.filter(r => r.status === ResourceStatus.DELIVERED).length;
  }

  filterByStatus(status: ResourceStatus | 'ALL') {
    this.selectedFilter = status;
    
    if (status === 'ALL') {
      this.filteredResources = this.allResources;
    } else {
      this.filteredResources = this.allResources.filter(r => r.status === status);
    }
  }

  publishNewResource() {
    this.router.navigate(['/donor/publish-resource']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  viewResourceDetail(resource: Resource) {
    alert(`Detalle del recurso:\n\nTítulo: ${resource.title}\nEstado: ${this.getStatusText(resource.status)}\nCategoría: ${this.getCategoryLabel(resource.category)}`);
  }

  cancelResource(resource: Resource, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Estás seguro de cancelar la donación "${resource.title}"?`)) {
      console.log('Cancelando recurso:', resource.id);
      alert('Funcionalidad de cancelar será implementada con el backend');
    }
  }

  getStatusBadgeClass(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'bg-success';
      case ResourceStatus.CLAIMED:
        return 'bg-warning text-dark';
      case ResourceStatus.IN_TRANSIT:
        return 'bg-primary';
      case ResourceStatus.DELIVERED:
        return 'bg-info text-dark';
      case ResourceStatus.CANCELLED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

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

  canCancelResource(resource: Resource): boolean {
    return resource.status === ResourceStatus.AVAILABLE;
  }
}
