package com.duavero.core.context;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Getter
@Setter
@MappedSuperclass
@FilterDef(
        name = "tenantFilter",
        parameters = @ParamDef(name = "tenantId", type = Long.class)
)
@Filter(
        name = "tenantFilter",
        condition = "tenant_id = :tenantId"
)
@EntityListeners(TenantEntityListener.class)
public abstract class BaseTenantEntity extends BaseAuditableEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private Long tenantId;
}
