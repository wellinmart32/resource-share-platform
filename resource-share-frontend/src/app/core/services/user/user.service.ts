import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/auth/user.model';
import { UserUpdateDTO } from '../../models/user/user-update.model';

/**
 * Servicio de gestión de perfil de usuario
 * Maneja obtención y actualización de información del usuario actual
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  private readonly API_URL = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la información completa del usuario actual desde el backend
   * Retorna todos los datos del perfil incluyendo email, nombre, teléfono, etc.
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/me`);
  }

  /**
   * Actualiza la información del usuario actual
   * Solo actualiza los campos proporcionados en el DTO (firstName, lastName, phone, address, city)
   * Los campos no incluidos en el request se mantienen sin cambios
   */
  updateCurrentUser(userUpdate: UserUpdateDTO): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/me`, userUpdate);
  }
}
