import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceStatus } from '../../core/enums/resource-status.enum';
import { ResourceCategory } from '../../core/enums/resource-category.enum';

/**
 * Componente para que el donante vea recursos que han sido reclamados
 * Permite al donante confirmar el encuentro con el receptor
 * Transición de estado: CLAIMED → IN_TRANSIT
 */
@Component({
  selector: 'app-claimed-resources',
  templateUrl: './claimed-resources.component.html',
  styleUrls: ['./claimed-resources.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ClaimedResourcesComponent implements OnInit {

  claimedResources: Resource[] = [];
  
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadClaimedResources();
  }

  /**
   * Carga los recursos que han sido reclamados por receptores
   * Solo muestra recursos en estado CLAIMED del donante actual
   */
  loadClaimedResources() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getDonorClaimedResources().subscribe({
      next: (resources: Resource[]) => {
        this.claimedResources = resources;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recursos reclamados:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar recursos reclamados. Intenta de nuevo';
        }
      }
    });
  }

  /**
   * Confirma el encuentro con el receptor (transición CLAIMED → IN_TRANSIT)
   * Solo el donante que publicó el recurso puede confirmar
   */
  confirmPickup(resource: Resource, event: Event) {
    event.stopPropagation();
    
    const confirmAction = confirm(
      `¿Confirmar encuentro con ${resource.receiverName}?\n\n` +
      `Recurso: "${resource.title}"\n` +
      `Esto cambiará el estado a "En Tránsito" y notificará al receptor.`
    );
    
    if (confirmAction) {
      this.resourceService.confirmPickup(resource.id).subscribe({
        next: (response: any) => {
          this.successMessage = `Encuentro confirmado con ${resource.receiverName}`;
          
          // Remover de la lista de reclamados
          this.claimedResources = this.claimedResources.filter(r => r.id !== resource.id);
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error: any) => {
          console.error('Error confirmando encuentro:', error);
          
          if (error.status === 0) {
            this.successMessage = `Encuentro confirmado (modo demo)`;
            this.claimedResources = this.claimedResources.filter(r => r.id !== resource.id);
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = error.error?.message || 'Error al confirmar el encuentro. Intenta de nuevo';
            
            setTimeout(() => {
              this.errorMessage = '';
            }, 5000);
          }
        }
      });
    }
  }

  /**
   * Carga datos de prueba cuando no hay conexión al backend
   */
  loadMockData() {
    this.claimedResources = [
      {
        id: 1,
        title: 'Ropa de invierno',
        description: 'Chompas y abrigos en buen estado',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.CLAIMED,
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1894128,
        longitude: -79.8886926,
        address: 'Kennedy Norte',
        receiverId: 2,
        receiverName: 'Juan Pérez',
        claimedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10')
      },
      {
        id: 2,
        title: 'Libros escolares',
        description: 'Libros de matemáticas y lenguaje',
        category: ResourceCategory.BOOKS,
        status: ResourceStatus.CLAIMED,
        donorId: 1,
        donorName: 'Usuario Actual',
        latitude: -2.1709979,
        longitude: -79.9223592,
        address: 'Urdesa',
        receiverId: 3,
        receiverName: 'María González',
        claimedAt: new Date('2024-01-16'),
        createdAt: new Date('2024-01-12')
      }
    ];
    
    this.isLoading = false;
  }

  /**
   * Muestra los detalles de un recurso en un alert
   */
  viewResourceDetail(resource: Resource) {
    alert(
      `Detalle del Recurso:\n\n` +
      `Título: ${resource.title}\n` +
      `Descripción: ${resource.description}\n` +
      `Categoría: ${this.getCategoryLabel(resource.category)}\n` +
      `Estado: Reclamado\n` +
      `Reclamado por: ${resource.receiverName}\n` +
      `Fecha de reclamo: ${this.formatDate(resource.claimedAt)}\n` +
      `Ubicación: ${resource.address || 'No especificada'}`
    );
  }

  /**
   * Navega a la página de todas las donaciones
   */
  viewAllDonations() {
    this.router.navigate(['/donor/my-donations']);
  }

  /**
   * Navega de regreso a la página principal
   */
  goBack() {
    this.router.navigate(['/home']);
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
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcula el tiempo transcurrido desde que fue reclamado
   */
  getTimeSinceClaimed(claimedAt: Date | undefined): string {
    if (!claimedAt) return '';
    
    const now = new Date();
    const claimed = new Date(claimedAt);
    const diffMs = now.getTime() - claimed.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffMins > 0) {
      return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    } else {
      return 'hace un momento';
    }
  }
}
