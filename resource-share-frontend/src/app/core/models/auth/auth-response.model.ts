 
import { UserRole } from '../../enums/user-role.enum';

/**
 * Respuesta del backend después de login o registro exitoso
 * El jwt se usará para autenticar todas las peticiones posteriores
 */
export interface AuthResponse {
  jwt: string;
  userId: number;
  role: UserRole;
  email: string;
  message?: string;
}
