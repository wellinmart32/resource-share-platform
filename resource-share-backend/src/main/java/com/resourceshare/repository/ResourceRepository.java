package com.resourceshare.repository;

import com.resourceshare.entity.Resource;
import com.resourceshare.entity.User;
import com.resourceshare.enums.ResourceCategory;
import com.resourceshare.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para recursos donados
 * Incluye consultas por estado, categoría, donante y receptor
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    // Buscar recursos disponibles (para que los receptores vean)
    List<Resource> findByStatus(ResourceStatus status);

    // Buscar recursos por categoría
    List<Resource> findByCategory(ResourceCategory category);

    // Buscar recursos disponibles por categoría
    List<Resource> findByStatusAndCategory(ResourceStatus status, ResourceCategory category);

    // Buscar recursos de un donante específico
    List<Resource> findByDonor(User donor);

    // Buscar recursos de un donante por estado
    List<Resource> findByDonorAndStatus(User donor, ResourceStatus status);

    // Buscar recursos reclamados por un receptor
    List<Resource> findByReceiver(User receiver);

    // Buscar recursos de un receptor por estado
    List<Resource> findByReceiverAndStatus(User receiver, ResourceStatus status);

    // Contar recursos por donante
    long countByDonor(User donor);

    // Contar recursos entregados por donante
    long countByDonorAndStatus(User donor, ResourceStatus status);
}
