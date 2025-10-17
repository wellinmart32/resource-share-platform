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
  
  // Formulario reactivo de login
  loginForm: FormGroup;
  
  // Estados de la vista
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  
  // URL de retorno después del login exitoso
  returnUrl = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Inicializar formulario con validaciones
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // IMPORTANTE: Verificar PRIMERO si el usuario ya tiene sesión activa
    // Esto previene que se muestre la pantalla de login innecesariamente
    if (this.authService.isAuthenticated()) {
      console.log('✅ Usuario ya autenticado, redirigiendo a /home');
      // Usar replace:true para reemplazar la historia de navegación
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    console.log('ℹ️ Usuario no autenticado, mostrando pantalla de login');

    // Obtener URL de retorno de los parámetros de query (si existe)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    console.log('📍 Return URL configurada:', this.returnUrl);
  }

  /**
   * Procesa el inicio de sesión del usuario
   * Valida las credenciales con el backend y guarda el token
   */
  onSubmit() {
    // Validar que el formulario esté completo
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Preparar datos de login
    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    console.log('🚀 Iniciando sesión para:', loginRequest.email);

    // Enviar credenciales al backend
    this.authService.login(loginRequest).subscribe({
      next: (response: any) => {
        console.log('✅ Login exitoso, redirigiendo a:', this.returnUrl);
        this.isLoading = false;
        
        // Usar replaceUrl para evitar que el usuario vuelva al login con el botón "atrás"
        this.router.navigate([this.returnUrl], { replaceUrl: true });
      },
      error: (error: any) => {
        console.error('❌ Error en login:', error);
        this.isLoading = false;
        
        // Mostrar mensajes de error específicos según el código
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
   * Alterna la visibilidad de la contraseña
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
   * Marca todos los campos del formulario como tocados
   * Esto activa la visualización de errores de validación
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo específico tiene un error de validación
   * Solo retorna true si el campo ha sido tocado por el usuario
   */
  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }
}
