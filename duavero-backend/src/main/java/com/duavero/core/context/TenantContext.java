package com.duavero.core.context;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantContext {

    private Long tenantId;

    private Long userId;

    private String userType;

    @Builder.Default
    private Set<String> roles = Collections.emptySet();

    @Builder.Default
    private Set<String> permissions = Collections.emptySet();

    @Builder.Default
    private boolean superAdminScope = false;

    @Builder.Default
    private boolean systemContext = false;

    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }

    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }
}
