import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Resource } from '../../models/resource/resource.model';
import { ResourceRequest } from '../../models/resource/resource-request.model';
import { ResourceStatus } from '../../enums/resource-status.enum';
import { ResourceCategory } from '../../enums/resource-category.enum';

/**
 * Servicio de gestión de recursos
 * Maneja todas las operaciones CRUD de recursos y comunicación con el backend
 */
@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private readonly API_URL = 'http://localhost:8080/api/resources';

  constructor(private http: HttpClient) {}

  /**
   * Publicar un nuevo recurso (solo DONOR)
   * El recurso se crea con estado AVAILABLE
   */
  publishResource(resourceRequest: ResourceRequest): Observable<Resource> {
    return this.http.post<Resource>(`${this.API_URL}`, resourceRequest)
      .pipe(
        tap(response => {
          console.log('✅ Recurso publicado:', response.id);
        }),
        catchError(error => {
          console.error('❌ Error publicando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener todos los recursos disponibles (para RECEIVER)
   * Solo muestra recursos con status AVAILABLE
   */
  getAvailableResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/available`)
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo recursos:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener recursos por categoría
   * Filtra recursos disponibles por una categoría específica
   */
  getResourcesByCategory(category: ResourceCategory): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/category/${category}`)
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo recursos por categoría:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener un recurso específico por ID
   * Retorna el detalle completo del recurso
   */
  getResourceById(id: number): Observable<Resource> {
    return this.http.get<Resource>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener mis recursos como DONOR
   * Devuelve todos los recursos que he publicado en cualquier estado
   */
  getMyDonorResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/my-donations`)
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo mis donaciones:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener recursos CLAIMED del donante actual
   * Muestra recursos que fueron reclamados pero aún no confirmados
   * Usado para que el donante vea quién reclamó sus recursos
   */
  getDonorClaimedResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/donor/claimed`)
      .pipe(
        tap(response => {
          console.log('📋 Recursos reclamados cargados:', response.length);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo recursos reclamados:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener mis recursos como RECEIVER
   * Devuelve los recursos que he reclamado en cualquier estado
   */
  getMyReceivedResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/my-received`)
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo recursos recibidos:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Reclamar un recurso (solo RECEIVER)
   * Cambia el estado de AVAILABLE a CLAIMED
   * El recurso desaparece de la lista de disponibles para otros receptores
   */
  claimResource(resourceId: number): Observable<Resource> {
    return this.http.post<Resource>(`${this.API_URL}/${resourceId}/claim`, null)
      .pipe(
        tap(response => {
          console.log('✅ Recurso reclamado:', response.id);
        }),
        catchError(error => {
          console.error('❌ Error reclamando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirmar el encuentro entre donante y receptor (solo DONOR)
   * Cambia el estado de CLAIMED a IN_TRANSIT
   * Solo el donante que publicó el recurso puede confirmar
   */
  confirmPickup(resourceId: number): Observable<Resource> {
    return this.http.put<Resource>(`${this.API_URL}/${resourceId}/confirm-pickup`, null)
      .pipe(
        tap(response => {
          console.log('✅ Encuentro confirmado:', response.id);
        }),
        catchError(error => {
          console.error('❌ Error confirmando encuentro:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirmar la entrega de un recurso (solo RECEIVER)
   * Cambia el estado de IN_TRANSIT a DELIVERED
   * Solo el receptor que reclamó el recurso puede confirmar
   */
  confirmDelivery(resourceId: number): Observable<Resource> {
    return this.http.patch<Resource>(`${this.API_URL}/${resourceId}/deliver`, null)
      .pipe(
        tap(response => {
          console.log('✅ Entrega confirmada:', response.id);
        }),
        catchError(error => {
          console.error('❌ Error confirmando entrega:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancelar un recurso (solo DONOR que lo publicó)
   * Solo se pueden cancelar recursos en estado AVAILABLE o CLAIMED
   * El recurso cambia a status CANCELLED
   */
  cancelResource(resourceId: number): Observable<Resource> {
    return this.http.delete<Resource>(`${this.API_URL}/${resourceId}/cancel`)
      .pipe(
        tap(response => {
          console.log('✅ Recurso cancelado:', response.id);
        }),
        catchError(error => {
          console.error('❌ Error cancelando recurso:', error);
          return throwError(() => error);
        })
      );
  }
}
