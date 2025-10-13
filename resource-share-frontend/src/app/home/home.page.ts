import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../core/services/auth/auth-service';
import { ResourceService } from '../core/services/resource/resource-service';
import { User } from '../core/models/auth/user.model';
import { Resource } from '../core/models/resource/resource.model';
import { ResourceStatus } from '../core/enums/resource-status.enum';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  
  isDonor = false;
  isReceiver = false;
  userName = '';
  userEmail = '';
  
  donorStats = {
    totalDonations: 0,
    activeDonations: 0,
    completedDonations: 0
  };

  receiverData = {
    nearbyResources: 0,
    claimedResources: 0
  };

  recentResources: Resource[] = [];
  
  isLoading = true;
  
  private currentUserSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscribeToAuthChanges();
    this.checkAuthenticationStatus();
  }

  ngOnDestroy() {
    this.currentUserSubscription?.unsubscribe();
  }

  private subscribeToAuthChanges() {
    this.currentUserSubscription = this.authService.currentUser$.subscribe({
      next: (user: User | null) => {
        if (user) {
          this.updateUserData(user);
        } else {
          this.clearUserData();
        }
      }
    });
  }

  private checkAuthenticationStatus() {
    const isAuth = this.authService.isAuthenticated();
    
    if (!isAuth) {
      this.router.navigate(['/login']);
      return;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.updateUserData(currentUser);
    }
  }

  private updateUserData(user: User) {
    this.isDonor = this.authService.isDonor();
    this.isReceiver = this.authService.isReceiver();
    this.userName = user.firstName || 'Usuario';
    this.userEmail = user.email;
    
    this.loadUserSpecificData();
  }

  private clearUserData() {
    this.isDonor = false;
    this.isReceiver = false;
    this.userName = '';
    this.userEmail = '';
  }

  private loadUserSpecificData() {
    this.isLoading = true;
    
    if (this.isDonor) {
      this.loadDonorData();
    } else if (this.isReceiver) {
      this.loadReceiverData();
    }
  }

  private loadDonorData() {
    this.resourceService.getMyDonorResources().subscribe({
      next: (resources) => {
        this.donorStats.totalDonations = resources.length;
        this.donorStats.activeDonations = resources.filter(r => 
          r.status === ResourceStatus.AVAILABLE || 
          r.status === ResourceStatus.CLAIMED || 
          r.status === ResourceStatus.IN_TRANSIT
        ).length;
        this.donorStats.completedDonations = resources.filter(r => 
          r.status === ResourceStatus.DELIVERED
        ).length;
        
        this.recentResources = resources.slice(0, 3);
        this.isLoading = false;
      },
      error: () => {
        this.useMockDonorData();
        this.isLoading = false;
      }
    });
  }

  private loadReceiverData() {
    this.resourceService.getAvailableResources().subscribe({
      next: (resources) => {
        this.receiverData.nearbyResources = resources.length;
        this.recentResources = resources.slice(0, 5);
        this.isLoading = false;
      },
      error: () => {
        this.useMockReceiverData();
        this.isLoading = false;
      }
    });

    this.resourceService.getMyReceivedResources().subscribe({
      next: (resources) => {
        this.receiverData.claimedResources = resources.length;
      },
      error: () => {
        this.receiverData.claimedResources = 0;
      }
    });
  }

  private useMockDonorData() {
    this.donorStats = {
      totalDonations: 5,
      activeDonations: 2,
      completedDonations: 3
    };
  }

  private useMockReceiverData() {
    this.receiverData = {
      nearbyResources: 12,
      claimedResources: 3
    };
  }

  publishResource() {
    this.router.navigate(['/donor/publish-resource']);
  }

  viewMyDonations() {
    this.router.navigate(['/donor/my-donations']);
  }

  browseResources() {
    this.router.navigate(['/receiver/browse-resources']);
  }

  viewMyReceived() {
    this.router.navigate(['/receiver/my-received']);
  }

  viewProfile() {
    alert('Perfil será implementado próximamente');
  }

  logout() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  getStatusBadgeClass(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'bg-success';
      case ResourceStatus.CLAIMED:
        return 'bg-warning';
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

  getStatusText(status: ResourceStatus): string {
    switch (status) {
      case ResourceStatus.AVAILABLE:
        return 'Disponible';
      case ResourceStatus.CLAIMED:
        return 'Reclamado';
      case ResourceStatus.IN_TRANSIT:
        return 'En tránsito';
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
}
