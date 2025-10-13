import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/enums/user-role.enum';

export const routes: Routes = [
  // Ruta principal redirige a login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  // Rutas públicas (sin autenticación)
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },

  // Home (requiere autenticación)
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard]
  },

  // Rutas para DONOR (requiere autenticación + rol DONOR)
  {
    path: 'donor-dashboard',
    loadComponent: () => import('./donor/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.DONOR] }
  },
  {
    path: 'publish-resource',
    loadComponent: () => import('./donor/publish-resource/publish-resource.component').then(m => m.PublishResourceComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.DONOR] }
  },
  {
    path: 'my-donations',
    loadComponent: () => import('./donor/my-donations/my-donations.component').then(m => m.MyDonationsComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.DONOR] }
  },

  // Rutas para RECEIVER (requiere autenticación + rol RECEIVER)
  {
    path: 'receiver-dashboard',
    loadComponent: () => import('./receiver/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.RECEIVER] }
  },
  {
    path: 'browse-resources',
    loadComponent: () => import('./receiver/browse-resources/browse-resources.component').then(m => m.BrowseResourcesComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.RECEIVER] }
  },
  {
    path: 'my-received',
    loadComponent: () => import('./receiver/my-received/my-received.component').then(m => m.MyReceivedComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.RECEIVER] }
  },

  // Ruta para ver detalles de un recurso (ambos roles)
  {
    path: 'resource/:id',
    loadComponent: () => import('./shared/resource-detail/resource-detail.component').then(m => m.ResourceDetailComponent),
    canActivate: [authGuard]
  },

  // Ruta para tracking en tiempo real (ambos roles)
  {
    path: 'tracking/:id',
    loadComponent: () => import('./shared/tracking/tracking.component').then(m => m.TrackingComponent),
    canActivate: [authGuard]
  },

  // Wildcard - redirige a login
  {
    path: '**',
    redirectTo: '/login'
  }
];
