package com.duavero.modules.catalog.controller;

import com.duavero.core.exception.ResourceNotFoundException;
import com.duavero.core.exception.UnauthorizedException;
import com.duavero.core.response.ApiResponse;
import com.duavero.core.security.UserPrincipal;
import com.duavero.modules.catalog.dto.CreateProductRequest;
import com.duavero.modules.catalog.dto.ProductDto;
import com.duavero.modules.catalog.model.Product;
import com.duavero.modules.catalog.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tenant/products")
@RequiredArgsConstructor
@Tag(name = "Tenant Products", description = "Tenant Catalog & Product Operations with Strict Server-Side Isolation")
public class TenantProductController {

    private final ProductRepository productRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('TENANT_ADMIN') or hasRole('TENANT_STAFF') or hasRole('TENANT_MANAGER') or hasRole('TENANT_EMPLOYEE')")
    @Operation(summary = "List all products in current tenant workspace")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getProducts(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            throw new UnauthorizedException("Tenant context required.");
        }

        List<ProductDto> products = productRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Tenant products retrieved", products, correlationId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_VIEW') or hasRole('TENANT_ADMIN') or hasRole('TENANT_STAFF') or hasRole('TENANT_MANAGER') or hasRole('TENANT_EMPLOYEE')")
    @Operation(summary = "Get product details by ID (enforcing strict tenant boundary)")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId();
        if (tenantId == null) {
            throw new UnauthorizedException("Tenant context required.");
        }

        // Strict Tenant Isolation: Only find products belonging to caller's tenant
        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        return ResponseEntity.ok(ApiResponse.ok("Product retrieved", mapToDto(product), correlationId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "Create product in tenant workspace (ignores any forged tenantId in body)")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long authenticatedTenantId = currentUser.getTenantId();
        if (authenticatedTenantId == null) {
            throw new UnauthorizedException("Tenant context required.");
        }

        // CRITICAL SECURITY RULE: Never trust client-supplied tenantId. Server-side context is authoritative.
        String slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + UUID.randomUUID().toString().substring(0, 6);
        String sku = request.getSku() != null && !request.getSku().isBlank()
                ? request.getSku().trim()
                : "SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Product product = Product.builder()
                .tenantId(authenticatedTenantId) // ALWAYS authenticated tenant
                .categoryId(request.getCategoryId())
                .brandId(request.getBrandId())
                .name(request.getName().trim())
                .slug(slug)
                .sku(sku)
                .shortDescription(request.getShortDescription())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .discountPercentage(request.getDiscountPercentage())
                .taxRatePercentage(request.getTaxRatePercentage())
                .warrantyMonths(request.getWarrantyMonths())
                .available(true)
                .featured(false)
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "PUBLISHED")
                .build();

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok("Product created in tenant workspace", mapToDto(saved), correlationId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "Delete product in tenant workspace")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {

        String correlationId = httpRequest.getHeader("X-Correlation-ID");
        Long tenantId = currentUser.getTenantId();

        Product product = productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        productRepository.delete(product);
        return ResponseEntity.ok(ApiResponse.ok("Product deleted successfully", null, correlationId));
    }

    private ProductDto mapToDto(Product p) {
        return ProductDto.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .categoryId(p.getCategoryId())
                .brandId(p.getBrandId())
                .name(p.getName())
                .slug(p.getSlug())
                .sku(p.getSku())
                .shortDescription(p.getShortDescription())
                .description(p.getDescription())
                .basePrice(p.getBasePrice())
                .discountPercentage(p.getDiscountPercentage())
                .taxRatePercentage(p.getTaxRatePercentage())
                .warrantyMonths(p.getWarrantyMonths())
                .available(p.isAvailable())
                .featured(p.isFeatured())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
