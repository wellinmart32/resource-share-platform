package com.resourceshare.dto;

import com.resourceshare.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Respuesta con datos del usuario
 * Incluye información básica y campos específicos para donantes
 * Se envía desde el backend al frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private UserRole role;
    private boolean active;
    private LocalDateTime createdAt;
    
    // Campos opcionales específicos para DONOR (obtenidos de la tabla donors)
    private String address;
    private String city;
}
