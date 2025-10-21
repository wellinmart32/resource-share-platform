import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { UserRole } from './core/enums/user-role.enum';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },

  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard]
  },

  {
    path: 'donor/publish-resource',
    loadComponent: () => import('./donor/publish-resource/publish-resource.component').then(m => m.PublishResourceComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.DONOR }
  },
  {
    path: 'donor/my-donations',
    loadComponent: () => import('./donor/my-donations/my-donations.component').then(m => m.MyDonationsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.DONOR }
  },
  {
    path: 'donor/claimed-resources',
    loadComponent: () => import('./donor/claimed-resources/claimed-resources.component').then(m => m.ClaimedResourcesComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.DONOR }
  },

  {
    path: 'receiver/browse-resources',
    loadComponent: () => import('./receiver/browse-resources/browse-resources.component').then(m => m.BrowseResourcesComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.RECEIVER }
  },
  {
    path: 'receiver/my-received',
    loadComponent: () => import('./receiver/my-received/my-received.component').then(m => m.MyReceivedComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.RECEIVER }
  },
  {
    path: 'receiver/my-claims',
    loadComponent: () => import('./receiver/my-claims/my-claims.component').then(m => m.MyClaimsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.RECEIVER }
  },
  {
    path: 'receiver/in-transit',
    loadComponent: () => import('./receiver/in-transit/in-transit.component').then(m => m.InTransitComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: UserRole.RECEIVER }
  },

  {
    path: '**',
    redirectTo: '/login'
  }
];
