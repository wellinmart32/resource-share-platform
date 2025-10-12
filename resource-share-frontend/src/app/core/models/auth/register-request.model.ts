 
import { UserRole } from '../../enums/user-role.enum';

/**
 * Datos necesarios para registrar un nuevo usuario
 * Si el rol es DONOR, puede incluir address y city opcionales
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  
  // Solo para DONOR (emisores de recursos)
  address?: string;
  city?: string;
}
