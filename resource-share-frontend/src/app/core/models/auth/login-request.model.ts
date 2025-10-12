 
import { UserRole } from '../../enums/user-role.enum';

/**
 * Datos necesarios para iniciar sesión en la plataforma
 */
export interface LoginRequest {
  email: string;
  password: string;
}
