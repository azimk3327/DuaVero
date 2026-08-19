package com.duavero.modules.catalog.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "attribute_definitions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttributeDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 80)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "data_type", nullable = false, length = 30)
    private String dataType; // TEXT, NUMBER, DECIMAL, DROPDOWN, MULTI_SELECT, BOOLEAN, DATE, MEASUREMENT

    @Column(name = "unit_of_measure", length = 30)
    private String unitOfMeasure;

    @Column(name = "options_json", columnDefinition = "JSON")
    private String optionsJson;

    @Column(name = "validation_regex", length = 255)
    private String validationRegex;

    @Column(name = "is_required_default", nullable = false)
    private boolean requiredDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
