/**
 * Modelo para actualizar datos del usuario
 * Contiene solo los campos que pueden ser modificados por el usuario
 * Todos los campos son opcionales - solo se actualizan los que se envíen
 */
export interface UserUpdateDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
}
