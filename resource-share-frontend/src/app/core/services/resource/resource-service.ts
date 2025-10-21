import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Resource } from '../../models/resource/resource.model';
import { ResourceRequest } from '../../models/resource/resource-request.model';

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
   * Obtener recursos disponibles (para RECEIVER)
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
   * Obtener mis donaciones (solo DONOR)
   */
  getMyDonorResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.API_URL}/my-donations`)
      .pipe(
        catchError(error => {
          console.error('❌ Error obteniendo donaciones:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Obtener recursos reclamados del donante (solo DONOR)
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
   * Obtener mis recursos recibidos (solo RECEIVER)
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
   * Si autoConfirm=true pasa a IN_TRANSIT, si es false pasa a CLAIMED
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
   * Confirmar encuentro (solo DONOR)
   * Cambia de CLAIMED a IN_TRANSIT
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
   * Cambiar modo de confirmación (solo DONOR)
   * Alterna entre manual y automático
   */
  toggleAutoConfirm(resourceId: number): Observable<Resource> {
    return this.http.put<Resource>(`${this.API_URL}/${resourceId}/toggle-auto-confirm`, null)
      .pipe(
        tap(response => {
          console.log('✅ Modo de confirmación cambiado:', response.id);
        }),
        catchError(error => {
          console.error('❌ Error cambiando modo:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Confirmar entrega (solo RECEIVER)
   * Cambia de IN_TRANSIT a DELIVERED
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
   * Cancelar recurso (solo DONOR)
   * Solo se pueden cancelar recursos AVAILABLE o CLAIMED
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
