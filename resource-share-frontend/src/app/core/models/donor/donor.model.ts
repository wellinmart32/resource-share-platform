 
/**
 * Modelo específico del DONOR (emisor de recursos)
 * Extiende la información básica del User con datos adicionales del donante
 */
export interface Donor {
  id: number;
  userId: number;
  
  // Ubicación predeterminada del donante
  address?: string;
  city?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
  
  // Estadísticas del donante
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  
  // Calificación (opcional, para futuras implementaciones)
  rating?: number;
  
  createdAt: Date;
}
