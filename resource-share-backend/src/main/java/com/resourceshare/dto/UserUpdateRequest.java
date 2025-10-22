package com.resourceshare.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para actualizar información del usuario
 * Contiene solo los campos editables del perfil
 * Se envía desde el frontend al backend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    
    @Size(min = 2, max = 50, message = "El nombre debe tener entre 2 y 50 caracteres")
    private String firstName;
    
    @Size(min = 2, max = 50, message = "El apellido debe tener entre 2 y 50 caracteres")
    private String lastName;
    
    @Pattern(regexp = "^[0-9]{10}$", message = "El teléfono debe tener exactamente 10 dígitos")
    private String phone;
    
    // Campos opcionales solo para DONOR
    @Size(max = 200, message = "La dirección no puede exceder 200 caracteres")
    private String address;
    
    @Size(max = 100, message = "La ciudad no puede exceder 100 caracteres")
    private String city;
}
