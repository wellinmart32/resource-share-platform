import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { LoginRequest } from '../../models/auth/login-request.model';
import { RegisterRequest } from '../../models/auth/register-request.model';
import { AuthResponse } from '../../models/auth/auth-response.model';
import { User } from '../../models/auth/user.model';
import { UserRole } from '../../enums/user-role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkStoredAuth();
  }

  /**
   * Inicia sesión con email y contraseña
   * Guarda el token JWT y la información del usuario en localStorage
   */
  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    // 🧹 LIMPIAR DATOS ANTERIORES ANTES DE HACER LOGIN
    console.log('🧹 Limpiando sesión anterior antes de nuevo login');
    this.clearAllAuthData();
    
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          console.log('✅ Login exitoso:', response.email);
          console.log('📦 UserId recibido:', response.userId);
          
          this.saveAuthData(response.token, response);
          
          const user: User = {
            id: response.userId,
            role: response.role,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            phone: '',
            active: true
          };
          
          console.log('👤 Emitiendo nuevo usuario al BehaviorSubject:', user.email);
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Registra un nuevo usuario en la plataforma
   * Automáticamente inicia sesión después del registro exitoso
   */
  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerRequest)
      .pipe(
        tap(response => {
          this.saveAuthData(response.token, response);
          
          const user: User = {
            id: response.userId,
            role: response.role,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            phone: registerRequest.phone,
            active: true
          };
          
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cierra la sesión del usuario
   * Limpia todos los datos de autenticación del localStorage
   */
  logout(): void {
    console.log('🚪 Cerrando sesión del usuario');
    this.clearAllAuthData();
    console.log('✅ Sesión cerrada exitosamente');
  }

  /**
   * Limpia TODOS los datos de autenticación
   * Se usa tanto en logout como antes de un nuevo login
   */
  private clearAllAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    
    this.currentUserSubject.next(null);
    
    console.log('🗑️ Todos los datos de autenticación limpiados');
  }

  /**
   * Verifica si existe una sesión activa al cargar la aplicación
   * Restaura el usuario desde localStorage si el token es válido
   */
  private checkStoredAuth(): void {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');
    
    if (token && userId && userRole && userEmail) {
      const user: User = {
        id: parseInt(userId),
        role: userRole as UserRole,
        email: userEmail,
        firstName: localStorage.getItem('userFirstName') || '',
        lastName: localStorage.getItem('userLastName') || '',
        phone: '',
        active: true
      };
      
      this.currentUserSubject.next(user);
      console.log('♻️ Sesión restaurada desde localStorage:', userEmail);
    } else {
      console.log('ℹ️ No hay sesión previa para restaurar');
    }
  }

  /**
   * Guarda los datos de autenticación en localStorage
   * Incluye token JWT y información básica del usuario
   */
  private saveAuthData(token: string, authResponse: AuthResponse): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', authResponse.userId.toString());
    localStorage.setItem('userRole', authResponse.role);
    localStorage.setItem('userEmail', authResponse.email);
    localStorage.setItem('userFirstName', authResponse.firstName);
    localStorage.setItem('userLastName', authResponse.lastName);
    
    console.log('💾 Datos de autenticación guardados:', authResponse.email);
  }

  /**
   * Verifica si el usuario tiene una sesión activa
   * Retorna true si existe un token válido
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Obtiene el token JWT del usuario actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Obtiene el usuario actualmente autenticado desde el BehaviorSubject
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario actual es un donante
   */
  isDonor(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.DONOR;
  }

  /**
   * Verifica si el usuario actual es un receptor
   */
  isReceiver(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.RECEIVER;
  }

  /**
   * Obtiene el rol del usuario actual desde localStorage
   */
  getUserRole(): UserRole | null {
    const role = localStorage.getItem('userRole');
    return role as UserRole;
  }

  /**
   * Obtiene el ID del usuario actual desde localStorage
   */
  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }
}
