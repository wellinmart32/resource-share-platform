# Instrucciones de Desarrollo - Resource Share Platform

## 🎯 Objetivo del Proyecto
Plataforma web para conectar donantes de recursos con receptores que los necesitan.
Stack: Angular + Ionic + Bootstrap + Spring Boot

---

## 📁 Estructura de Archivos HTML (Angular + Ionic)

### ✅ Estructura OBLIGATORIA:
````html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/home"></ion-back-button>
    </ion-buttons>
    <ion-title>Título</ion-title>
    <ion-buttons slot="end">
      <!-- Botones adicionales -->
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="container-auth py-4">
    <!-- Contenido con Bootstrap -->
  </div>
</ion-content>
````

### 🎨 Diseño Bootstrap DENTRO de Ionic:

#### Clases de contenedor:
- `container-auth` → Para páginas de autenticación y formularios
- `container-fluid` → Para dashboards y listados

#### Cards:
- Todas las cards usan clase: `shadow-soft`
- Headers de cards con gradiente:
````html
  <div class="card shadow-soft mb-3">
    <div class="card-header text-white" style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);">
      <h5 class="card-title mb-0 d-flex align-items-center">
        <i class="bi bi-icon-name me-2"></i>
        Título
      </h5>
    </div>
    <div class="card-body">
      <!-- Contenido -->
    </div>
  </div>
````

#### Avatar circular:
````html
<div class="avatar-circle mb-3 mx-auto" 
     [style.background]="isDonor ? 'linear-gradient(135deg, #52C41A 0%, #389e0d 100%)' : 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)'">
  <i class="bi bi-icon-name text-white fs-1"></i>
</div>
````

#### Formularios:
- Inputs: `form-control form-control-lg`
- Labels: `form-label`
- Campos requeridos: `<span class="text-danger">*</span>`
- Campos readonly: agregar clase `bg-light`
- Validación: clase `is-invalid` cuando hay error

#### Botones:
- Botones grandes: `btn btn-primary btn-lg`
- Ancho completo: `d-grid gap-2`
- Con spinner: `<span class="spinner-border spinner-border-sm me-2"></span>`

#### Iconos:
- **Dentro del contenido**: Bootstrap Icons (`bi-`)
- **En Ionic toolbar**: Puede usar `<i class="bi-...">` también
- **Ejemplos comunes**:
  - `bi-person-circle` → Perfil
  - `bi-gift` → Donante
  - `bi-hand-thumbs-up` → Receptor
  - `bi-check-circle` → Éxito
  - `bi-exclamation-triangle` → Error
  - `bi-info-circle` → Información
  - `bi-pencil-square` → Editar

#### Alertas/Mensajes:
````html
<!-- Mensaje de éxito -->
<div class="alert alert-success d-flex align-items-center mb-3" role="alert" *ngIf="successMessage">
  <i class="bi bi-check-circle-fill me-2 icon-success"></i>
  <div>{{ successMessage }}</div>
</div>

<!-- Mensaje de error -->
<div class="alert alert-danger d-flex align-items-center mb-3" role="alert" *ngIf="errorMessage">
  <i class="bi bi-exclamation-triangle-fill me-2 icon-danger"></i>
  <div>{{ errorMessage }}</div>
</div>
````

#### Loading/Spinner:
````html
<div class="text-center py-5">
  <div class="spinner-border text-primary mb-3" role="status">
    <span class="visually-hidden">Cargando...</span>
  </div>
  <p class="text-muted">Cargando...</p>
</div>
````

#### Badges para roles:
````html
<span class="badge" [class.bg-success]="isDonor" [class.bg-primary]="!isDonor">
  <i [class]="isDonor ? 'bi bi-gift me-1' : 'bi bi-hand-thumbs-up me-1'"></i>
  {{ isDonor ? 'Donante' : 'Receptor' }}
</span>
````

### 📝 Comentarios en HTML:

**OBLIGATORIO**: Cada sección debe tener comentario descriptivo:
````html
<!-- Encabezado -->
<!-- Mensaje de éxito -->
<!-- Mensaje de error -->
<!-- Loading -->
<!-- Card: Información Personal -->
<!-- Card: Ubicación (solo para DONANTES) -->
<!-- Botones de acción -->
<!-- Formulario de búsqueda -->
<!-- Lista de recursos -->
````

---

## 💻 Estructura de Archivos TypeScript

### 📦 Orden de Imports (OBLIGATORIO):
````typescript
// 1. Angular Core
import { Component, OnInit } from '@angular/core';

