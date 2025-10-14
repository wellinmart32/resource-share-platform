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
 * Maneja publicación, búsqueda, reclamación y entrega de recursos
 */
@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Publica un nuevo recurso (solo DONOR)
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
     */
    public List<ResourceResponse> getAvailableResources() {
        List<Resource> resources = resourceRepository.findByStatus(ResourceStatus.AVAILABLE);
        return resources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los recursos publicados por un donante
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
     * Obtiene un recurso por ID
     */
    public ResourceResponse getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));
        return mapToResponse(resource);
    }

    /**
     * Reclama un recurso (solo RECEIVER)
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

        resource.setReceiver(receiver);
        resource.setStatus(ResourceStatus.CLAIMED);
        resource.setClaimedAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    /**
     * Confirma la entrega de un recurso
     */
    @Transactional
    public ResourceResponse confirmDelivery(Long resourceId, String receiverEmail) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Recurso no encontrado"));

        User receiver = userRepository.findByEmail(receiverEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Receptor no encontrado"));

        if (resource.getReceiver() == null || !resource.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("No tienes permiso para confirmar esta entrega");
        }

        if (resource.getStatus() != ResourceStatus.CLAIMED) {
            throw new RuntimeException("El recurso no está en estado CLAIMED");
        }

        resource.setStatus(ResourceStatus.DELIVERED);
        resource.setDeliveredAt(LocalDateTime.now());

        Resource updatedResource = resourceRepository.save(resource);
        return mapToResponse(updatedResource);
    }

    /**
     * Convierte una entidad Resource a ResourceResponse DTO
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
