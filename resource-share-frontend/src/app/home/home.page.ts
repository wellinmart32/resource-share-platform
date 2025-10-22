import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
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
export class HomePage implements OnInit, OnDestroy {

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

  // Suscripciones reactivas
  private currentUserSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🏠 [HOME] Inicializando componente');
    this.subscribeToAuthChanges();
    this.loadUserData();
  }

  ngOnDestroy() {
    console.log('🗑️ [HOME] Limpiando suscripciones');
    this.currentUserSubscription?.unsubscribe();
  }

  /**
   * Configura la suscripción reactiva para detectar cambios en el estado de autenticación
   */
  private subscribeToAuthChanges() {
    this.currentUserSubscription = this.authService.currentUser$.subscribe({
      next: (user: User | null) => {
        console.log('🔔 [HOME] Usuario cambió:', user?.email || 'Sin usuario');
        
        if (user) {
          this.updateUserData(user);
        } else {
          this.clearUserData();
        }
      },
      error: (error) => {
        console.error('❌ [HOME] Error en suscripción auth:', error);
      }
    });
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
    this.donorStats = {
      totalDonations: 0,
      activeDonations: 0,
      completedDonations: 0,
      claimedCount: 0
    };
    this.receiverData = {
      nearbyResources: 0,
      claimedResources: 0
    };
    this.recentResources = [];
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
        this.donorStats.activeDonations = resources.filter(r => r.status === ResourceStatus.AVAILABLE).length;
        this.donorStats.completedDonations = resources.filter(r => r.status === ResourceStatus.DELIVERED).length;
        this.donorStats.claimedCount = resources.filter(r => r.status === ResourceStatus.CLAIMED || r.status === ResourceStatus.IN_TRANSIT).length;
        
        this.recentResources = resources.slice(0, 3);
        this.isLoading = false;
        
        console.log('✅ Datos de donante cargados');
      },
      error: (error) => {
        console.error('❌ Error cargando recursos del donante:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga los datos del receptor
   * Obtiene recursos disponibles cercanos y recursos reclamados
   */
  private loadReceiverData() {
    this.resourceService.getAvailableResources().subscribe({
      next: (resources: Resource[]) => {
        this.receiverData.nearbyResources = resources.length;
        this.recentResources = resources.slice(0, 3);
        this.loadClaimedResourcesCount();
        
        console.log('✅ Datos de receptor cargados');
      },
      error: (error) => {
        console.error('❌ Error cargando recursos disponibles:', error);
        this.receiverData.nearbyResources = 0;
        this.isLoading = false;
      }
    });
  }

  /**
   * Carga el conteo de recursos reclamados por el receptor
   */
  private loadClaimedResourcesCount() {
    this.resourceService.getMyReceivedResources().subscribe({
      next: (resources: Resource[]) => {
        this.receiverData.claimedResources = resources.filter(
          r => r.status === ResourceStatus.CLAIMED || 
              r.status === ResourceStatus.IN_TRANSIT || 
              r.status === ResourceStatus.DELIVERED
        ).length;
        this.isLoading = false;
        
        console.log('✅ Recursos reclamados contados');
      },
      error: (error: any) => {
        console.error('❌ Error cargando recursos reclamados:', error);
        this.receiverData.claimedResources = 0;
        this.isLoading = false;
      }
    });
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
   * Navega al perfil del usuario
   */
  viewProfile() {
    this.router.navigate(['/profile']);
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
