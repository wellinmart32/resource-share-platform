import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth/auth-service';
import { LoginRequest } from '../../core/models/auth/login-request.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    // Obtener URL de retorno si existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  /**
   * Procesa el login
   */
  onSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login exitoso');
        this.isLoading = false;
        
        // Redirigir según el rol
        if (this.authService.isDonor()) {
          this.router.navigate(['/donor-dashboard']);
        } else if (this.authService.isReceiver()) {
          this.router.navigate(['/receiver-dashboard']);
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta de nuevo';
        }
      }
    });
  }

  /**
   * Alterna visibilidad de la contraseña
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Navega a la página de registro
   */
  goToRegister() {
    this.router.navigate(['/register']);
  }

  /**
   * Marca todos los campos como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo tiene error y fue tocado
   */
  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }
}
