package com.resourceshare.enums;

/**
 * Estados del ciclo de vida de un recurso donado
 * AVAILABLE: disponible para ser reclamado
 * CLAIMED: ya fue reclamado por un receptor
 * IN_TRANSIT: en proceso de entrega
 * DELIVERED: entregado exitosamente
 * CANCELLED: donación cancelada
 */
public enum ResourceStatus {
    AVAILABLE,
    CLAIMED,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED
}
