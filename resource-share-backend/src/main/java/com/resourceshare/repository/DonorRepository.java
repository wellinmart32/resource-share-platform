package com.resourceshare.repository;

import com.resourceshare.entity.Donor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para información adicional de donantes
 * Relación 1:1 con User
 */
@Repository
public interface DonorRepository extends JpaRepository<Donor, Long> {

    // Buscar donante por ID de usuario
    Optional<Donor> findByUserId(Long userId);

    // Buscar donante por ciudad
    Optional<Donor> findByCity(String city);
}
