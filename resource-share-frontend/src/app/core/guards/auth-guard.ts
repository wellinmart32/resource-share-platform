import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';

/**
 * Protege rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  console.warn('Acceso denegado: usuario no autenticado');
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
