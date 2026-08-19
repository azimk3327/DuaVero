package com.duavero.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private Long tenantId;
    private String tenantSlug;
    private String tenantBusinessName;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String userType;
    private String status;
    private Set<String> roles;
    private Set<String> permissions;
}
