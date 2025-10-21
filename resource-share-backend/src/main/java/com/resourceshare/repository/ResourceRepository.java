package com.resourceshare.repository;

import com.resourceshare.entity.Resource;
import com.resourceshare.entity.User;
import com.resourceshare.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de recursos
 * Proporciona métodos para acceder a la tabla resources en la base de datos
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    /**
     * Busca todos los recursos con un estado específico
     * Usado para obtener recursos disponibles, en tránsito, etc.
     */
    List<Resource> findByStatus(ResourceStatus status);

    /**
     * Busca todos los recursos publicados por un donante específico
     * Retorna recursos en cualquier estado del donante
     */
    List<Resource> findByDonor(User donor);

    /**
     * Busca todos los recursos reclamados por un receptor específico
     * Retorna recursos que tienen asignado un receptor
     */
    List<Resource> findByReceiver(User receiver);

    /**
     * Busca recursos de un donante específico filtrados por estado
     * Usado para obtener recursos CLAIMED de un donante
     */
    List<Resource> findByDonorAndStatus(User donor, ResourceStatus status);

    /**
     * Busca recursos de un receptor específico filtrados por estado
     * Útil para obtener recursos IN_TRANSIT o CLAIMED de un receptor
     */
    List<Resource> findByReceiverAndStatus(User receiver, ResourceStatus status);
}
