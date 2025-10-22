package com.resourceshare.service;

import com.resourceshare.dto.UserResponse;
import com.resourceshare.dto.UserUpdateRequest;
import com.resourceshare.entity.Donor;
import com.resourceshare.entity.User;
import com.resourceshare.enums.UserRole;
import com.resourceshare.repository.DonorRepository;
import com.resourceshare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio de gestión de usuarios
 * Maneja operaciones relacionadas con el perfil del usuario
 */
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DonorRepository donorRepository;

    /**
     * Obtiene un usuario por su email
     * Lanza excepción si el usuario no existe
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + email));
    }

    /**
     * Actualiza la información de un usuario
     * Solo actualiza los campos proporcionados en el DTO
     * Para donantes, también actualiza address y city en la tabla donors
     */
    @Transactional
    public User updateUser(String email, UserUpdateRequest userUpdateRequest) {
        User user = getUserByEmail(email);

        // Actualizar campos básicos del usuario
        if (userUpdateRequest.getFirstName() != null && !userUpdateRequest.getFirstName().trim().isEmpty()) {
            user.setFirstName(userUpdateRequest.getFirstName());
        }
        
        if (userUpdateRequest.getLastName() != null && !userUpdateRequest.getLastName().trim().isEmpty()) {
            user.setLastName(userUpdateRequest.getLastName());
        }
        
        if (userUpdateRequest.getPhone() != null && !userUpdateRequest.getPhone().trim().isEmpty()) {
            user.setPhone(userUpdateRequest.getPhone());
        }

        // Si es DONOR, actualizar también la información de ubicación en la tabla donors
        if (user.getRole() == UserRole.DONOR) {
            Donor donor = donorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Donante no encontrado para el usuario"));

            if (userUpdateRequest.getAddress() != null) {
                donor.setAddress(userUpdateRequest.getAddress());
            }

            if (userUpdateRequest.getCity() != null) {
                donor.setCity(userUpdateRequest.getCity());
            }

            donorRepository.save(donor);
            System.out.println("✅ Información de donante actualizada: " + email);
        }

        User savedUser = userRepository.save(user);
        System.out.println("✅ Usuario actualizado en BD: " + email);
        
        return savedUser;
    }

    /**
     * Convierte una entidad User a UserResponse
     * Incluye información de ubicación si es donante
     */
    public UserResponse convertToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setActive(user.isActive());
        response.setCreatedAt(user.getCreatedAt());

        // Si es DONOR, agregar información de ubicación
        if (user.getRole() == UserRole.DONOR) {
            donorRepository.findByUserId(user.getId()).ifPresent(donor -> {
                response.setAddress(donor.getAddress());
                response.setCity(donor.getCity());
            });
        }

        return response;
    }
}
