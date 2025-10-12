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
  
  // BehaviorSubject permite a otros componentes suscribirse a cambios del usuario
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkStoredAuth();
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          this.saveAuthData(response.jwt, response);
          
          const user: User = {
            id: response.userId,
            role: response.role,
            email: response.email,
            firstName: '',
            lastName: '',
            phone: '',
            active: true
          };
          
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          console.error('Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, registerRequest)
      .pipe(
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    this.currentUserSubject.next(null);
  }

  /**
   * Verifica si hay sesión guardada al cargar la app
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
        firstName: '',
        lastName: '',
        phone: '',
        active: true
      };
      
      this.currentUserSubject.next(user);
    }
  }

  private saveAuthData(token: string, response: AuthResponse): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', response.userId.toString());
    localStorage.setItem('userRole', response.role);
    localStorage.setItem('userEmail', response.email);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }

  getCurrentUserRole(): UserRole | null {
    const role = localStorage.getItem('userRole');
    return role as UserRole | null;
  }

  isDonor(): boolean {
    return this.getCurrentUserRole() === UserRole.DONOR;
  }

  isReceiver(): boolean {
    return this.getCurrentUserRole() === UserRole.RECEIVER;
  }

  isAdmin(): boolean {
    return this.getCurrentUserRole() === UserRole.ADMIN;
  }
}
