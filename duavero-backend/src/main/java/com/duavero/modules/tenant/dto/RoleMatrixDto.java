package com.duavero.modules.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleMatrixDto {

    private List<RoleItemDto> roles;
    private List<PermissionItemDto> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleItemDto {
        private Long id;
        private String code;
        private String name;
        private String description;
        private boolean systemRole;
        private Set<String> permissionCodes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionItemDto {
        private Long id;
        private String module;
        private String action;
        private String code;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TogglePermissionRequest {
        private String permissionCode;
        private boolean enabled;
    }
}
