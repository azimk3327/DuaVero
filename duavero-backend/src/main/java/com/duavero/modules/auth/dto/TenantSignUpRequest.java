package com.duavero.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantSignUpRequest {

    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name cannot exceed 150 characters")
    private String businessName;

    @NotBlank(message = "Subdomain slug is required")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase alphanumeric characters and hyphens")
    @Size(min = 3, max = 80, message = "Slug must be between 3 and 80 characters")
    private String slug;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Invalid contact email format")
    private String contactEmail;

    @NotBlank(message = "Contact phone is required")
    private String contactPhone;

    @NotBlank(message = "Owner first name is required")
    private String ownerFirstName;

    @NotBlank(message = "Owner last name is required")
    private String ownerLastName;

    @NotBlank(message = "Owner login email is required")
    @Email(message = "Invalid owner email format")
    private String ownerEmail;

    private String ownerPhone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private String packageCode;
}
