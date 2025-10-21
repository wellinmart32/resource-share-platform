import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/services/auth/auth-service';
import { ResourceService } from '../core/services/resource/resource-service';
import { User } from '../core/models/auth/user.model';
import { Resource } from '../core/models/resource/resource.model';
import { ResourceStatus } from '../core/enums/resource-status.enum';
import { ResourceCategory } from '../core/enums/resource-category.enum';

interface DonorStats {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  claimedCount: number;
}

interface ReceiverData {
  nearbyResources: number;
  claimedResources: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HomePage implements OnInit {

  isDonor = false;
  isReceiver = false;
  userName = '';
  userEmail = '';
  
  isLoading = true;
  
  donorStats: DonorStats = {
    totalDonations: 0,
    activeDonations: 0,
    completedDonations: 0,
    claimedCount: 0
  };
  
  receiverData: ReceiverData = {
    nearbyResources: 0,
    claimedResources: 0
  };
  
  recentResources: Resource[] = [];

  constructor(
    private authService: AuthService,
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  /**
   * Carga los datos del usuario actual
   * Verifica que existe sesión activa antes de continuar
   */
  private loadUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.updateUserData(currentUser);
    } else {
      console.error('Token existe pero usuario no está disponible');
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Actualiza los datos del usuario en el componente
   * Determina si es donante o receptor y carga datos específicos
   */
  private updateUserData(user: User) {
    this.isDonor = this.authService.isDonor();
    this.isReceiver = this.authService.isReceiver();
    this.userName = user.firstName || 'Usuario';
    this.userEmail = user.email;
    
    this.loadUserSpecificData();
  }

  /**
   * Limpia los datos del usuario cuando cierra sesión
   */
  private clearUserData() {
    this.isDonor = false;
    this.isReceiver = false;
    this.userName = '';
    this.userEmail = '';
  }

  /**
   * Carga los datos específicos según el rol del usuario
   * Llama a métodos diferentes para donante o receptor
   */
  private loadUserSpecificData() {
    this.isLoading = true;
    
    if (this.isDonor) {
      this.loadDonorData();
    } else if (this.isReceiver) {
      this.loadReceiverData();
    }
  }

  /**
   * Carga las estadísticas y recursos del donante
   * Calcula totales, recursos activos y completados
   */
  private loadDonorData() {
    this.resourceService.getMyDonorResources().subscribe({
      next: (resources: Resource[]) => {
        this.donorStats.totalDonations = resources.length;
        this.donorStats.activeDonations = resources.filter(r => 
          r.status === ResourceStatus.AVAILABLE || 
          r.status === ResourceStatus.CLAIMED ||
          r.status === ResourceStatus.IN_TRANSIT
        ).length;
        this.donorStats.completedDonations = resources.filter(r => 
          r.status === ResourceStatus.DELIVERED
        ).length;
        this.donorStats.claimedCount = resources.filter(r =>
          r.status === ResourceStatus.CLAIMED
        ).length;
        
        this.recentResources = resources.slice(0, 3);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando datos del donante:', error);
        this.isLoading = false;
        this.useMockDonorData();
      }
    });
  }

  /**
   * Carga los datos del receptor
   * Obtiene recursos disponibles y recursos ya reclamados
   */
  private loadReceiverData() {
    this.resourceService.getAvailableResources().subscribe({
      next: (resources: Resource[]) => {
        this.receiverData.nearbyResources = resources.length;
        this.recentResources = resources.slice(0, 5);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error cargando recursos disponibles:', error);
        this.receiverData.nearbyResources = 0;
      }
    });

    this.resourceService.getMyReceivedResources().subscribe({
      next: (resources: Resource[]) => {
        this.receiverData.claimedResources = resources.length;
      },
      error: (error: any) => {
        console.error('Error cargando recursos reclamados:', error);
        this.receiverData.claimedResources = 0;
      }
    });
  }

  /**
   * Datos de prueba para el donante cuando no hay conexión al backend
   */
  private useMockDonorData() {
    this.donorStats = {
      totalDonations: 5,
      activeDonations: 2,
      completedDonations: 3,
      claimedCount: 1
    };
  }

  /**
   * Datos de prueba para el receptor cuando no hay conexión al backend
   */
  private useMockReceiverData() {
    this.receiverData = {
      nearbyResources: 12,
      claimedResources: 3
    };
  }

  /**
   * Navega a la página para publicar un nuevo recurso
   */
  publishResource() {
    this.router.navigate(['/donor/publish-resource']);
  }

  /**
   * Navega a la página de "Mis Donaciones"
   */
  viewMyDonations() {
    this.router.navigate(['/donor/my-donations']);
  }

  /**
   * Navega a la página de recursos reclamados
   */
  viewClaimedResources() {
    this.router.navigate(['/donor/claimed-resources']);
  }

  /**
   * Navega a la página de búsqueda de recursos
   */
  browseResources() {
    this.router.navigate(['/receiver/browse-resources']);
  }

  /**
   * Navega a la página de recursos reclamados por el usuario
   */
  viewMyReceived() {
    this.router.navigate(['/receiver/my-received']);
  }

  /**
   * Muestra el perfil del usuario (funcionalidad pendiente)
   */
  viewProfile() {
    alert('Perfil será implementado próximamente');
  }

  /**
   * Cierra la sesión del usuario después de confirmar
   * Limpia el token y redirige al login
   */
  logout() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
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
   * Obtiene la clase CSS para el badge según el estado del recurso
   */
  getStatusBadgeClass(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'bg-success';
      case ResourceStatus.CLAIMED:
        return 'bg-warning text-dark';
      case ResourceStatus.IN_TRANSIT:
        return 'bg-primary';
      case ResourceStatus.DELIVERED:
        return 'bg-info';
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
}
