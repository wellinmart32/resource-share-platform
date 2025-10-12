import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Resource } from '../../models/resource/resource.model';
import { ResourceRequest } from '../../models/resource/resource-request.model';
import { ResourceResponse } from '../../models/resource/resource-response.model';
import { ResourceStatus } from '../../enums/resource-status.enum';
import { ResourceCategory } from '../../enums/resource-category.enum';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  private readonly API_URL = 'http://localhost:8080/api/resources';

  constructor(private http: HttpClient) {}

  /**
   * Publicar un nuevo recurso (solo DONOR)
   */
  publishResource(resourceRequest: ResourceRequest): Observable<ResourceResponse> {
    return this.http.post<ResourceResponse>(`${this.API_URL}`, resourceRequest)
      .pipe(
        tap(response => {
          console.log('Recurso publicado:', response.id);
        }),
        catchError(error => {
          console.error('Error publicando recurso:', error);
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
          console.error('Error obteniendo recursos:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener recursos por categoría
   */
  getResourcesByCategory(category: ResourceCategory): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/category/${category}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo recursos por categoría:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener un recurso específico por ID
   */
  getResourceById(id: number): Observable<Resource> {
    return this.http.get<Resource>(`${this.API_URL}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener mis recursos como DONOR
   * Devuelve todos los recursos que he publicado
   */
  getMyDonorResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/my-donations`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo mis donaciones:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener mis recursos como RECEIVER
   * Devuelve los recursos que he reclamado
   */
  getMyReceivedResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/my-received`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo recursos recibidos:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Reclamar un recurso (solo RECEIVER)
   * El recurso cambia a status CLAIMED y desaparece de la lista para otros
   */
  claimResource(resourceId: number): Observable<Resource> {
    return this.http.post<Resource>(`${this.API_URL}/${resourceId}/claim`, {})
      .pipe(
        tap(resource => {
          console.log('Recurso reclamado:', resource.id);
        }),
        catchError(error => {
          console.error('Error reclamando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Marcar que el RECEIVER está en camino
   * Cambia status a IN_TRANSIT
   */
  markInTransit(resourceId: number): Observable<Resource> {
    return this.http.patch<Resource>(`${this.API_URL}/${resourceId}/in-transit`, {})
      .pipe(
        tap(resource => {
          console.log('Recurso en tránsito:', resource.id);
        }),
        catchError(error => {
          console.error('Error marcando en tránsito:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirmar entrega del recurso
   * Cambia status a DELIVERED, finaliza la transacción
   */
  confirmDelivery(resourceId: number): Observable<Resource> {
    return this.http.patch<Resource>(`${this.API_URL}/${resourceId}/deliver`, {})
      .pipe(
        tap(resource => {
          console.log('Recurso entregado:', resource.id);
        }),
        catchError(error => {
          console.error('Error confirmando entrega:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancelar un recurso (DONOR o RECEIVER)
   * Cambia status a CANCELLED
   */
  cancelResource(resourceId: number): Observable<Resource> {
    return this.http.patch<Resource>(`${this.API_URL}/${resourceId}/cancel`, {})
      .pipe(
        tap(resource => {
          console.log('Recurso cancelado:', resource.id);
        }),
        catchError(error => {
          console.error('Error cancelando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Actualizar información de un recurso (solo DONOR antes de ser reclamado)
   */
  updateResource(resourceId: number, resourceRequest: ResourceRequest): Observable<Resource> {
    return this.http.put<Resource>(`${this.API_URL}/${resourceId}`, resourceRequest)
      .pipe(
        tap(resource => {
          console.log('Recurso actualizado:', resource.id);
        }),
        catchError(error => {
          console.error('Error actualizando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Eliminar un recurso (solo DONOR antes de ser reclamado)
   */
  deleteResource(resourceId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${resourceId}`)
      .pipe(
        tap(() => {
          console.log('Recurso eliminado:', resourceId);
        }),
        catchError(error => {
          console.error('Error eliminando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Buscar recursos cercanos por ubicación
   * radius en kilómetros
   */
  searchNearbyResources(latitude: number, longitude: number, radius: number = 10): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/nearby`, {
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString()
      }
    })
    .pipe(
      catchError(error => {
        console.error('Error buscando recursos cercanos:', error);
        return throwError(() => error);
      })
    );
  }
}
