package com.resourceshare.repository;

import com.resourceshare.entity.User;
import com.resourceshare.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para operaciones de usuarios
 * Proporciona consultas personalizadas para autenticación y gestión de roles
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Buscar usuario por email (para login)
    Optional<User> findByEmail(String email);

    // Verificar si existe un email
    boolean existsByEmail(String email);

    // Buscar usuarios por rol
    List<User> findByRole(UserRole role);

    // Buscar usuarios activos
    List<User> findByActiveTrue();

    // Buscar usuarios por rol y estado activo
    List<User> findByRoleAndActiveTrue(UserRole role);
}
