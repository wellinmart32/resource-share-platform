import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth-service';
import { UserRole } from '../enums/user-role.enum';

/**
 * Protege rutas verificando que el usuario tenga el rol requerido
 * El rol requerido se especifica en la configuración de la ruta: data: { role: UserRole.DONOR }
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener el rol requerido desde la configuración de la ruta
  const requiredRole = route.data['role'] as UserRole;
  
  // Obtener el rol del usuario actual
  const userRole = authService.getUserRole();

  // Verificar si el usuario está autenticado
  if (!userRole) {
    console.warn('Acceso denegado: usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  // Verificar si el usuario tiene el rol requerido
  if (requiredRole && userRole === requiredRole) {
    return true;
  }

  // Denegar acceso si el rol no coincide
  console.warn(`Acceso denegado: rol ${userRole} no tiene permisos para esta ruta`);
  router.navigate(['/home']);
  return false;
};