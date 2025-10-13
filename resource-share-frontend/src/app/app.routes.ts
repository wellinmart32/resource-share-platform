import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

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

  // Wildcard - redirige a login
  {
    path: '**',
    redirectTo: '/login'
  }
];
