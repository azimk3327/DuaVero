package com.duavero.modules.catalog.model;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "category_attributes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryAttribute {

    @EmbeddedId
    private CategoryAttributeId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("categoryId")
    @JoinColumn(name = "category_id")
    private MasterCategory category;

    @ManyToOne(fetch = FetchType.EAGER)
    @MapsId("attributeId")
    @JoinColumn(name = "attribute_id")
    private AttributeDefinition attribute;

    @Column(name = "is_required", nullable = false)
    private boolean required = false;

    @Column(name = "is_filterable", nullable = false)
    private boolean filterable = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class CategoryAttributeId implements Serializable {
        private Long categoryId;
        private Long attributeId;
    }
}
