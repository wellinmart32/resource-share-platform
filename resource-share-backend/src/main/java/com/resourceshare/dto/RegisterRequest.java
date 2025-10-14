package com.resourceshare.dto;

import com.resourceshare.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Datos de entrada para registro de usuario
 * Enviado desde el frontend al endpoint POST /api/auth/register
 * Si el rol es DONOR, address y city son opcionales
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    @NotBlank(message = "El nombre es obligatorio")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    private String lastName;

    @NotBlank(message = "El teléfono es obligatorio")
    private String phone;

    @NotNull(message = "El rol es obligatorio")
    private UserRole role;

    // Solo para DONOR
    private String address;
    private String city;
}
