import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth/auth-service';
import { RegisterRequest } from '../../core/models/auth/register-request.model';
import { UserRole } from '../../core/enums/user-role.enum';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class RegisterComponent implements OnInit {
  
  // Formulario reactivo de registro
  registerForm: FormGroup;
  
  // Estados de la vista
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  
  // Roles disponibles para seleccionar
  roles = [
    { value: UserRole.DONOR, label: 'Donante (Tengo recursos para donar)' },
    { value: UserRole.RECEIVER, label: 'Receptor (Necesito recursos)' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Inicializar formulario con validaciones
    this.registerForm = this.formBuilder.group({
      role: [UserRole.RECEIVER, Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      address: [''],
      city: ['']
    });
  }

  ngOnInit() {
    // Redirigir si el usuario ya tiene sesión activa
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }

    // Escuchar cambios en el rol para mostrar/ocultar campos opcionales
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.updateFieldsForRole(role);
    });
  }

  /**
   * Procesa el registro del usuario
   * Crea la cuenta en el backend y automáticamente inicia sesión
   */
  onSubmit() {
    // Validar que el formulario esté completo
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preparar datos de registro
    const registerRequest: RegisterRequest = this.registerForm.value;

    // Enviar datos al backend
    this.authService.register(registerRequest).subscribe({
      next: (response: any) => {
        console.log('Registro exitoso');
        this.isLoading = false;
        this.successMessage = 'Registro exitoso. Redirigiendo...';
        
        // Redirigir al home después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error en registro:', error);
        this.isLoading = false;
        
        // Mostrar mensajes de error específicos según el código
        if (error.status === 409 || error.status === 400) {
          this.errorMessage = 'El email ya está registrado';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor';
        } else {
          this.errorMessage = 'Error al registrar. Intenta de nuevo';
        }
      }
    });
  }

  /**
   * Actualiza la visibilidad de campos según el rol seleccionado
   * Los donantes pueden agregar ubicación opcional
   */
  private updateFieldsForRole(role: UserRole) {
    // Los campos de ubicación son opcionales para todos los roles
    // Esta función puede extenderse en el futuro si hay más campos específicos por rol
  }

  /**
   * Verifica si un campo debe mostrarse según el rol seleccionado
   * Actualmente los campos address y city son opcionales para donantes
   */
  shouldShowField(fieldName: string): boolean {
    const role = this.registerForm.get('role')?.value;
    
    // Mostrar campos de ubicación solo para donantes
    if (fieldName === 'address' || fieldName === 'city') {
      return role === UserRole.DONOR;
    }
    
    return true;
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Navega a la página de login
   */
  goToLogin() {
    this.router.navigate(['/login']);
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
    const control = this.registerForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }
}
