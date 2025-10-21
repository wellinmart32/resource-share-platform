import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ResourceService } from '../../core/services/resource/resource-service';
import { Resource } from '../../core/models/resource/resource.model';
import { ResourceStatus } from '../../core/enums/resource-status.enum';
import { ResourceCategory } from '../../core/enums/resource-category.enum';

/**
 * Componente para que el receptor vea recursos en tránsito
 * Muestra recursos en estado IN_TRANSIT ya confirmados por el donante
 * El receptor puede confirmar la recepción final del recurso
 */
@Component({
  selector: 'app-in-transit',
  templateUrl: './in-transit.component.html',
  styleUrls: ['./in-transit.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class InTransitComponent implements OnInit {

  inTransitResources: Resource[] = [];
  
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInTransitResources();
  }

  /**
   * Carga los recursos que están en tránsito (IN_TRANSIT)
   * Filtra solo los recursos donde el donante ya confirmó el encuentro
   */
  loadInTransitResources() {
    this.isLoading = true;
    this.errorMessage = '';

    this.resourceService.getMyReceivedResources().subscribe({
      next: (resources: Resource[]) => {
        // Filtrar solo recursos en estado IN_TRANSIT
        this.inTransitResources = resources.filter(r => r.status === ResourceStatus.IN_TRANSIT);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recursos en tránsito:', error);
        this.isLoading = false;
        
        if (error.status === 0) {
          this.loadMockData();
        } else {
          this.errorMessage = 'Error al cargar recursos en tránsito. Intenta de nuevo';
        }
      }
    });
  }

  /**
   * Confirma la recepción del recurso (transición IN_TRANSIT → DELIVERED)
   * Solo el receptor puede confirmar que recibió el recurso
   */
  confirmDelivery(resource: Resource, event: Event) {
    event.stopPropagation();
    
    const confirmAction = confirm(
      `¿Confirmar que recibiste "${resource.title}"?\n\n` +
      `Donante: ${resource.donorName}\n` +
      `Esto marcará el recurso como entregado y completará la donación.`
    );
    
    if (confirmAction) {
      this.resourceService.confirmDelivery(resource.id).subscribe({
        next: (response: any) => {
          this.successMessage = `¡Recurso "${resource.title}" recibido exitosamente!`;
          
          // Remover de la lista de en tránsito
          this.inTransitResources = this.inTransitResources.filter(r => r.id !== resource.id);
          
          setTimeout(() => {
            this.successMessage = '';
            
            // Si no quedan más recursos, redirigir
            if (this.inTransitResources.length === 0) {
              this.router.navigate(['/receiver/my-received']);
            }
          }, 3000);
        },
        error: (error: any) => {
          console.error('Error confirmando entrega:', error);
          
          if (error.status === 0) {
            this.successMessage = `Entrega confirmada (modo demo)`;
            this.inTransitResources = this.inTransitResources.filter(r => r.id !== resource.id);
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          } else {
            this.errorMessage = error.error?.message || 'Error al confirmar la entrega. Intenta de nuevo';
            
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
    this.inTransitResources = [
      {
        id: 1,
        title: 'Ropa de invierno',
        description: 'Chompas y abrigos en buen estado',
        category: ResourceCategory.CLOTHING,
        status: ResourceStatus.IN_TRANSIT,
        donorId: 2,
        donorName: 'María García',
        latitude: -2.1894128,
        longitude: -79.8886926,
        address: 'Kennedy Norte',
        receiverId: 1,
        receiverName: 'Usuario Actual',
        claimedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10')
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
      `Estado: En Tránsito\n` +
      `Donante: ${resource.donorName}\n` +
      `Reclamado: ${this.formatDate(resource.claimedAt)}\n` +
      `Ubicación: ${resource.address || 'No especificada'}`
    );
  }

  /**
   * Navega a todos los recursos recibidos
   */
  viewAllReceived() {
    this.router.navigate(['/receiver/my-received']);
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
}
