import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Resource } from '../../models/resource/resource.model';
import { ResourceRequest } from '../../models/resource/resource-request.model';
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
  publishResource(resourceRequest: ResourceRequest): Observable<Resource> {
    return this.http.post<Resource>(`${this.API_URL}`, resourceRequest)
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
    return this.http.post<Resource>(`${this.API_URL}/${resourceId}/claim`, null)
      .pipe(
        tap(response => {
          console.log('Recurso reclamado:', response.id);
        }),
        catchError(error => {
          console.error('Error reclamando recurso:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirmar la entrega de un recurso (solo RECEIVER)
   * El recurso cambia a status DELIVERED
   */
  confirmDelivery(resourceId: number): Observable<Resource> {
    return this.http.post<Resource>(`${this.API_URL}/${resourceId}/confirm-delivery`, null)
      .pipe(
        tap(response => {
          console.log('Entrega confirmada:', response.id);
        }),
        catchError(error => {
          console.error('Error confirmando entrega:', error);
          return throwError(() => error);
        })
      );
  }
}
