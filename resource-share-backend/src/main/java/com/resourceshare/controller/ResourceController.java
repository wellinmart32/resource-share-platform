package com.resourceshare.controller;

import com.resourceshare.dto.ResourceRequest;
import com.resourceshare.dto.ResourceResponse;
import com.resourceshare.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST de recursos
 * Maneja todas las operaciones relacionadas con recursos donados
 * Todos los endpoints requieren autenticación JWT excepto los públicos
 */
@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100"})
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    /**
     * POST /api/resources
     * Publica un nuevo recurso para donación (solo DONOR)
     * El recurso se crea con estado AVAILABLE
     */
    @PostMapping
    public ResponseEntity<?> publishResource(
            @Valid @RequestBody ResourceRequest request,
            Authentication authentication) {
        try {
            String donorEmail = authentication.getName();
            ResourceResponse response = resourceService.publishResource(request, donorEmail);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/resources/available
     * Obtiene todos los recursos disponibles para reclamar (para RECEIVER)
     * Solo retorna recursos con estado AVAILABLE
     */
    @GetMapping("/available")
    public ResponseEntity<List<ResourceResponse>> getAvailableResources() {
        List<ResourceResponse> resources = resourceService.getAvailableResources();
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/my-donations
     * Obtiene todos los recursos publicados por el donante actual
     * Incluye recursos en cualquier estado (AVAILABLE, CLAIMED, IN_TRANSIT, DELIVERED, CANCELLED)
     */
    @GetMapping("/my-donations")
    public ResponseEntity<List<ResourceResponse>> getMyDonations(Authentication authentication) {
        String donorEmail = authentication.getName();
        List<ResourceResponse> resources = resourceService.getMyDonorResources(donorEmail);
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/donor/claimed
     * Obtiene los recursos que han sido reclamados pero aún no confirmados por el donante
     * Solo retorna recursos en estado CLAIMED del donante actual
     * Usado para que el donante vea quién reclamó sus recursos y pueda confirmar el encuentro
     */
    @GetMapping("/donor/claimed")
    public ResponseEntity<List<ResourceResponse>> getClaimedResourcesByDonor(Authentication authentication) {
        String donorEmail = authentication.getName();
        List<ResourceResponse> resources = resourceService.getClaimedResourcesByDonor(donorEmail);
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/my-received
     * Obtiene los recursos reclamados por el receptor actual
     * Incluye recursos en estado CLAIMED, IN_TRANSIT y DELIVERED
     */
    @GetMapping("/my-received")
    public ResponseEntity<List<ResourceResponse>> getMyReceived(Authentication authentication) {
        String receiverEmail = authentication.getName();
        List<ResourceResponse> resources = resourceService.getMyReceivedResources(receiverEmail);
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/{id}
     * Obtiene el detalle completo de un recurso específico por ID
     * Incluye información del donante y receptor (si aplica)
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getResourceById(@PathVariable Long id) {
        try {
            ResourceResponse resource = resourceService.getResourceById(id);
            return ResponseEntity.ok(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Recurso no encontrado"));
        }
    }

    /**
     * POST /api/resources/{id}/claim
     * Reclama un recurso disponible (solo RECEIVER)
     * Cambia el estado del recurso según configuración:
     * - Si autoConfirm = true: pasa directo a IN_TRANSIT
     * - Si autoConfirm = false: pasa a CLAIMED
     */
    @PostMapping("/{id}/claim")
    public ResponseEntity<?> claimResource(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String receiverEmail = authentication.getName();
            ResourceResponse response = resourceService.claimResource(id, receiverEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/resources/{id}/confirm-pickup
     * Confirma el encuentro entre donante y receptor (solo DONOR)
     * Cambia el estado del recurso de CLAIMED a IN_TRANSIT
     * Solo aplica para recursos con confirmación manual
     */
    @PutMapping("/{id}/confirm-pickup")
    public ResponseEntity<?> confirmPickup(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String donorEmail = authentication.getName();
            ResourceResponse response = resourceService.confirmPickup(id, donorEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/resources/{id}/toggle-auto-confirm
     * Cambia el modo de confirmación de un recurso (solo DONOR que lo publicó)
     * Permite activar/desactivar la confirmación automática
     * Solo se puede cambiar si el recurso está en estado AVAILABLE
     */
    @PutMapping("/{id}/toggle-auto-confirm")
    public ResponseEntity<?> toggleAutoConfirm(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String donorEmail = authentication.getName();
            ResourceResponse response = resourceService.toggleAutoConfirm(id, donorEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * PATCH /api/resources/{id}/deliver
     * Confirma la entrega exitosa de un recurso (solo RECEIVER que lo reclamó)
     * Cambia el estado del recurso de IN_TRANSIT a DELIVERED
     * Registra la fecha de entrega final
     */
    @PatchMapping("/{id}/deliver")
    public ResponseEntity<?> confirmDelivery(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String receiverEmail = authentication.getName();
            ResourceResponse response = resourceService.confirmDelivery(id, receiverEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }
    
    /**
     * DELETE /api/resources/{id}/cancel
     * Cancela un recurso publicado (solo DONOR que lo publicó)
     * Solo se pueden cancelar recursos en estado AVAILABLE o CLAIMED
     * Los recursos en IN_TRANSIT o DELIVERED no pueden ser cancelados
     */
    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<?> cancelResource(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String donorEmail = authentication.getName();
            ResourceResponse response = resourceService.cancelResource(id, donorEmail);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * Clase interna para respuestas de error
     * Retorna un mensaje de error en formato JSON consistente
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
