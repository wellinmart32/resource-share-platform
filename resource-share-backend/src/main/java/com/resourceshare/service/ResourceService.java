package com.resourceshare.service;

import com.resourceshare.dto.ResourceRequest;
import com.resourceshare.dto.ResourceResponse;
import com.resourceshare.entity.Resource;
import com.resourceshare.entity.User;
import com.resourceshare.enums.ResourceStatus;
import com.resourceshare.repository.ResourceRepository;
import com.resourceshare.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de gestión de recursos donados
 * Maneja publicación, búsqueda, reclamación, entrega y flujo completo de donaciones
 */
@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Publica un nuevo recurso (solo DONOR)
     * El recurso se crea con estado AVAILABLE y puede ser reclamado por receptores
     */
    @Transactional
    public ResourceResponse publishResource(ResourceRequest request, String donorEmail) {
        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Donante no encontrado"));

        Resource resource = new Resource();
        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());
        resource.setCategory(request.getCategory());
        resource.setStatus(ResourceStatus.AVAILABLE);
        resource.setDonor(donor);
        resource.setLatitude(request.getLatitude());
        resource.setLongitude(request.getLongitude());
        resource.setAddress(request.getAddress());
        resource.setImageUrl(request.getImageUrl());

        Resource savedResource = resourceRepository.save(resource);

        return mapToResponse(savedResource);
    }

    /**
     * Obtiene todos los recursos disponibles (para RECEIVER)
     * Solo retorna recursos con estado AVAILABLE que pueden ser reclamados
     */
    public List<ResourceResponse> getAvailableResources() {
        List<Resource> resources = resourceRepository.findByStatus(ResourceStatus.AVAILABLE);
        return resources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los recursos publicados por un donante
     * Retorna todos los recursos del donante independientemente de su estado
     */
    public List<ResourceResponse> getMyDonorResources(String donorEmail) {
        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Donante no encontrado"));

        List<Resource> resources = resourceRepository.findByDonor(donor);
        return resources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los recursos reclamados por un receptor
     * Retorna recursos en cualquier estado posterior a AVAILABLE (CLAIMED, IN_TRANSIT, DELIVERED)
     */
    public List<ResourceResponse> getMyReceivedResources(String receiverEmail) {
        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Receptor no encontrado"));

        List<Resource> resources = resourceRepository.findByReceiver(receiver);
        return resources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los recursos en estado CLAIMED del donante actual
     * Muestra recursos que fueron reclamados pero aún no confirmados por el donante
     */
    public List<ResourceResponse> getClaimedResourcesByDonor(String donorEmail) {
        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Donante no encontrado"));

        List<Resource> resources = resourceRepository.findByDonorAndStatus(donor, ResourceStatus.CLAIMED);
        return resources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un recurso por ID
     * Retorna el detalle completo de un recurso específico
     */
    public ResourceResponse getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));
        return mapToResponse(resource);
    }

    /**
     * Reclama un recurso (solo RECEIVER)
     * Cambia el estado de AVAILABLE a CLAIMED y asigna el receptor
     */
    @Transactional
    public ResourceResponse claimResource(Long resourceId, String receiverEmail) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));

        if (resource.getStatus() != ResourceStatus.AVAILABLE) {
            throw new RuntimeException("El recurso no está disponible");
        }

        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Receptor no encontrado"));

        // Asignar receptor y cambiar estado a CLAIMED
        resource.setReceiver(receiver);
        resource.setStatus(ResourceStatus.CLAIMED);
        resource.setClaimedAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    /**
     * Confirma el encuentro entre donante y receptor (solo DONOR)
     * Cambia el estado de CLAIMED a IN_TRANSIT indicando que el recurso está en proceso de entrega
     * Solo el donante que publicó el recurso puede confirmar el encuentro
     */
    @Transactional
    public ResourceResponse confirmPickup(Long resourceId, String donorEmail) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));

        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Donante no encontrado"));

        // Verificar que el recurso pertenece al donante que intenta confirmar
        if (!resource.getDonor().getId().equals(donor.getId())) {
            throw new RuntimeException("No tienes permiso para confirmar este recurso");
        }

        // Validar que el recurso está en estado CLAIMED
        if (resource.getStatus() != ResourceStatus.CLAIMED) {
            throw new RuntimeException("El recurso debe estar en estado CLAIMED para confirmar el encuentro");
        }

        // Cambiar estado a IN_TRANSIT
        resource.setStatus(ResourceStatus.IN_TRANSIT);

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    /**
     * Confirma la entrega de un recurso (solo RECEIVER)
     * Cambia el estado de IN_TRANSIT a DELIVERED indicando que el recurso fue entregado exitosamente
     * Solo el receptor que reclamó el recurso puede confirmar la entrega
     */
    @Transactional
    public ResourceResponse confirmDelivery(Long resourceId, String receiverEmail) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));

        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Receptor no encontrado"));

        // Verificar que el recurso fue reclamado por el receptor que intenta confirmar
        if (resource.getReceiver() == null || !resource.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("No tienes permiso para confirmar esta entrega");
        }

        // CORREGIDO: Validar que el recurso está en estado IN_TRANSIT (no CLAIMED)
        if (resource.getStatus() != ResourceStatus.IN_TRANSIT) {
            throw new RuntimeException("El recurso debe estar en estado IN_TRANSIT para confirmar la entrega");
        }

        // Cambiar estado a DELIVERED y registrar fecha de entrega
        resource.setStatus(ResourceStatus.DELIVERED);
        resource.setDeliveredAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }
    
    /**
     * Cancela un recurso (solo DONOR que lo publicó)
     * Solo se pueden cancelar recursos en estado AVAILABLE o CLAIMED
     * No se pueden cancelar recursos en IN_TRANSIT o DELIVERED
     */
    @Transactional
    public ResourceResponse cancelResource(Long resourceId, String donorEmail) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));

        User donor = userRepository.findByEmail(donorEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Donante no encontrado"));

        // Verificar que el recurso pertenece al donante que intenta cancelarlo
        if (!resource.getDonor().getId().equals(donor.getId())) {
            throw new RuntimeException("No tienes permiso para cancelar este recurso");
        }

        // Solo se pueden cancelar recursos AVAILABLE o CLAIMED
        if (resource.getStatus() != ResourceStatus.AVAILABLE && 
            resource.getStatus() != ResourceStatus.CLAIMED) {
            throw new RuntimeException("No se puede cancelar un recurso en estado " + resource.getStatus());
        }

        // Cambiar estado a CANCELLED y registrar fecha
        resource.setStatus(ResourceStatus.CANCELLED);
        resource.setDeliveredAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    /**
     * Convierte una entidad Resource a ResourceResponse DTO
     * Mapea todos los campos incluyendo información del donante y receptor
     */
    private ResourceResponse mapToResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .category(resource.getCategory())
                .status(resource.getStatus())
                .donorId(resource.getDonor().getId())
                .donorName(resource.getDonor().getFirstName() + " " + resource.getDonor().getLastName())
                .latitude(resource.getLatitude())
                .longitude(resource.getLongitude())
                .address(resource.getAddress())
                .receiverId(resource.getReceiver() != null ? resource.getReceiver().getId() : null)
                .receiverName(resource.getReceiver() != null 
                        ? resource.getReceiver().getFirstName() + " " + resource.getReceiver().getLastName() 
                        : null)
                .imageUrl(resource.getImageUrl())
                .createdAt(resource.getCreatedAt())
                .claimedAt(resource.getClaimedAt())
                .deliveredAt(resource.getDeliveredAt())
                .build();
    }
}