// 2. Angular Common
import { CommonModule } from '@angular/common';

// 3. Angular Forms
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// 4. Angular Router
import { Router } from '@angular/router';

// 5. Ionic
import { IonicModule } from '@ionic/angular';

// 6. Servicios propios
import { AuthService } from '../core/services/auth/auth-service';
import { UserService } from '../core/services/user/user.service';

// 7. Modelos
import { User } from '../core/models/auth/user.model';
import { UserUpdateDTO } from '../core/models/user/user-update.model';

// 8. Enums
import { UserRole } from '../core/enums/user-role.enum';
````

### 📋 Estructura del Componente:
````typescript
/**
 * Descripción breve del componente
 * Funcionalidad principal
 * Características especiales si las hay
 */
@Component({
  selector: 'app-nombre',
  templateUrl: './nombre.component.html',
  styleUrls: ['./nombre.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class NombreComponent implements OnInit {
  
  // Formularios reactivos (si aplica)
  formName: FormGroup;
  
  // Estados de la vista
  isLoading = true;
  isSaving = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  
  // Datos del componente
  currentUser: User | null = null;
  items: any[] = [];
  
  // Flags booleanos
  isDonor = false;
  isReceiver = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Inicialización de formularios aquí si es necesario
  }

  ngOnInit() {
    console.log('🚀 [COMPONENTE] Inicializando componente');
    this.loadData();
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====

  /**
   * Descripción del método
   */
  private loadData() {
    // Implementación
  }

  // ===== MÉTODOS DE NAVEGACIÓN =====

  /**
   * Descripción del método
   */
  goToPage() {
    console.log('🔙 [COMPONENTE] Navegando a...');
    this.router.navigate(['/ruta']);
  }

  // ===== MÉTODOS DE VALIDACIÓN =====

  /**
   * Descripción del método
   */
  hasError(fieldName: string): boolean {
    // Implementación
  }

  // ===== MÉTODOS DE EDICIÓN =====
  
  // (Solo si el componente tiene funcionalidad de edición)
}
````

### 📝 Comentarios en TypeScript:

#### Secciones con separadores:
````typescript
// ===== NOMBRE DE LA SECCIÓN EN MAYÚSCULAS =====
````

**Secciones estándar** (usar según aplique):
- `// ===== MÉTODOS DE CARGA DE DATOS =====`
- `// ===== MÉTODOS DE NAVEGACIÓN =====`
- `// ===== MÉTODOS DE VALIDACIÓN =====`
- `// ===== MÉTODOS DE EDICIÓN =====`
- `// ===== MÉTODOS AUXILIARES =====`

#### Documentación de métodos:
````typescript
/**
 * Descripción breve del método
 * Explicación adicional si es necesaria
 * @param paramName - Descripción del parámetro (si aplica)
 * @returns Descripción del retorno (si aplica)
 */
````

### 🎯 Convenciones de nombres:

#### Variables booleanas:
- Prefijo `is` para estados: `isLoading`, `isEditing`, `isSaving`, `isVisible`
- Prefijo `has` para verificaciones: `hasError`, `hasData`
- Prefijo `show` para visibilidad: `showPassword`, `showModal`

#### Métodos:
- Métodos privados: `private methodName()`
- Métodos públicos: `methodName()` (sin prefijo)
- Nombres en **camelCase**
- Verbos de acción: `loadData()`, `saveProfile()`, `deleteItem()`

### 🐛 Logs de consola:

**OBLIGATORIO**: Usar emojis para facilitar debug:
````typescript
console.log('✅ [COMPONENTE] Operación exitosa');
console.log('❌ [COMPONENTE] Error en operación:', error);
console.log('🔙 [COMPONENTE] Navegando a...');
console.log('💾 [COMPONENTE] Guardando datos...');
console.log('👤 [COMPONENTE] Usuario cargado:', user.email);
console.log('⚠️ [COMPONENTE] Advertencia:');
console.log('🚀 [COMPONENTE] Inicializando...');
console.log('📋 [COMPONENTE] Datos obtenidos');
console.log('🗑️ [COMPONENTE] Eliminando...');
console.log('✏️ [COMPONENTE] Editando...');
````

**Formato**: `console.log('EMOJI [NOMBRE_COMPONENTE] Mensaje');`

---

## 🎨 Estilos (SCSS)

### ❌ NO usar archivos .scss individuales
- Dejar archivos `.scss` de componentes **VACÍOS**
- Todo el estilo se maneja con:
  - **Bootstrap** (clases utilitarias)
  - **global.scss** (estilos globales del proyecto)
  - **variables CSS** definidas en global.scss

### Variables CSS disponibles:
````css
--primary-color: #4A90E2
--primary-dark: #357ABD
--success-color: #52C41A
--danger-color: #F5222D
--warning-color: #FAAD14
--background-light: #F5F7FA
--text-dark: #333333
--text-light: #666666
--border-light: #E8E8E8
````

---

## 🎨 Paleta de Colores del Proyecto

### Roles:
- **Donante**: Verde → `#52C41A` (success)
- **Receptor**: Azul → `var(--primary-color)` o `#4A90E2`

### Estados:
- **Disponible**: Verde → `bg-success`
- **Reclamado**: Amarillo → `bg-warning text-dark`
- **En Tránsito**: Azul → `bg-primary`
- **Entregado**: Info → `bg-info`
- **Cancelado**: Rojo → `bg-danger`

---

## 📦 Entrega de Archivos

### ⚠️ IMPORTANTE - Formato de entrega:

**NUNCA generar archivos para descargar**

**SIEMPRE proporcionar**:
1. Código completo en bloque de código markdown
2. Listo para copiar y pegar
3. Con todos los comentarios incluidos
4. Sintaxis correcta e identación
5. Sin errores de tipeo

**Ejemplo de formato correcto**:
````markdown
Aquí está el archivo completo:
```typescript
import { Component } from '@angular/core';

// Código completo aquí...
```

Copia y pega este código en: `ruta/del/archivo.ts`
````

---

## 🔧 Validaciones de Formularios

### Patrones comunes:
````typescript
// Email
[Validators.required, Validators.email]

// Teléfono (10 dígitos)
[Validators.required, Validators.pattern(/^[0-9]{10}$/)]

// Texto simple
[Validators.required, Validators.minLength(2)]

// Contraseña
[Validators.required, Validators.minLength(6)]
````

### Mensajes de error:
````typescript
getErrorMessage(fieldName: string): string {
  const field = this.form.get(fieldName);
  
  if (field?.hasError('required')) {
    return 'Este campo es requerido';
  }
  if (field?.hasError('email')) {
    return 'Ingresa un email válido';
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
````

---

## 🚀 Navegación

### Usar Router de Angular:
````typescript
// Navegación simple
this.router.navigate(['/ruta']);

// Navegación con parámetros
this.router.navigate(['/ruta', id]);

// Navegación con query params
this.router.navigate(['/ruta'], { queryParams: { key: value } });
````

### Botón de regreso:
````html
<ion-back-button defaultHref="/home"></ion-back-button>
````

---

## 📱 Componentes Específicos del Proyecto

### HomePage:
- Container: `container-fluid`
- Avatar con rol dinámico
- Cards de estadísticas con gradientes

### Perfil:
- Container: `container-auth`
- Modo edición/vista
- Campos readonly con `bg-light`
- Botones solo visibles en modo edición

### Login/Register:
- Container: `container-auth`
- Avatar circular con icono
- Formularios con `form-control-lg`
- Toggle de contraseña visible

### Donantes:
- Color principal: Verde (`#52C41A`)
- Icono: `bi-gift`
- Campos adicionales: address, city

### Receptores:
- Color principal: Azul (`var(--primary-color)`)
- Icono: `bi-hand-thumbs-up`

---

## ✅ Checklist antes de entregar código

- [ ] Estructura Ionic correcta (`<ion-header>`, `<ion-content>`)
- [ ] Bootstrap dentro del contenido
- [ ] Comentarios HTML organizados
- [ ] Imports TypeScript en orden correcto
- [ ] Secciones TypeScript con separadores
- [ ] Logs con emojis y formato `[COMPONENTE]`
- [ ] Variables booleanas con prefijo correcto
- [ ] Código completo (no fragmentos)
- [ ] Sin errores de sintaxis
- [ ] Listo para copiar y pegar
- [ ] Archivo .scss vacío (si aplica)

---

## 🎓 Ejemplos de Referencia

Los siguientes componentes siguen correctamente estas guías:
- `home.page.html` / `home.page.ts`
- `login.component.html` / `login.component.ts`
- `register.component.html` / `register.component.ts`
- `profile.component.html` / `profile.component.ts`

**Siempre revisar estos componentes como referencia para mantener consistencia.**

---

## 📌 Notas Finales

- Este proyecto usa **Angular Standalone Components**
- No usar módulos (NgModule)
- Siempre importar `IonicModule` en componentes que usen Ionic
- Mantener consistencia visual en toda la aplicación
- Priorizar UX y feedback visual al usuario