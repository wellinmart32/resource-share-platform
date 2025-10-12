 
import { ResourceStatus } from '../../enums/resource-status.enum';

/**
 * Respuesta del backend después de publicar un recurso
 * Confirma la creación y devuelve el ID asignado
 */
export interface ResourceResponse {
  id: number;
  status: ResourceStatus;
  message: string;
  createdAt: Date;
}
