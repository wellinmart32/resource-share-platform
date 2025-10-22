import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/services/auth/auth-service';
import { UserService } from '../core/services/user/user.service';
import { User } from '../core/models/auth/user.model';
import { UserUpdateDTO } from '../core/models/user/user-update.model';
import { UserRole } from '../core/enums/user-role.enum';

/**
 * Componente de perfil de usuario
 * Permite ver y editar la información personal del usuario actual
 * Incluye campos específicos para donantes (address, city)
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class ProfileComponent implements OnInit {
  
  // Formulario reactivo de perfil
  profileForm: FormGroup;
  
  // Estados de la vista
  isLoading = true;
  isSaving = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  
  // Datos del usuario
  currentUser: User | null = null;
  isDonor = false;
  isReceiver = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    // Inicializar formulario con validaciones
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}], // Email no se puede editar
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: [{value: '', disabled: true}], // Rol no se puede editar
      address: [''],
      city: ['']
    });
  }

  ngOnInit() {
    console.log('👤 Inicializando componente de perfil');
    this.loadUserProfile();
  }

  /**
   * Carga el perfil del usuario desde el backend
   * Obtiene los datos actualizados y los muestra en el formulario
   */
  private loadUserProfile() {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        console.log('✅ Perfil cargado:', user.email);
        this.currentUser = user;
        this.isDonor = user.role === UserRole.DONOR;
        this.isReceiver = user.role === UserRole.RECEIVER;
        
        // Llenar el formulario con los datos del usuario
        this.populateForm(user);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando perfil:', error);
        this.errorMessage = 'Error al cargar el perfil. Por favor intenta de nuevo.';
        this.isLoading = false;
        
        // Si hay error, usar datos del localStorage como respaldo
        this.loadUserFromLocalStorage();
      }
    });
  }

  /**
   * Llena el formulario con los datos del usuario
   * Incluye campos opcionales para donantes
   */
  private populateForm(user: User) {
    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: this.getRoleLabel(user.role),
      address: user.address || '',
      city: user.city || ''
    });
    
    // Deshabilitar el formulario inicialmente
    this.profileForm.disable();
  }

  /**
   * Carga datos básicos del usuario desde localStorage como respaldo
   * Se usa cuando falla la petición al backend
   */
  private loadUserFromLocalStorage() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.isDonor = user.role === UserRole.DONOR;
      this.isReceiver = user.role === UserRole.RECEIVER;
      this.populateForm(user);
    } else {
      // Si no hay usuario, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  /**
   * Obtiene la etiqueta legible del rol del usuario
   */
  private getRoleLabel(role: UserRole): string {
    switch(role) {
      case UserRole.DONOR:
        return 'Donante';
      case UserRole.RECEIVER:
        return 'Receptor';
      default:
        return 'Usuario';
    }
  }

  /**
   * Habilita el modo de edición del formulario
   * Permite modificar los campos editables
   */
  enableEdit() {
    console.log('✏️ Habilitando edición de perfil');
    this.isEditing = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Habilitar solo campos editables
    this.profileForm.get('firstName')?.enable();
    this.profileForm.get('lastName')?.enable();
    this.profileForm.get('phone')?.enable();
    
    // Si es donante, habilitar campos adicionales
    if (this.isDonor) {
      this.profileForm.get('address')?.enable();
      this.profileForm.get('city')?.enable();
    }
  }

  /**
   * Cancela el modo de edición y restaura los valores originales
   */
  cancelEdit() {
    console.log('❌ Cancelando edición de perfil');
    this.isEditing = false;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Restaurar valores originales y deshabilitar formulario
    if (this.currentUser) {
      this.populateForm(this.currentUser);
    }
    this.profileForm.disable();
  }

  /**
   * Guarda los cambios del perfil en el backend
   * Valida el formulario antes de enviar
   */
  saveProfile() {
    // Validar formulario
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Preparar datos para actualizar
    const updateData: UserUpdateDTO = {
      firstName: this.profileForm.get('firstName')?.value,
      lastName: this.profileForm.get('lastName')?.value,
      phone: this.profileForm.get('phone')?.value
    };

    // Agregar campos opcionales para donantes
    if (this.isDonor) {
      updateData.address = this.profileForm.get('address')?.value;
      updateData.city = this.profileForm.get('city')?.value;
    }

    console.log('💾 Guardando perfil:', updateData);

    // Enviar actualización al backend
    this.userService.updateCurrentUser(updateData).subscribe({
      next: (updatedUser: User) => {
        console.log('✅ Perfil actualizado exitosamente');
        this.currentUser = updatedUser;
        this.successMessage = 'Perfil actualizado exitosamente';
        this.isSaving = false;
        this.isEditing = false;
        
        // Actualizar localStorage con los nuevos datos
        this.updateLocalStorage(updatedUser);
        
        // Deshabilitar formulario y mostrar nuevos valores
        this.populateForm(updatedUser);
        this.profileForm.disable();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error actualizando perfil:', error);
        this.isSaving = false;
        
        // Mensajes de error específicos
        if (error.status === 400) {
          this.errorMessage = 'Datos inválidos. Por favor verifica la información.';
        } else if (error.status === 401) {
          this.errorMessage = 'Sesión expirada. Por favor inicia sesión de nuevo.';
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = 'Error al actualizar el perfil. Por favor intenta de nuevo.';
        }
      }
    });
  }

  /**
   * Actualiza los datos del usuario en localStorage
   * Sincroniza la información local con los datos actualizados del backend
   */
  private updateLocalStorage(user: User) {
    localStorage.setItem('userFirstName', user.firstName);
    localStorage.setItem('userLastName', user.lastName);
    console.log('💾 LocalStorage actualizado con nuevos datos');
  }

  /**
   * Marca todos los campos del formulario como tocados
   * Útil para mostrar errores de validación
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Verifica si un campo tiene errores y ha sido tocado
   */
  hasError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Obtiene el mensaje de error específico para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }
    if (field?.hasError('pattern')) {
      if (fieldName === 'phone') {
        return 'Debe tener exactamente 10 dígitos';
      }
    }
    
    return 'Campo inválido';
  }

  /**
   * Navega de regreso a la página principal
   */
  goBack() {
    this.router.navigate(['/home']);
  }
}
