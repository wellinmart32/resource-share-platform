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
 * Controlador de recursos
 * Endpoints protegidos que requieren autenticación JWT
 */
@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100"})
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    /**
     * POST /api/resources
     * Publica un nuevo recurso (solo DONOR)
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
     * Obtiene todos los recursos disponibles (para RECEIVER)
     */
    @GetMapping("/available")
    public ResponseEntity<List<ResourceResponse>> getAvailableResources() {
        List<ResourceResponse> resources = resourceService.getAvailableResources();
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/my-donations
     * Obtiene los recursos publicados por el donante actual
     */
    @GetMapping("/my-donations")
    public ResponseEntity<List<ResourceResponse>> getMyDonations(Authentication authentication) {
        String donorEmail = authentication.getName();
        List<ResourceResponse> resources = resourceService.getMyDonorResources(donorEmail);
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/my-received
     * Obtiene los recursos reclamados por el receptor actual
     */
    @GetMapping("/my-received")
    public ResponseEntity<List<ResourceResponse>> getMyReceived(Authentication authentication) {
        String receiverEmail = authentication.getName();
        List<ResourceResponse> resources = resourceService.getMyReceivedResources(receiverEmail);
        return ResponseEntity.ok(resources);
    }

    /**
     * GET /api/resources/{id}
     * Obtiene el detalle de un recurso específico
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
     * PATCH /api/resources/{id}/deliver
     * Confirma la entrega de un recurso (solo RECEIVER que lo reclamó)
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
