package com.resourceshare.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Información adicional específica de los donantes
 * Relacionada 1:1 con User cuando role = DONOR
 */
@Entity
@Table(name = "donors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Donor {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(nullable = false)
    private int totalDonations = 0;

    @Column(nullable = false)
    private int completedDonations = 0;
}
