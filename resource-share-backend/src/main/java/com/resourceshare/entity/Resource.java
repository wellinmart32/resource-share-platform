package com.resourceshare.entity;

import com.resourceshare.enums.ResourceCategory;
import com.resourceshare.enums.ResourceStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Recurso físico publicado por un donante
 * Contiene ubicación, categoría y estado del ciclo de donación
 */
@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El título es obligatorio")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "La descripción es obligatoria")
    @Column(length = 1000, nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceStatus status = ResourceStatus.AVAILABLE;

    @ManyToOne
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @NotNull(message = "La latitud es obligatoria")
    @Column(nullable = false)
    private Double latitude;

    @NotNull(message = "La longitud es obligatoria")
    @Column(nullable = false)
    private Double longitude;

    @Column(length = 500)
    private String address;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Column(length = 1000)
    private String imageUrl;

    @Column(name = "auto_confirm", nullable = false)
    private Boolean autoConfirm = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime claimedAt;

    private LocalDateTime deliveredAt;
}
