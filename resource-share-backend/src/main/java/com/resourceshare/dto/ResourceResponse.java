package com.resourceshare.dto;

import com.resourceshare.enums.ResourceCategory;
import com.resourceshare.enums.ResourceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Respuesta completa con datos de un recurso
 * Usado en GET /api/resources y otros endpoints
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceResponse {

    private Long id;
    private String title;
    private String description;
    private ResourceCategory category;
    private ResourceStatus status;

    private Long donorId;
    private String donorName;

    private Double latitude;
    private Double longitude;
    private String address;

    private Long receiverId;
    private String receiverName;

    private String imageUrl;

    private Boolean autoConfirm;

    private LocalDateTime createdAt;
    private LocalDateTime claimedAt;
    private LocalDateTime deliveredAt;
}
