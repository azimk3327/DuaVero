package com.duavero.core.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI duaveroOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("DuaVero Platform REST API")
                        .description("Multi-Tenant SaaS Platform API for Home Decor & Fabrication Businesses")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("DuaVero Engineering")
                                .email("engineering@duavero.com")
                                .url("https://duavero.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://duavero.com/terms")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT Bearer token to authorize requests.")));
    }
}
