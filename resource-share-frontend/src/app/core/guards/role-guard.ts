import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { UserRole } from '../enums/user-role.enum';

/**
 * Protege rutas verificando roles específicos
 * Los roles permitidos se definen en data: { roles: ['DONOR'] }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];
  const userRole = authService.getCurrentUserRole();

  if (!userRole) {
    console.warn('Acceso denegado: usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  if (requiredRoles && requiredRoles.includes(userRole)) {
    return true;
  }

  console.warn(`Acceso denegado: rol ${userRole} no tiene permisos`);
  router.navigate(['/home']);
  return false;
};
