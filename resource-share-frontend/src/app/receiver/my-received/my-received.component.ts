import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceStatus } from '../../core/enums/resource-status.enum';
import { ResourceCategory } from '../../core/enums/resource-category.enum';

@Component({
  selector: 'app-my-received',
  templateUrl: './my-received.component.html',
  styleUrls: ['./my-received.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class MyReceivedComponent implements OnInit {

  allResources: Resource[] = [];
  filteredResources: Resource[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  selectedFilter: ResourceStatus | 'ALL' = 'ALL';
  
  filters: { value: ResourceStatus | 'ALL', label: string, count: number, class: string }[] = [
    { value: 'ALL', label: 'Todos', count: 0, class: 'btn-outline-primary' },
    { value: ResourceStatus.CLAIMED, label: 'Reclamados', count: 0, class: 'btn-outline-warning' },
    { value: ResourceStatus.IN_TRANSIT, label: 'En Tránsito', count: 0, class: 'btn-outline-primary' },
    { value: ResourceStatus.DELIVERED, label: 'Entregados', count: 0, class: 'btn-outline-success' }
  ];

  constructor(
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadReceivedResources();
  }

  loadReceivedResources() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getMyReceivedResources().subscribe({
      next: (resources: Resource[]) => {
        this.allResources = resources;
        this.filteredResources = resources;
        this.updateFilterCounts();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recursos recibidos:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar tus recursos. Intenta de nuevo.';
        }
      }
    });
  }

  private loadMockData() {
    this.allResources = [
      {
        id: 10,
        title: 'Laptop Dell',
        description: 'Laptop en buen estado, ideal para trabajo',
        category: ResourceCategory.ELECTRONICS,
        status: ResourceStatus.IN_TRANSIT,
        donorId: 3,
        donorName: 'Carlos Mendoza',
        latitude: -2.1709979,
        longitude: -79.9223592,
        address: 'Urdesa',
        receiverId: 1,
        receiverName: 'Usuario Actual',
        claimedAt: new Date('2024-01-10'),
        createdAt: new Date('2024-01-08')
      },
      {
        id: 11,
        title: 'Ropa de Invierno',
        description: 'Conjunto de ropa abrigada',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.CLAIMED,
        donorId: 4,
        donorName: 'María González',
        latitude: -2.1450979,
        longitude: -79.9423592,
        address: 'Alborada',
        receiverId: 1,
        receiverName: 'Usuario Actual',
        claimedAt: new Date('2024-01-12'),
        createdAt: new Date('2024-01-09')
      },
      {
        id: 12,
        title: 'Libros de Matemáticas',
        description: 'Colección completa de libros universitarios',
        category: ResourceCategory.BOOKS,
        status: ResourceStatus.DELIVERED,
        donorId: 5,
        donorName: 'Luis Torres',
        latitude: -2.1550979,
        longitude: -79.9523592,
        address: 'Kennedy',
        receiverId: 1,
        receiverName: 'Usuario Actual',
        claimedAt: new Date('2024-01-10'),
        deliveredAt: new Date('2024-01-12'),
        createdAt: new Date('2024-01-08')
      }
    ];
    
    this.filteredResources = this.allResources;
    this.updateFilterCounts();
    this.isLoading = false;
  }

  private updateFilterCounts() {
    this.filters[0].count = this.allResources.length;
    this.filters[1].count = this.allResources.filter(r => r.status === ResourceStatus.CLAIMED).length;
    this.filters[2].count = this.allResources.filter(r => r.status === ResourceStatus.IN_TRANSIT).length;
    this.filters[3].count = this.allResources.filter(r => r.status === ResourceStatus.DELIVERED).length;
  }

  filterByStatus(status: ResourceStatus | 'ALL') {
    this.selectedFilter = status;
    
    if (status === 'ALL') {
      this.filteredResources = this.allResources;
    } else {
      this.filteredResources = this.allResources.filter(r => r.status === status);
    }
  }

  browseMoreResources() {
    this.router.navigate(['/receiver/browse-resources']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  viewResourceDetail(resource: Resource) {
    alert(`Detalle del recurso:\n\nTítulo: ${resource.title}\nEstado: ${this.getStatusText(resource.status)}\nDonante: ${resource.donorName}\nCategoría: ${this.getCategoryLabel(resource.category)}`);
  }

  confirmReceipt(resource: Resource, event: Event) {
    event.stopPropagation();
    
    if (confirm(`¿Confirmas que recibiste "${resource.title}"?\n\nEsto notificará al donante que la entrega fue exitosa.`)) {
      this.resourceService.confirmDelivery(resource.id).subscribe({
        next: (response) => {
          this.successMessage = `Has confirmado la recepción de "${resource.title}"`;
          this.loadReceivedResources();
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error confirmando recepción:', error);
          
          if (error.status === 0) {
            this.successMessage = `Recepción confirmada (modo demo)`;
            resource.status = ResourceStatus.DELIVERED;
            resource.deliveredAt = new Date();
            this.updateFilterCounts();
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = 'Error al confirmar la recepción. Intenta de nuevo';
          }
        }
      });
    }
  }

  getStatusBadgeClass(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.CLAIMED:
        return 'bg-warning text-dark';
      case ResourceStatus.IN_TRANSIT:
        return 'bg-primary';
      case ResourceStatus.DELIVERED:
        return 'bg-success';
      case ResourceStatus.CANCELLED:
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: ResourceStatus): string {
    switch (status) {
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

  canConfirmReceipt(resource: Resource): boolean {
    return resource.status === ResourceStatus.IN_TRANSIT;
  }

  getStatusIcon(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.CLAIMED:
        return 'bi-hand-thumbs-up';
      case ResourceStatus.IN_TRANSIT:
        return 'bi-truck';
      case ResourceStatus.DELIVERED:
        return 'bi-check-circle';
      default:
        return 'bi-question-circle';
    }
  }
}
