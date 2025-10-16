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
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  
  roles = [
    { value: UserRole.DONOR, label: 'Donante (Tengo recursos para donar)' },
    { value: UserRole.RECEIVER, label: 'Receptor (Necesito recursos)' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
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
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }

    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.updateFieldsForRole(role);
    });
  }

  /**
   * Procesa el registro del usuario
   */
  onSubmit() {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerRequest: RegisterRequest = this.registerForm.value;

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        console.log('Registro exitoso');
        this.isLoading = false;
        this.successMessage = 'Registro exitoso. Redirigiendo...';
        
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        this.isLoading = false;
        
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
   * Ajusta validaciones según el rol seleccionado
   */
  private updateFieldsForRole(role: UserRole) {
    const addressControl = this.registerForm.get('address');
    const cityControl = this.registerForm.get('city');

    if (role === UserRole.DONOR) {
      addressControl?.setValidators([]);
      cityControl?.setValidators([]);
    } else {
      addressControl?.setValidators([]);
      cityControl?.setValidators([]);
    }

    addressControl?.updateValueAndValidity();
    cityControl?.updateValueAndValidity();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control?.hasError(error) && control?.touched);
  }

  /**
   * Verifica si se debe mostrar un campo según el rol
   */
  shouldShowField(field: string): boolean {
    const role = this.registerForm.get('role')?.value;
    
    if (field === 'address' || field === 'city') {
      return role === UserRole.DONOR;
    }
    
    return true;
  }
}
