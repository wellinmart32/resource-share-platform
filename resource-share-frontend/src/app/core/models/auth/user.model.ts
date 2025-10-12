 
import { UserRole } from '../../enums/user-role.enum';

/**
 * Modelo de Usuario
 * Representa los datos completos de un usuario autenticado en el sistema
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  active: boolean;
  
  // Campos opcionales específicos para DONOR
  address?: string;
  city?: string;
  
  // Timestamp de creación
  createdAt?: Date;
}
