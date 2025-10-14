package com.resourceshare.dto;

import com.resourceshare.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Respuesta después de login o registro exitoso
 * Incluye token JWT y datos básicos del usuario
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private String message;
}
