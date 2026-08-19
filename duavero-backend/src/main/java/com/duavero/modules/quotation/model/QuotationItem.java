package com.duavero.modules.quotation.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "quotation_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id", nullable = false)
    private Quotation quotation;

    @Builder.Default
    @Column(name = "item_type", nullable = false, length = 30)
    private String itemType = "PRODUCT";

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Column(name = "hsn_code", length = 30)
    private String hsnCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "specifications_json", columnDefinition = "JSON")
    private String specificationsJson;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Builder.Default
    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity = BigDecimal.ONE;

    @Builder.Default
    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_rate_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRatePercentage = new BigDecimal("18.00");

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
