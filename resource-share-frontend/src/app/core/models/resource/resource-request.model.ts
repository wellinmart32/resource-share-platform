 
import { ResourceCategory } from '../../enums/resource-category.enum';

/**
 * Datos que el DONOR envía para publicar un nuevo recurso
 * La ubicación (latitude/longitude) se obtiene del GPS o selección manual en mapa
 */
export interface ResourceRequest {
  title: string;
  description: string;
  category: ResourceCategory;
  
  // Ubicación donde está el recurso (ubicación del donante)
  latitude: number;
  longitude: number;
  address?: string;
  
  // Imagen del recurso (opcional, se envía como base64 o URL)
  imageUrl?: string;
}
