package com.resourceshare.controller;

import com.resourceshare.dto.UserResponse;
import com.resourceshare.dto.UserUpdateRequest;
import com.resourceshare.entity.User;
import com.resourceshare.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST de usuarios
 * Maneja operaciones relacionadas con el perfil del usuario actual
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100"})
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * GET /api/users/me
     * Obtiene la información completa del usuario actualmente autenticado
     * Retorna datos del perfil incluyendo nombre, email, teléfono, dirección, etc.
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('ROLE_DONOR') or hasRole('ROLE_RECEIVER')")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userService.getUserByEmail(email);
            UserResponse userResponse = userService.convertToResponse(user);
            
            System.out.println("✅ Información del usuario obtenida: " + email);
            return ResponseEntity.ok(userResponse);
        } catch (RuntimeException e) {
            System.out.println("❌ Error obteniendo usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/users/me
     * Actualiza la información del usuario actualmente autenticado
     * Permite modificar: firstName, lastName, phone, address (DONOR), city (DONOR)
     */
    @PutMapping("/me")
    @PreAuthorize("hasRole('ROLE_DONOR') or hasRole('ROLE_RECEIVER')")
    public ResponseEntity<?> updateCurrentUser(
            @Valid @RequestBody UserUpdateRequest userUpdateRequest,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User updatedUser = userService.updateUser(email, userUpdateRequest);
            UserResponse userResponse = userService.convertToResponse(updatedUser);
            
            System.out.println("✅ Usuario actualizado: " + email);
            return ResponseEntity.ok(userResponse);
        } catch (RuntimeException e) {
            System.out.println("❌ Error actualizando usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Clase interna para respuestas de error
     */
    private static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
