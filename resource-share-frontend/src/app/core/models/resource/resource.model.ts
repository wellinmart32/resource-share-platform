 
import { ResourceStatus } from '../../enums/resource-status.enum';
import { ResourceCategory } from '../../enums/resource-category.enum';

/**
 * Modelo principal de un recurso donado
 * Contiene toda la información del recurso y su estado en el flujo de donación
 */
export interface Resource {
  id: number;
  title: string;
  description: string;
  category: ResourceCategory;
  status: ResourceStatus;
  
  // Información del donante (emisor)
  donorId: number;
  donorName: string;
  
  // Ubicación del recurso (donde está el donante)
  latitude: number;
  longitude: number;
  address?: string;
  
  // Información del receptor (si ya fue reclamado)
  receiverId?: number;
  receiverName?: string;
  
  // URL de la imagen del recurso (opcional)
  imageUrl?: string;
  
  // Timestamps
  createdAt: Date;
  claimedAt?: Date;
  deliveredAt?: Date;
}
